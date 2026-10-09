/**
 * Show reads. Public reads are cached (see ./cache.ts and ./README.md); admin
 * reads (`...ForAdmin`) and the slug lookups used by invalidation are not.
 *
 * Error policy: every function throws on a database failure. Lookups return
 * null for "no such show", and pages turn that into notFound().
 */

import { db } from '@/lib/database';
import { shows, showsToTags, showArrangements, files, tags, slugRedirects } from '@/lib/database/schema';
import { and, desc, eq, exists, ilike, inArray, ne, sql, count, type SQL } from 'drizzle-orm';
import { likePattern } from '@/lib/filters/admin-search';
import { buildTableQuery } from '@/lib/filters/table-query';
import type { FilterCondition, SortCondition } from '@/lib/filters/types';
import { STORAGE_BUCKET, withRootPrefix } from '@/lib/storage';
import { shouldSkipSupabase } from '@/lib/env';
import { publicStorageUrl } from '@/lib/media/public-url';
import { TAGS } from '@/lib/cache-tags';
import { cachedRead, toIso, REVALIDATE_SECONDS, SEARCH_REVALIDATE_SECONDS } from './cache';
import type { EnsembleSize } from '@/lib/validation/enums';
import { PG_UNDEFINED_TABLE, postgresCode } from '@/lib/database/errors';

// ---------------------------------------------------------------------------
// Shared shapes and helpers
// ---------------------------------------------------------------------------

export type ShowDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';
type TagRef = { id: number; name: string };

export type ShowSummary = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  year: number | null;
  difficulty: ShowDifficulty | null;
  duration: string | null;
  thumbnailUrl: string | null;
  graphicUrl: string | null;
  featured: boolean;
  createdAt: string | null;
  showsToTags: { tag: TagRef }[];
  arrangements: { id: number; title: string | null; scene: string | null }[];
};

/** Storage path or absolute URL to a public URL. Null when it cannot be built. */
export function toPublicUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (shouldSkipSupabase()) return null;
  try {
    return publicStorageUrl(STORAGE_BUCKET, withRootPrefix(path));
  } catch {
    return null;
  }
}

/** Every card read of shows selects exactly these columns. */
const SUMMARY_COLUMNS = {
  id: true,
  title: true,
  slug: true,
  description: true,
  year: true,
  difficulty: true,
  duration: true,
  thumbnailUrl: true,
  graphicUrl: true,
  featured: true,
  createdAt: true,
} as const;

/** Columns a public show detail exposes. No price: pricing is by conversation. */
export const SHOW_DETAIL_COLUMNS = {
  id: true,
  slug: true,
  title: true,
  description: true,
  year: true,
  difficulty: true,
  duration: true,
  programNotes: true,
  ensembleSize: true,
  includes: true,
  thumbnailUrl: true,
  graphicUrl: true,
  videoUrl: true,
  youtubeUrl: true,
  commissioned: true,
  programCoordinator: true,
  percussionArranger: true,
  soundDesigner: true,
  windArranger: true,
  drillWriter: true,
  featured: true,
  displayOrder: true,
  createdAt: true,
  updatedAt: true,
} as const;

const TAG_COLUMNS = { id: true, name: true } as const;

const withTags = { columns: {}, with: { tag: { columns: TAG_COLUMNS } } } as const;

/** Drops relation rows whose tag is gone and keeps the `{ tag }` envelope. */
function presentTags(rows: { tag: TagRef | null }[]): { tag: TagRef }[] {
  return rows.filter((r): r is { tag: TagRef } => Boolean(r.tag)).map((r) => ({ tag: { id: r.tag.id, name: r.tag.name } }));
}

/** The relations a show card needs: tags, arrangement titles, one fallback image. */
function summaryRelations() {
  return {
    showsToTags: withTags,
    showArrangements: {
      columns: {},
      orderBy: [showArrangements.orderIndex],
      with: { arrangement: { columns: { id: true, title: true, scene: true } } },
    },
    files: {
      columns: { storagePath: true },
      where: and(eq(files.isPublic, true), eq(files.fileType, 'image')),
      limit: 1,
    },
  };
}

type SummaryRow = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  year: number | null;
  difficulty: ShowDifficulty | null;
  duration: string | null;
  thumbnailUrl: string | null;
  graphicUrl: string | null;
  featured: boolean;
  createdAt: Date | string;
  showsToTags: { tag: TagRef | null }[];
  showArrangements: { arrangement: { id: number; title: string | null; scene: string | null } | null }[];
  files: { storagePath: string }[];
};

function toSummary(s: SummaryRow): ShowSummary {
  const fallbackImage = s.files?.[0]?.storagePath ?? null;
  return {
    id: s.id,
    title: s.title,
    slug: s.slug,
    description: s.description,
    year: s.year,
    difficulty: s.difficulty,
    duration: s.duration,
    thumbnailUrl: toPublicUrl(s.thumbnailUrl || fallbackImage),
    graphicUrl: toPublicUrl(s.graphicUrl || fallbackImage),
    featured: s.featured,
    createdAt: toIso(s.createdAt),
    showsToTags: presentTags(s.showsToTags),
    arrangements: s.showArrangements
      .map((sa) => sa.arrangement)
      .filter((a): a is { id: number; title: string | null; scene: string | null } => Boolean(a)),
  };
}

/** Card and list reads join arrangements and tags, so they carry those tags too. */
const LIST_TAGS = () => [TAGS.shows, TAGS.arrangements, TAGS.tags];

async function fetchRelatedShows(showId: number, difficulty: ShowDifficulty | null, tagNames: string[]): Promise<ShowSummary[]> {
  const themes = tagNames.filter((t) => t.startsWith('Theme: '));
  const rows = await db.query.shows.findMany({
    columns: SUMMARY_COLUMNS,
    where: ne(shows.id, showId),
    orderBy: [desc(shows.createdAt)],
    limit: 40,
    with: summaryRelations(),
  });
  const summaries = (rows as SummaryRow[]).map(toSummary);
  const sameTheme = summaries.filter((s) => s.showsToTags.some((r) => themes.includes(r.tag.name)));
  const sameLevel = summaries.filter((s) => s.difficulty === difficulty && !sameTheme.includes(s));
  return [...sameTheme, ...sameLevel].slice(0, 3);
}

/** Up to 3 shows to link from a show page: same theme tag first, then same difficulty. */
export const getRelatedShows = cachedRead('related-shows-v1', fetchRelatedShows, {
  tags: () => [TAGS.shows, TAGS.tags],
  atBuildWithoutDb: [] as ShowSummary[],
});

// ---------------------------------------------------------------------------
// Home page and collections
// ---------------------------------------------------------------------------

async function fetchFeaturedShows(): Promise<ShowSummary[]> {
  const rows = await db.query.shows.findMany({
    columns: SUMMARY_COLUMNS,
    where: eq(shows.featured, true),
    orderBy: [desc(shows.createdAt)],
    limit: 6,
    with: summaryRelations(),
  });
  return (rows as SummaryRow[]).map(toSummary);
}

/**
 * Whatever is featured, newest first, at most six. An empty list is a real
 * answer (nothing featured), and the home page renders its fallback copy.
 */
export const getFeaturedShows = cachedRead('featured-shows-v4', fetchFeaturedShows, {
  tags: LIST_TAGS,
  atBuildWithoutDb: [] as ShowSummary[],
});

export type ShowFilter = { difficulty?: ShowDifficulty; tag?: string };

async function fetchShowsByFilter(filter: ShowFilter): Promise<ShowSummary[]> {
  const conditions: SQL[] = [];
  if (filter.difficulty) conditions.push(eq(shows.difficulty, filter.difficulty));
  if (filter.tag) {
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(showsToTags)
          .innerJoin(tags, eq(tags.id, showsToTags.tagId))
          .where(and(eq(showsToTags.showId, shows.id), eq(tags.name, filter.tag)))
      )
    );
  }

  const rows = await db.query.shows.findMany({
    columns: SUMMARY_COLUMNS,
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(shows.createdAt)],
    limit: 12,
    with: summaryRelations(),
  });
  return (rows as SummaryRow[]).map(toSummary);
}

/** Shows for a collection landing page (difficulty and/or tag name). */
export const getShowsByFilter = cachedRead('collection-shows-v2', fetchShowsByFilter, {
  tags: LIST_TAGS,
  atBuildWithoutDb: [] as ShowSummary[],
});

// ---------------------------------------------------------------------------
// /api/shows (catalog list)
// ---------------------------------------------------------------------------

export interface ShowsPageParams {
  search?: string;
  conditions: FilterCondition[];
  sort: SortCondition[];
  page: number;
  limit: number;
  featured?: boolean;
}

export type ShowListItem = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  year: number | null;
  difficulty: ShowDifficulty | null;
  duration: string | null;
  thumbnailUrl: string | null;
  graphicUrl: string | null;
  featured: boolean;
  displayOrder: number;
  createdAt: string | null;
  arrangements: {
    id: number;
    title: string;
    scene: string | null;
    durationSeconds: number | null;
    sampleScoreUrl: string | null;
  }[];
  showsToTags: { tag: TagRef }[];
};

/** The admin table's row: the public item plus `price`, which is never public. */
export type AdminShowListItem = ShowListItem & { price: number | null };

/**
 * One page of the catalog. Throws UnknownFilterFieldError for a filter naming
 * a field shows does not have; the route turns that into a 400. `price` is
 * selected only for the admin read: the public projection never contains it.
 */
async function fetchShowsRows(
  params: ShowsPageParams,
  includePrice: boolean,
  titleQuery?: string
): Promise<{ data: (ShowListItem | AdminShowListItem)[]; total: number }> {
  const { search, conditions, sort, page, limit, featured } = params;
  const offset = (page - 1) * limit;

  const { where, orderBy } = buildTableQuery(
    shows,
    { search, conditions, sort },
    {
      searchable: ['title', 'description'],
      relations: {
        tags: (tagIds) =>
          exists(
            db
              .select({ one: sql`1` })
              .from(showsToTags)
              .where(and(eq(showsToTags.showId, shows.id), inArray(showsToTags.tagId, tagIds)))
          ),
      },
      extra: [
        ...(featured ? [eq(shows.featured, true)] : []),
        ...(titleQuery ? [ilike(shows.title, likePattern(titleQuery))] : []),
      ],
      defaultOrderBy: [shows.displayOrder, desc(shows.createdAt)],
    }
  );

  const countQuery = db.select({ count: count() }).from(shows);
  const [totalResult, rows] = await Promise.all([
    where ? countQuery.where(where) : countQuery,
    db.query.shows.findMany({
      limit,
      offset,
      where,
      orderBy,
      columns: {
        id: true, slug: true, title: true, description: true, year: true,
        difficulty: true, duration: true, price: includePrice, graphicUrl: true,
        thumbnailUrl: true, featured: true, displayOrder: true, createdAt: true,
      },
      with: {
        files: {
          columns: { url: true },
          where: and(eq(files.isPublic, true), eq(files.fileType, 'image')),
          orderBy: [files.displayOrder],
          limit: 1,
        },
        showsToTags: withTags,
        showArrangements: {
          columns: {},
          orderBy: [showArrangements.orderIndex],
          with: {
            arrangement: {
              columns: { id: true, title: true, scene: true, durationSeconds: true, sampleScoreUrl: true },
            },
          },
        },
      },
    }),
  ]);

  const data = rows.map((r): ShowListItem | AdminShowListItem => {
    const graphicUrl = toPublicUrl(r.graphicUrl);
    const thumbnailUrl = toPublicUrl(r.thumbnailUrl);
    const fallbackUrl = r.files?.[0]?.url ? toPublicUrl(r.files[0].url) : null;
    const item: ShowListItem = {
      id: r.id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      year: r.year,
      difficulty: r.difficulty,
      duration: r.duration,
      thumbnailUrl: graphicUrl || thumbnailUrl || fallbackUrl,
      graphicUrl: graphicUrl || null,
      featured: !!r.featured,
      displayOrder: r.displayOrder ?? 0,
      createdAt: toIso(r.createdAt),
      arrangements: (r.showArrangements || [])
        .map((sa) => sa.arrangement)
        .filter((a): a is NonNullable<typeof a> => Boolean(a)),
      showsToTags: presentTags(r.showsToTags || []),
    };
    if (!includePrice) return item;
    const price = (r as { price?: string | null }).price;
    return { ...item, price: price ? Number(price) : null };
  });

  return { data, total: Number(totalResult[0]?.count ?? 0) };
}

/** The public page: no `price` is selected, so none can reach a response. */
async function fetchShowsPage(params: ShowsPageParams): Promise<{ data: ShowListItem[]; total: number }> {
  return fetchShowsRows(params, false);
}

/**
 * Cached per serialised params. Call it through lib/services/catalog.ts
 * (`queryShows`), which bounds and canonicalises the params first. A searched
 * page lives 5 minutes instead of an hour: free text is the one input with a
 * long tail of one-off values.
 */
export const getShowsPage = cachedRead('shows-page-v2', fetchShowsPage, {
  tags: LIST_TAGS,
  atBuildWithoutDb: { data: [] as ShowListItem[], total: 0 },
  revalidate: (params) => (params.search ? SEARCH_REVALIDATE_SECONDS : REVALIDATE_SECONDS),
});

/**
 * The same page, uncached and with `price`, for the admin shows table. `q` is
 * the table's title search (`ilike`); the public page has no such parameter.
 */
export function getShowsPageForAdmin(params: ShowsPageParams & { q?: string }) {
  const { q, ...page } = params;
  return fetchShowsRows(page, true, q) as Promise<{ data: AdminShowListItem[]; total: number }>;
}

// ---------------------------------------------------------------------------
// Show detail page (/shows/[slug]) and its OG image
// ---------------------------------------------------------------------------

export type ShowDetailRow = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  year: number | null;
  difficulty: ShowDifficulty | null;
  duration: string | null;
  programNotes: string | null;
  ensembleSize: EnsembleSize | null;
  includes: string | null;
  thumbnailUrl: string | null;
  graphicUrl: string | null;
  videoUrl: string | null;
  youtubeUrl: string | null;
  commissioned: string | null;
  programCoordinator: string | null;
  percussionArranger: string | null;
  soundDesigner: string | null;
  windArranger: string | null;
  drillWriter: string | null;
  featured: boolean;
  displayOrder: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ShowWithTags = {
  show: ShowDetailRow;
  showsToTags: { tag: TagRef }[];
};

async function findShowWithTags(where: SQL): Promise<ShowWithTags | null> {
  const row = await db.query.shows.findFirst({
    columns: SHOW_DETAIL_COLUMNS,
    where,
    with: { showsToTags: withTags },
  });
  if (!row) return null;
  const { showsToTags: tagRelations, ...rest } = row;
  return {
    show: { ...rest, createdAt: toIso(rest.createdAt), updatedAt: toIso(rest.updatedAt) },
    showsToTags: presentTags(tagRelations),
  };
}

/**
 * A show by its exact slug. Null when nothing matches. There is no fuzzy
 * fallback: slugs are stored in canonical form (lib/slug.ts, enforced by
 * lib/validation/shows.ts and the unique index from
 * drizzle/migrations/2026-10-07_shows_slug_unique.sql), and old numeric
 * `/shows/<id>` links are redirected by proxy.ts before they reach the page.
 */
async function fetchShowBySlug(slug: string): Promise<ShowWithTags | null> {
  return findShowWithTags(eq(shows.slug, slug));
}

export const getShowBySlug = cachedRead('show-by-slug-v3', fetchShowBySlug, {
  tags: () => [TAGS.shows, TAGS.tags],
  atBuildWithoutDb: null as ShowWithTags | null,
});

let warnedMissingRedirectTable = false;

async function fetchSlugRedirect(oldSlug: string): Promise<string | null> {
  let row: { slug: string } | undefined;
  try {
    [row] = await db
      .select({ slug: shows.slug })
      .from(slugRedirects)
      .innerJoin(shows, eq(shows.id, slugRedirects.showId))
      .where(eq(slugRedirects.oldSlug, oldSlug))
      .limit(1);
  } catch (error) {
    // The one tolerated failure in this file (README rule 4): before
    // drizzle/0003 is applied the table does not exist, and a public miss
    // must still 404, not error. Logged once per process. Anything else throws.
    if (postgresCode(error) !== PG_UNDEFINED_TABLE) throw error;
    if (!warnedMissingRedirectTable) {
      warnedMissingRedirectTable = true;
      console.error('[getSlugRedirect] slug_redirects does not exist; apply drizzle/0003. Treating as no redirect.');
    }
    return null;
  }
  // Never redirect a slug to itself (a loop); lib/actions/shows.ts deletes a
  // redirect row when a show claims its slug, so this is belt and braces.
  return row && row.slug !== oldSlug ? row.slug : null;
}

/**
 * The current slug of the show that used to live at `oldSlug`, or null.
 * Rows are written by lib/actions/shows.ts `updateShow` on a slug change.
 * Joined to `shows`, so a show renamed twice redirects straight to its latest
 * slug. Tagged `shows`: every show write (invalidateShow) expires it.
 */
export const getSlugRedirect = cachedRead('slug-redirect-v1', fetchSlugRedirect, {
  tags: () => [TAGS.shows],
  atBuildWithoutDb: null as string | null,
});

export type ShowArrangementFile = {
  id: number;
  fileName: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
  url: string;
  storagePath: string;
  isPublic: boolean;
  description: string | null;
  displayOrder: number;
};

export type ShowArrangement = {
  id: number;
  title: string;
  scene: string | null;
  composer: string | null;
  arranger: string | null;
  grade: string | null;
  year: number | null;
  durationSeconds: number | null;
  description: string;
  percussionArranger: string | null;
  ensembleSize: string | null;
  youtubeUrl: string | null;
  commissioned: string | null;
  sampleScoreUrl: string | null;
  orderIndex: number;
  files: ShowArrangementFile[];
  audioUrl: string | null;
};

/** A show's arrangements in show order, each with its public files, in one query. */
async function fetchShowArrangements(showId: number): Promise<ShowArrangement[]> {
  const result = await db.execute(sql`
    SELECT
      a.id as arrangement_id,
      a.title as arrangement_title,
      a.scene,
      a.composer,
      a.arranger,
      a.grade,
      a.year as arrangement_year,
      a.duration_seconds,
      a.description as arrangement_description,
      a.percussion_arranger,
      a.ensemble_size,
      a.youtube_url as arrangement_youtube_url,
      a.commissioned as arrangement_commissioned,
      a.sample_score_url,
      sa.order_index,
      f.id as file_id,
      f.file_name,
      f.original_name,
      f.file_type,
      f.file_size,
      f.mime_type,
      f.url as file_url,
      f.storage_path,
      f.is_public,
      f.description as file_description,
      f.display_order as file_display_order
    FROM show_arrangements sa
    INNER JOIN arrangements a ON sa.arrangement_id = a.id
    LEFT JOIN files f ON f.arrangement_id = a.id AND f.is_public = true
    WHERE sa.show_id = ${showId}
    ORDER BY sa.order_index, f.display_order
  `);

  const rows = (Array.isArray(result) ? result : ((result as { rows?: unknown[] }).rows ?? [])) as Record<string, any>[];
  const byId = new Map<number, ShowArrangement>();

  for (const row of rows) {
    const arrId = Number(row.arrangement_id);
    let arrangement = byId.get(arrId);
    if (!arrangement) {
      arrangement = {
        id: arrId,
        title: row.arrangement_title,
        scene: row.scene ?? null,
        composer: row.composer ?? null,
        arranger: row.arranger ?? null,
        grade: row.grade ?? null,
        year: row.arrangement_year ?? null,
        durationSeconds: row.duration_seconds ?? null,
        description: row.arrangement_description || '',
        percussionArranger: row.percussion_arranger ?? null,
        ensembleSize: row.ensemble_size ?? null,
        youtubeUrl: row.arrangement_youtube_url ?? null,
        commissioned: row.arrangement_commissioned ?? null,
        sampleScoreUrl: row.sample_score_url ?? null,
        orderIndex: row.order_index ?? 0,
        files: [],
        audioUrl: null,
      };
      byId.set(arrId, arrangement);
    }
    if (row.file_id) {
      arrangement.files.push({
        id: Number(row.file_id),
        fileName: row.file_name,
        originalName: row.original_name,
        fileType: row.file_type,
        fileSize: row.file_size,
        mimeType: row.mime_type,
        url: row.file_url,
        storagePath: row.storage_path,
        isPublic: row.is_public,
        description: row.file_description ?? null,
        displayOrder: row.file_display_order ?? 0,
      });
    }
  }

  return Array.from(byId.values()).map((arr) => ({
    ...arr,
    audioUrl: arr.files.find((f) => f.fileType === 'audio')?.url ?? null,
  }));
}

export const getShowArrangements = cachedRead('show-arrangements-v2', fetchShowArrangements, {
  tags: (showId) => [TAGS.shows, TAGS.show(showId), TAGS.arrangements],
  atBuildWithoutDb: [] as ShowArrangement[],
});

export type PublicFile = {
  id: number;
  fileName: string;
  originalName: string;
  fileType: string;
  url: string;
  isPublic: boolean;
  description: string | null;
  displayOrder: number;
};

/** The columns a public page may show for a file. Never storage internals. */
export const PUBLIC_FILE_COLUMNS = {
  id: files.id,
  fileName: files.fileName,
  originalName: files.originalName,
  fileType: files.fileType,
  url: files.url,
  isPublic: files.isPublic,
  description: files.description,
  displayOrder: files.displayOrder,
};

async function fetchPublicShowFiles(showId: number): Promise<PublicFile[]> {
  return db
    .select(PUBLIC_FILE_COLUMNS)
    .from(files)
    .where(and(eq(files.showId, showId), eq(files.isPublic, true)))
    .orderBy(files.displayOrder);
}

/** A show's own public files (its art), in display order. */
export const getPublicShowFiles = cachedRead('show-public-files-v2', fetchPublicShowFiles, {
  tags: (showId) => [TAGS.shows, TAGS.show(showId)],
  atBuildWithoutDb: [] as PublicFile[],
});

async function fetchAllShowSlugs(): Promise<string[]> {
  const rows = await db.select({ slug: shows.slug }).from(shows);
  return rows.map((r) => r.slug).filter(Boolean);
}

/** Every show slug, for generateStaticParams. */
export const getAllShowSlugs = cachedRead('show-slugs-v1', fetchAllShowSlugs, {
  tags: () => [TAGS.shows],
  atBuildWithoutDb: [] as string[],
});

export type ShowIndexEntry = {
  slug: string;
  title: string;
  description: string | null;
  year: number | null;
  difficulty: ShowDifficulty | null;
  programNotes: string | null;
};

async function fetchShowIndex(): Promise<ShowIndexEntry[]> {
  const rows = await db
    .select({
      slug: shows.slug,
      title: shows.title,
      description: shows.description,
      year: shows.year,
      difficulty: shows.difficulty,
      programNotes: shows.programNotes,
    })
    .from(shows)
    .orderBy(desc(shows.year), shows.title);
  return rows.filter((r) => r.slug);
}

/** Every show's title, year, difficulty and description, for /llms.txt and /llms-full.txt. */
export const getShowIndex = cachedRead('show-index-v1', fetchShowIndex, {
  tags: () => [TAGS.shows],
  atBuildWithoutDb: [] as ShowIndexEntry[],
});

// ---------------------------------------------------------------------------
// /api/shows/[id]
// ---------------------------------------------------------------------------

export type ShowApiDetail = ShowDetailRow & {
  showsToTags: { tag: TagRef }[];
  arrangements: Record<string, unknown>[];
};

/**
 * A route id is either a numeric primary key or an exact slug. There is no
 * fuzzy fallback: the old `slug LIKE '<id>-%'` match could resolve to, and then
 * update, a different show. All digits means id, so a slug that starts with a
 * number (`1984-show`) is still looked up as a slug.
 */
export function showWhere(id: string): SQL {
  return /^\d+$/.test(id) ? eq(shows.id, Number(id)) : eq(shows.slug, id);
}

async function fetchShowForApi(id: string): Promise<ShowApiDetail | null> {
  const show = await db.query.shows.findFirst({
    where: showWhere(id),
    columns: SHOW_DETAIL_COLUMNS,
    with: {
      showsToTags: withTags,
      showArrangements: {
        columns: {},
        orderBy: [showArrangements.orderIndex],
        with: {
          arrangement: {
            columns: {
              id: true, title: true, composer: true, arranger: true, percussionArranger: true,
              description: true, grade: true, year: true, durationSeconds: true, scene: true,
              ensembleSize: true, youtubeUrl: true, commissioned: true, sampleScoreUrl: true,
              displayOrder: true,
            },
            with: { arrangementsToTags: withTags },
          },
        },
      },
    },
  });
  if (!show) return null;

  const { showArrangements: sa, showsToTags: st, ...rest } = show;
  return {
    ...rest,
    createdAt: toIso(rest.createdAt),
    updatedAt: toIso(rest.updatedAt),
    showsToTags: presentTags(st),
    arrangements: sa
      .map((item) => item.arrangement)
      .filter((arr): arr is NonNullable<typeof arr> => Boolean(arr))
      .map(({ arrangementsToTags, ...arr }) => ({
        ...arr,
        tags: arrangementsToTags.map((at) => at.tag).filter(Boolean),
      })),
  };
}

export const getShowForApi = cachedRead('show-api-v2', fetchShowForApi, {
  tags: (id) => [TAGS.shows, TAGS.arrangements, TAGS.tags, ...(/^\d+$/.test(id) ? [TAGS.show(id)] : [])],
  atBuildWithoutDb: null as ShowApiDetail | null,
});

/** Same as getShowForApi, uncached, for the admin edit page. */
export function getShowForAdmin(id: string) {
  return fetchShowForApi(id);
}

// ---------------------------------------------------------------------------
// Uncached lookups for invalidation
// ---------------------------------------------------------------------------

/** A show's current slug, uncached. Null when the show does not exist. */
export async function getShowSlugById(showId: number): Promise<string | null> {
  const [row] = await db.select({ slug: shows.slug }).from(shows).where(eq(shows.id, showId)).limit(1);
  return row?.slug ?? null;
}
