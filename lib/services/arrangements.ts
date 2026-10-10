/**
 * Arrangement reads. Public reads are cached and tagged (./cache.ts); the
 * lookups used by invalidation are not. Every function throws on a database
 * failure; lookups return null for "not found".
 */

import { db } from '@/lib/database';
import { arrangementPieces, arrangements, arrangementsToTags, files, showArrangements, shows } from '@/lib/database/schema';
import { and, asc, eq, exists, inArray, sql, count } from 'drizzle-orm';
import { buildTableQuery } from '@/lib/filters/table-query';
import type { FilterState } from '@/lib/filters/types';
import { TAGS } from '@/lib/cache-tags';
import { cachedRead, REVALIDATE_SECONDS, SEARCH_REVALIDATE_SECONDS } from './cache';
import type { PublicFile } from './shows';

type TagRef = { id: number; name: string };

/** Columns a public arrangement exposes. No internal or copyright fields. */
export const ARRANGEMENT_PUBLIC_COLUMNS = {
  id: true,
  slug: true,
  title: true,
  composer: true,
  arranger: true,
  percussionArranger: true,
  description: true,
  grade: true,
  year: true,
  durationSeconds: true,
  scene: true,
  ensembleSize: true,
  youtubeUrl: true,
  commissioned: true,
  sampleScoreUrl: true,
  displayOrder: true,
} as const;

// ---------------------------------------------------------------------------
// /api/arrangements (catalog list)
// ---------------------------------------------------------------------------

/**
 * What a catalog row (app/arrangements/page.tsx) renders, and nothing else.
 * `files` holds at most the first public audio file and `showArrangements` the
 * parent show, both in the shapes the page already reads.
 */
export type ArrangementListItem = {
  id: number;
  slug: string;
  title: string;
  composer: string | null;
  durationSeconds: number | null;
  sampleScoreUrl: string | null;
  files: { id: number; fileType: string; url: string }[];
  showArrangements: { show: { id: number; title: string; slug: string } | null }[];
};

/**
 * One page of the arrangements catalog. Throws UnknownFilterFieldError for a
 * filter naming a field arrangements does not have (the route answers 400).
 */
async function fetchArrangementsPage(
  filterState: FilterState
): Promise<{ data: ArrangementListItem[]; total: number }> {
  const page = filterState.page || 1;
  const limit = filterState.limit || 25;
  const offset = (page - 1) * limit;

  const { where, orderBy } = buildTableQuery(arrangements, filterState, {
    // 'name' used to be listed here but arrangements has no such column,
    // so buildSearchCondition silently discarded it.
    searchable: ['title', 'composer', 'arranger'],
    relations: {
      tags: (tagIds) =>
        exists(
          db
            .select({ one: sql`1` })
            .from(arrangementsToTags)
            .where(
              and(
                eq(arrangementsToTags.arrangementId, arrangements.id),
                inArray(arrangementsToTags.tagId, tagIds)
              )
            )
        ),
    },
    defaultOrderBy: [arrangements.title],
  });

  const countQuery = db.select({ count: count() }).from(arrangements);
  const [totalResult, rows] = await Promise.all([
    where ? countQuery.where(where) : countQuery,
    db.query.arrangements.findMany({
      limit,
      offset,
      where,
      orderBy,
      // Only what a catalog row renders. Search and filters still cover
      // arranger and scene; they act in SQL and need no projection.
      columns: {
        id: true,
        slug: true,
        title: true,
        composer: true,
        durationSeconds: true,
        sampleScoreUrl: true,
      },
      with: {
        // One audio file per row, not every public file the arrangement has.
        files: {
          columns: { id: true, fileType: true, url: true },
          where: and(eq(files.isPublic, true), eq(files.fileType, 'audio')),
          orderBy: [files.displayOrder, files.createdAt],
          limit: 1,
        },
        showArrangements: {
          columns: {},
          limit: 1,
          with: { show: { columns: { id: true, title: true, slug: true } } },
        },
      },
    }),
  ]);

  const data: ArrangementListItem[] = rows.map((row) => ({
    ...row,
    files: row.files ?? [],
    showArrangements: row.showArrangements ?? [],
  }));

  return { data, total: Number(totalResult[0]?.count ?? 0) };
}

/** Cached per serialised filter; call it through `queryArrangements` (./catalog.ts). */
export const getArrangementsPage = cachedRead('arrangements-page-v4', fetchArrangementsPage, {
  tags: () => [TAGS.arrangements, TAGS.shows, TAGS.tags],
  atBuildWithoutDb: { data: [] as ArrangementListItem[], total: 0 },
  revalidate: (filterState) => (filterState.search ? SEARCH_REVALIDATE_SECONDS : REVALIDATE_SECONDS),
});

// ---------------------------------------------------------------------------
// /api/arrangements/[id] and the arrangement detail page
// ---------------------------------------------------------------------------

async function fetchArrangementForApi(id: number) {
  const row = await db.query.arrangements.findFirst({
    where: eq(arrangements.id, id),
    columns: ARRANGEMENT_PUBLIC_COLUMNS,
    with: {
      files: {
        columns: {
          id: true,
          fileName: true,
          originalName: true,
          fileType: true,
          fileSize: true,
          mimeType: true,
          url: true,
          isPublic: true,
          description: true,
          displayOrder: true,
          showId: true,
          arrangementId: true,
        },
        where: eq(files.isPublic, true),
        orderBy: [files.displayOrder],
      },
      showArrangements: {
        columns: { showId: true, arrangementId: true, orderIndex: true },
        with: { show: { columns: { id: true, title: true, thumbnailUrl: true, graphicUrl: true } } },
      },
      arrangementsToTags: {
        columns: { arrangementId: true, tagId: true },
        with: { tag: { columns: { id: true, name: true } } },
      },
    },
  });
  return row ?? null;
}

export type ArrangementApiDetail = NonNullable<Awaited<ReturnType<typeof fetchArrangementForApi>>>;

export const getArrangementForApi = cachedRead('arrangement-api-v3', fetchArrangementForApi, {
  tags: (id) => [TAGS.arrangements, TAGS.arrangement(id), TAGS.shows, TAGS.tags],
  atBuildWithoutDb: null as ArrangementApiDetail | null,
});

// ---------------------------------------------------------------------------
// /arrangements/[slug] (page, metadata and OG image)
// ---------------------------------------------------------------------------

/** The parent show as the detail page renders it: link, title and art. */
export type ArrangementDetailShow = {
  id: number;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  graphicUrl: string | null;
  /** The show's first public image file: the art fallback after graphic/thumbnail. */
  imageUrl: string | null;
};

export type ArrangementDetail = {
  id: number;
  slug: string;
  title: string;
  composer: string | null;
  arranger: string | null;
  percussionArranger: string | null;
  description: string | null;
  grade: string | null;
  year: number | null;
  durationSeconds: number | null;
  scene: string | null;
  ensembleSize: string | null;
  commissioned: string | null;
  sampleScoreUrl: string | null;
  /** The first show (by order index) the arrangement belongs to, or null. */
  show: ArrangementDetailShow | null;
  /** Public files only, in display order. */
  files: PublicFile[];
  /** Source pieces in order: title and composer only, never licensing cost. */
  pieces: { id: number; title: string; composer: string | null }[];
};

/**
 * What /arrangements/[slug] renders, in one relational query (Drizzle compiles
 * the nested `with` into a single SQL statement with lateral joins).
 */
async function fetchArrangementDetail(slug: string): Promise<ArrangementDetail | null> {
  if (!slug) return null;
  const row = await db.query.arrangements.findFirst({
    where: eq(arrangements.slug, slug),
    columns: {
      id: true,
      slug: true,
      title: true,
      composer: true,
      arranger: true,
      percussionArranger: true,
      description: true,
      grade: true,
      year: true,
      durationSeconds: true,
      scene: true,
      ensembleSize: true,
      commissioned: true,
      sampleScoreUrl: true,
    },
    with: {
      showArrangements: {
        columns: {},
        // Same parent as getShowSlugForArrangement, so invalidation expires
        // the show page this one links to.
        orderBy: [asc(showArrangements.orderIndex)],
        limit: 1,
        with: {
          show: {
            columns: { id: true, title: true, slug: true, thumbnailUrl: true, graphicUrl: true },
            with: {
              files: {
                columns: { url: true },
                where: and(eq(files.isPublic, true), eq(files.fileType, 'image')),
                orderBy: [asc(files.displayOrder)],
                limit: 1,
              },
            },
          },
        },
      },
      files: {
        columns: {
          id: true,
          fileName: true,
          originalName: true,
          fileType: true,
          url: true,
          isPublic: true,
          description: true,
          displayOrder: true,
        },
        where: eq(files.isPublic, true),
        orderBy: [asc(files.displayOrder)],
      },
      arrangementPieces: {
        columns: {},
        orderBy: [asc(arrangementPieces.orderIndex)],
        with: { piece: { columns: { id: true, title: true, composer: true } } },
      },
    },
  });
  if (!row) return null;

  const { showArrangements: parents, files: fileRows, arrangementPieces: pieceRows, ...arrangement } = row;
  const parent = parents[0]?.show ?? null;
  return {
    ...arrangement,
    show: parent
      ? {
          id: parent.id,
          title: parent.title,
          slug: parent.slug,
          thumbnailUrl: parent.thumbnailUrl,
          graphicUrl: parent.graphicUrl,
          imageUrl: parent.files[0]?.url ?? null,
        }
      : null,
    files: fileRows,
    pieces: pieceRows.map((p) => p.piece).filter((p): p is NonNullable<typeof p> => Boolean(p)),
  };
}

/**
 * An arrangement's detail page data by public slug, or null. Tagged with
 * everything it reads: the arrangements list tag (every arrangement write
 * expires it; the per-id tag cannot be named from a slug), its parent show
 * (and that show's art files, which invalidate through `invalidateShow`), and
 * its pieces.
 */
export const getArrangementBySlug = cachedRead('arrangement-detail-v2', fetchArrangementDetail, {
  tags: () => [TAGS.arrangements, TAGS.shows, TAGS.pieces],
  atBuildWithoutDb: null as ArrangementDetail | null,
});

// ---------------------------------------------------------------------------
// Uncached lookups for invalidation
// ---------------------------------------------------------------------------

/** The public slug of an arrangement, uncached; null when no such id. */
export async function getArrangementSlugById(id: number): Promise<string | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  const [row] = await db.select({ slug: arrangements.slug }).from(arrangements).where(eq(arrangements.id, id)).limit(1);
  return row?.slug ?? null;
}

/** Slug of the (first) show an arrangement belongs to, uncached. */
export async function getShowSlugForArrangement(arrangementId: number): Promise<string | null> {
  const [row] = await db
    .select({ slug: shows.slug })
    .from(showArrangements)
    .innerJoin(shows, eq(shows.id, showArrangements.showId))
    .where(eq(showArrangements.arrangementId, arrangementId))
    .orderBy(asc(showArrangements.orderIndex))
    .limit(1);
  return row?.slug ?? null;
}
