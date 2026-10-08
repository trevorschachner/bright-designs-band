/**
 * Admin dashboard, arrangements list and inquiries reads. Uncached (staff must
 * see their own writes at once); they throw on a database failure.
 * Re-exported from ./admin.ts, which is where admin pages import them from.
 */

import { db } from '@/lib/database';
import {
  arrangementPieces,
  arrangements,
  contactSubmissions,
  files,
  showArrangements,
  shows,
} from '@/lib/database/schema';
import { and, asc, count, desc, eq, ilike, isNull, lt, or, sql, type SQL } from 'drizzle-orm';
import { likePattern } from '@/lib/filters/admin-search';
import { toIso } from './cache';

// ---------------------------------------------------------------------------
// Links into the editors
// ---------------------------------------------------------------------------

/** Arrangements are edited inside their show's editor; an orphan goes to the arrangements list. */
export function arrangementEditorHref(showSlug: string | null | undefined, title: string): string {
  return showSlug
    ? `/admin/shows/${encodeURIComponent(showSlug)}`
    : `/admin/arrangements?q=${encodeURIComponent(title)}`;
}

export const showEditorHref = (slug: string) => `/admin/shows/${encodeURIComponent(slug)}`;

/** Several shows can share a part: keep the first row per arrangement id. */
function firstPerId<T extends { id: number }>(rows: T[]): T[] {
  const seen = new Set<number>();
  return rows.filter((row) => (seen.has(row.id) ? false : (seen.add(row.id), true)));
}

/** Arrangement rows with the slug of one show that uses them (null for an orphan). */
function selectArrangementsWithShow() {
  return db
    .select({ id: arrangements.id, title: arrangements.title, updatedAt: arrangements.updatedAt, showSlug: shows.slug })
    .from(arrangements)
    .leftJoin(showArrangements, eq(showArrangements.arrangementId, arrangements.id))
    .leftJoin(shows, eq(shows.id, showArrangements.showId));
}

// ---------------------------------------------------------------------------
// Recently edited
// ---------------------------------------------------------------------------

export type RecentEdit = {
  kind: 'show' | 'arrangement';
  id: number;
  title: string;
  updatedAt: string;
  href: string;
};

/**
 * Newest first, ties broken shows-first then by id so the order is stable.
 * Pure: the read below feeds it both lists.
 */
export function mergeRecentEdits(showEdits: RecentEdit[], arrangementEdits: RecentEdit[], limit: number): RecentEdit[] {
  return [...showEdits, ...arrangementEdits]
    .sort(
      (a, b) =>
        Date.parse(b.updatedAt) - Date.parse(a.updatedAt) ||
        (a.kind === b.kind ? 0 : a.kind === 'show' ? -1 : 1) ||
        b.id - a.id,
    )
    .slice(0, limit);
}

/** The last `limit` shows and arrangements by `updated_at`, merged. */
export async function getRecentEdits(limit = 10): Promise<RecentEdit[]> {
  const [showRows, arrangementRows] = await Promise.all([
    db
      .select({ id: shows.id, slug: shows.slug, title: shows.title, updatedAt: shows.updatedAt })
      .from(shows)
      .orderBy(desc(shows.updatedAt), desc(shows.id))
      .limit(limit),
    // A shared part yields one row per show; over-fetch so dedupe still leaves `limit`.
    selectArrangementsWithShow()
      .orderBy(desc(arrangements.updatedAt), desc(arrangements.id))
      .limit(limit * 3),
  ]);

  const showEdits: RecentEdit[] = showRows.map((s) => ({
    kind: 'show',
    id: s.id,
    title: s.title,
    updatedAt: toIso(s.updatedAt) ?? '',
    href: showEditorHref(s.slug),
  }));
  const arrangementEdits: RecentEdit[] = firstPerId(arrangementRows).map((a) => ({
    kind: 'arrangement',
    id: a.id,
    title: a.title,
    updatedAt: toIso(a.updatedAt) ?? '',
    href: arrangementEditorHref(a.showSlug, a.title),
  }));
  return mergeRecentEdits(showEdits, arrangementEdits, limit);
}

// ---------------------------------------------------------------------------
// Needs attention
// ---------------------------------------------------------------------------

/** A description shorter than this (after trimming) counts as missing. */
export const SHORT_DESCRIPTION_CHARS = 40;
/** Items listed per attention group; the count covers all of them. */
export const ATTENTION_ITEMS = 8;

export type AttentionItem = { id: number; title: string; href: string };
export type AttentionGroup = { key: AttentionKey; label: string; count: number; items: AttentionItem[] };
export type AttentionKey = 'showsWithoutPoster' | 'showsWithShortDescription' | 'arrangementsWithoutAudio' | 'arrangementsWithoutPieces';

/** The conditions, exported so the test can render them to SQL. */
export const ATTENTION_WHERE = {
  showsWithoutPoster: (): SQL => or(isNull(shows.thumbnailUrl), eq(shows.thumbnailUrl, ''))!,
  showsWithShortDescription: (): SQL =>
    or(isNull(shows.description), lt(sql`char_length(btrim(${shows.description}))`, SHORT_DESCRIPTION_CHARS))!,
  // Plain SQL subqueries (not db.select) so the conditions need no connection to build.
  arrangementsWithoutAudio: (): SQL =>
    sql`not exists (select 1 from ${files} where ${and(
      eq(files.arrangementId, arrangements.id),
      eq(files.fileType, 'audio'),
      eq(files.isPublic, true),
    )})`,
  arrangementsWithoutPieces: (): SQL =>
    sql`not exists (select 1 from ${arrangementPieces} where ${eq(arrangementPieces.arrangementId, arrangements.id)})`,
} satisfies Record<AttentionKey, () => SQL>;

const LABELS: Record<AttentionKey, string> = {
  showsWithoutPoster: 'Shows with no poster image',
  showsWithShortDescription: `Shows with no description (or under ${SHORT_DESCRIPTION_CHARS} characters)`,
  arrangementsWithoutAudio: 'Arrangements with no public audio',
  arrangementsWithoutPieces: 'Arrangements with no pieces linked',
};

function group(key: AttentionKey, items: AttentionItem[]): AttentionGroup {
  return { key, label: LABELS[key], count: items.length, items: items.slice(0, ATTENTION_ITEMS) };
}

async function showsWhere(where: SQL): Promise<AttentionItem[]> {
  const rows = await db
    .select({ id: shows.id, slug: shows.slug, title: shows.title })
    .from(shows)
    .where(where)
    .orderBy(asc(shows.title), asc(shows.id));
  return rows.map((s) => ({ id: s.id, title: s.title, href: showEditorHref(s.slug) }));
}

async function arrangementsWhere(where: SQL): Promise<AttentionItem[]> {
  const rows = await selectArrangementsWithShow().where(where).orderBy(asc(arrangements.title), asc(arrangements.id));
  return firstPerId(rows).map((a) => ({ id: a.id, title: a.title, href: arrangementEditorHref(a.showSlug, a.title) }));
}

/**
 * The four "needs attention" lists. The catalog is small (tens of shows,
 * about a hundred parts), so each list reads all matching rows and counts them
 * here rather than running a second count query.
 */
export async function getNeedsAttention(): Promise<AttentionGroup[]> {
  const [noPoster, shortDescription, noAudio, noPieces] = await Promise.all([
    showsWhere(ATTENTION_WHERE.showsWithoutPoster()),
    showsWhere(ATTENTION_WHERE.showsWithShortDescription()),
    arrangementsWhere(ATTENTION_WHERE.arrangementsWithoutAudio()),
    arrangementsWhere(ATTENTION_WHERE.arrangementsWithoutPieces()),
  ]);
  return [
    group('showsWithoutPoster', noPoster),
    group('showsWithShortDescription', shortDescription),
    group('arrangementsWithoutAudio', noAudio),
    group('arrangementsWithoutPieces', noPieces),
  ];
}

// ---------------------------------------------------------------------------
// Arrangements list (/admin/arrangements)
// ---------------------------------------------------------------------------

export type AdminArrangementRow = { id: number; title: string; composer: string | null; updatedAt: string; showTitle: string | null; href: string };

/** A page of arrangements by title, optionally filtered by `q` (title `ilike`). */
export async function getArrangementsPageForAdmin({ q, page, limit }: { q?: string; page: number; limit: number }) {
  const where = q ? ilike(arrangements.title, likePattern(q)) : undefined;
  const countQuery = db.select({ count: count() }).from(arrangements);
  const [[total], rows] = await Promise.all([
    where ? countQuery.where(where) : countQuery,
    db.query.arrangements.findMany({
      columns: { id: true, title: true, composer: true, updatedAt: true },
      where,
      orderBy: [asc(arrangements.title), asc(arrangements.id)],
      limit,
      offset: (page - 1) * limit,
      with: { showArrangements: { columns: {}, limit: 1, with: { show: { columns: { slug: true, title: true } } } } },
    }),
  ]);
  const data: AdminArrangementRow[] = rows.map((a) => {
    const show = a.showArrangements[0]?.show;
    return {
      id: a.id,
      title: a.title,
      composer: a.composer,
      updatedAt: toIso(a.updatedAt) ?? '',
      showTitle: show?.title ?? null,
      href: arrangementEditorHref(show?.slug, a.title),
    };
  });
  return { data, total: Number(total?.count ?? 0) };
}

// ---------------------------------------------------------------------------
// Inquiries (/admin/inquiries): contact_submissions, read-only
// ---------------------------------------------------------------------------

export type InquiryRow = {
  id: number;
  createdAt: string;
  name: string;
  email: string;
  service: string;
  source: string;
  message: string;
};

/** Newest first. */
export async function getInquiriesPage({ page, limit }: { page: number; limit: number }) {
  const [[total], rows] = await Promise.all([
    db.select({ count: count() }).from(contactSubmissions),
    db
      .select({
        id: contactSubmissions.id,
        createdAt: contactSubmissions.createdAt,
        firstName: contactSubmissions.firstName,
        lastName: contactSubmissions.lastName,
        email: contactSubmissions.email,
        service: contactSubmissions.service,
        source: contactSubmissions.source,
        message: contactSubmissions.message,
      })
      .from(contactSubmissions)
      .orderBy(desc(contactSubmissions.createdAt), desc(contactSubmissions.id))
      .limit(limit)
      .offset((page - 1) * limit),
  ]);
  const data: InquiryRow[] = rows.map((r) => ({
    id: r.id,
    createdAt: toIso(r.createdAt) ?? '',
    name: [r.firstName, r.lastName].filter(Boolean).join(' '),
    email: r.email,
    service: r.service,
    source: r.source,
    message: r.message,
  }));
  return { data, total: Number(total?.count ?? 0) };
}
