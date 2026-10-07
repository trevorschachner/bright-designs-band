/**
 * Arrangement reads. Public reads are cached and tagged (./cache.ts); the
 * lookups used by invalidation are not. Every function throws on a database
 * failure; lookups return null for "not found".
 */

import { db } from '@/lib/database';
import { arrangements, arrangementsToTags, files, showArrangements, shows } from '@/lib/database/schema';
import { and, asc, eq, exists, inArray, sql, count } from 'drizzle-orm';
import { buildTableQuery } from '@/lib/filters/table-query';
import type { FilterState } from '@/lib/filters/types';
import { TAGS } from '@/lib/cache-tags';
import { cachedRead } from './cache';
import { PUBLIC_FILE_COLUMNS, type PublicFile } from './shows';

type TagRef = { id: number; name: string };

/** Columns a public arrangement exposes. No internal or copyright fields. */
export const ARRANGEMENT_PUBLIC_COLUMNS = {
  id: true,
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
  title: string;
  composer: string | null;
  arranger: string | null;
  scene: string | null;
  grade: string | null;
  year: number | null;
  durationSeconds: number | null;
  ensembleSize: string | null;
  sampleScoreUrl: string | null;
  files: { id: number; fileType: string; url: string }[];
  showArrangements: { show: { id: number; title: string; slug: string; thumbnailUrl: string | null } | null }[];
  tags: TagRef[];
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
      columns: {
        id: true,
        title: true,
        composer: true,
        arranger: true,
        scene: true,
        grade: true,
        year: true,
        durationSeconds: true,
        ensembleSize: true,
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
          with: { show: { columns: { id: true, title: true, slug: true, thumbnailUrl: true } } },
        },
        arrangementsToTags: { columns: {}, with: { tag: { columns: { id: true, name: true } } } },
      },
    }),
  ]);

  const data: ArrangementListItem[] = rows.map(({ arrangementsToTags: at, ...row }) => ({
    ...row,
    files: row.files ?? [],
    showArrangements: row.showArrangements ?? [],
    tags: (at ?? []).map((r) => r.tag).filter((t): t is TagRef => Boolean(t)),
  }));

  return { data, total: Number(totalResult[0]?.count ?? 0) };
}

export const getArrangementsPage = cachedRead('arrangements-page-v2', fetchArrangementsPage, {
  tags: () => [TAGS.arrangements, TAGS.shows, TAGS.tags],
  atBuildWithoutDb: { data: [] as ArrangementListItem[], total: 0 },
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

export const getArrangementForApi = cachedRead('arrangement-api-v2', fetchArrangementForApi, {
  tags: (id) => [TAGS.arrangements, TAGS.arrangement(id), TAGS.shows, TAGS.tags],
  atBuildWithoutDb: null as ArrangementApiDetail | null,
});

async function fetchPublicArrangementFiles(arrangementId: number): Promise<PublicFile[]> {
  return db
    .select(PUBLIC_FILE_COLUMNS)
    .from(files)
    .where(and(eq(files.arrangementId, arrangementId), eq(files.isPublic, true)))
    .orderBy(files.displayOrder);
}

/** An arrangement's public files (audio, art, scores), in display order. */
export const getPublicArrangementFiles = cachedRead('arrangement-public-files-v2', fetchPublicArrangementFiles, {
  tags: (arrangementId) => [TAGS.arrangements, TAGS.arrangement(arrangementId)],
  atBuildWithoutDb: [] as PublicFile[],
});

// ---------------------------------------------------------------------------
// Uncached lookups for invalidation
// ---------------------------------------------------------------------------

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
