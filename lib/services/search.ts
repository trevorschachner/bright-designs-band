import { sql, type SQL } from 'drizzle-orm'
import { db } from '@/lib/database'
import type { CollectionConfig } from '@/lib/collections'
import { publishedCollections } from '@/lib/services/collections'

/**
 * Catalog search over the materialized views in
 * drizzle/migrations/2026-11-01_search_foundation.sql.
 *
 * Every word of the query must match as a word prefix ("liber" finds
 * Libertango), ranked by where it matched (title and source pieces first).
 * Accents and case are folded on both sides.
 */

/** Anything that runs a drizzle `sql` query: the app's postgres-js db, or pglite in tests. */
export type SqlRunner = { execute: (query: SQL) => Promise<unknown> }

export type ArrangementHit = {
  id: number
  slug: string
  title: string
  scene: string | null
  durationSeconds: number | null
  showTitle: string | null
  showSlug: string | null
}

export type ShowHit = { id: number; slug: string; title: string; year: number | null; difficulty: string | null }

/** A source piece, with the parts that arrange it (pieces have no page of their own). */
export type PieceHit = { id: number; title: string; composer: string | null; arrangements: { slug: string; title: string }[] }

export type CollectionHit = { slug: string; title: string }

export type SearchResults = {
  query: string
  /** Nothing matched word for word; these are the closest spellings instead. */
  fuzzy: boolean
  shows: ShowHit[]
  arrangements: ArrangementHit[]
  pieces: PieceHit[]
  collections: CollectionHit[]
}

type Options = {
  database?: SqlRunner
  /** Per group. */
  limit?: number
  /** The collections that may be suggested; defaults to the published ones. */
  collections?: CollectionConfig[]
}

const DEFAULT_LIMIT = 8

/** postgres-js returns the rows as an array; pglite as `{ rows }`. */
function rowsOf<T>(result: unknown): T[] {
  return (Array.isArray(result) ? result : (result as { rows: T[] }).rows) as T[]
}

/** `liber tango` -> `liber:* & tango:*`, each word folded and quoted, so no input is tsquery syntax. */
function prefixQuery(q: string): SQL {
  return sql`(
    select to_tsquery('english', string_agg(quote_literal(w) || ':*', ' & '))
    from regexp_split_to_table(public.search_fold(${q}), '[^[:alnum:]]+') w
    where w <> ''
  )`
}

/**
 * How close a query must be to some stretch of a row's short text (title,
 * pieces, shows, composers) for the typo fallback to show it, 0..1.
 */
const FUZZY_THRESHOLD = 0.4

/** `where`/`order by` for one pass: the ranked word match, or the typo fallback. */
function matcher(q: string, fuzzy: boolean) {
  if (fuzzy) {
    const score = sql`extensions.word_similarity(public.search_fold(${q}), s.trgm_text)`
    return { where: sql`${score} >= ${FUZZY_THRESHOLD}`, rank: score }
  }
  const query = prefixQuery(q)
  return { where: sql`s.doc @@ ${query}`, rank: sql`ts_rank(s.doc, ${query})` }
}

async function searchArrangements(database: SqlRunner, q: string, limit: number, fuzzy: boolean): Promise<ArrangementHit[]> {
  const { where, rank } = matcher(q, fuzzy)
  const result = await database.execute(sql`
    select a.id, a.slug, a.title, a.scene, a.duration_seconds as "durationSeconds",
      sh.title as "showTitle", sh.slug as "showSlug"
    from public.arrangement_search s
    join arrangements a on a.id = s.arrangement_id
    left join lateral (
      select x.title, x.slug from show_arrangements sa join shows x on x.id = sa.show_id
      where sa.arrangement_id = a.id order by sa.order_index limit 1
    ) sh on true
    where ${where}
    order by ${rank} desc, a.title
    limit ${limit}`)
  return rowsOf<ArrangementHit>(result)
}

async function searchShows(database: SqlRunner, q: string, limit: number, fuzzy: boolean): Promise<ShowHit[]> {
  const { where, rank } = matcher(q, fuzzy)
  const result = await database.execute(sql`
    select sh.id, sh.slug, sh.title, sh.year, sh.difficulty
    from public.show_search s
    join shows sh on sh.id = s.show_id
    where ${where}
    order by ${rank} desc, sh.title
    limit ${limit}`)
  return rowsOf<ShowHit>(result)
}

/** Pieces are few (hundreds), so their search text is built per query rather than kept in a view. */
async function searchPieces(database: SqlRunner, q: string, limit: number, fuzzy: boolean): Promise<PieceHit[]> {
  const { where, rank } = matcher(q, fuzzy)
  const result = await database.execute(sql`
    with hits as (
      select pc.id, pc.title, pc.composer, ${rank} as rank
      from pieces pc
      cross join lateral (
        select to_tsvector('english', public.search_fold(concat_ws(' ', pc.title, pc.composer))) as doc,
          public.search_fold(concat_ws(' ', pc.title, pc.composer)) as trgm_text
      ) s
      where exists (select 1 from arrangement_pieces ap where ap.piece_id = pc.id) and ${where}
      order by rank desc, pc.title
      limit ${limit}
    )
    select h.id, h.title, h.composer,
      (select json_agg(json_build_object('slug', a.slug, 'title', a.title) order by a.title)
       from arrangement_pieces ap join arrangements a on a.id = ap.arrangement_id
       where ap.piece_id = h.id) as arrangements
    from hits h
    order by h.rank desc, h.title`)
  return rowsOf<PieceHit>(result)
}

/** Words that name the whole catalog, so they say nothing about which collection. */
const CATALOG_WORDS = new Set(['marching', 'band', 'bands', 'show', 'shows', 'music', 'the', 'and', 'for', 'with', 'of', 'a'])

const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const words = (s: string) => fold(s).split(/[^a-z0-9]+/).filter(Boolean)

/** Collections whose heading or keywords contain every distinctive query word (as a word prefix). */
function matchCollections(q: string, collections: CollectionConfig[]): CollectionHit[] {
  const wanted = words(q).filter((w) => !CATALOG_WORDS.has(w))
  if (wanted.length === 0) return []
  return collections
    .filter((c) => {
      const vocabulary = words([c.h1, ...c.keywords].join(' '))
      return wanted.every((w) => vocabulary.some((v) => v.startsWith(w)))
    })
    .map((c) => ({ slug: c.slug, title: c.h1 }))
}

async function searchAll(database: SqlRunner, q: string, limit: number, fuzzy: boolean) {
  const [shows, arrangements, pieces] = await Promise.all([
    searchShows(database, q, limit, fuzzy),
    searchArrangements(database, q, limit, fuzzy),
    searchPieces(database, q, limit, fuzzy),
  ])
  return { shows, arrangements, pieces }
}

/**
 * Shows, parts, source pieces and collections matching `q`. When nothing
 * matches word for word, the closest spellings come back instead, marked
 * `fuzzy`.
 */
export async function searchCatalog(q: string, { database = db, limit = DEFAULT_LIMIT, collections }: Options = {}): Promise<SearchResults> {
  const query = q.trim().slice(0, 200)
  if (!words(query).length) return { query, fuzzy: false, shows: [], arrangements: [], pieces: [], collections: [] }
  const suggested = matchCollections(query, collections ?? (await publishedCollections()))
  const exact = await searchAll(database, query, limit, false)
  if (exact.shows.length + exact.arrangements.length + exact.pieces.length > 0) {
    return { query, fuzzy: false, ...exact, collections: suggested }
  }
  return { query, fuzzy: true, ...(await searchAll(database, query, limit, true)), collections: suggested }
}
