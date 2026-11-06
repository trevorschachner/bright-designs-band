import { readFileSync } from 'fs'
import { resolve } from 'path'
import { PGlite } from '@electric-sql/pglite'
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm'
import { unaccent } from '@electric-sql/pglite/contrib/unaccent'
import { drizzle } from 'drizzle-orm/pglite'

/**
 * An in-memory Postgres (pglite) with the real schema: the generated drizzle
 * migrations, the hand-written ones the search views read, then the search
 * migration itself. For tests of SQL that a fake db cannot check.
 */
const drizzleDir = resolve(__dirname, '../../../drizzle')
const GENERATED = ['0000_baseline.sql', '0001_pieces_and_drop_length_seconds.sql', '0002_clear_silhouette.sql', '0003_slug_redirects_updated_at.sql', '0004_pending_uploads.sql']
const HAND_WRITTEN = ['2026-10-10_arrangements_slug.sql', '2026-10-10_shows_program_notes.sql']
export const SEARCH_MIGRATION = 'migrations/2026-11-01_search_foundation.sql'
export const SEARCH_ROLLBACK = 'migrations/2026-11-01_search_foundation.rollback.sql'

export const readMigration = (name: string) => readFileSync(resolve(drizzleDir, name), 'utf8')

export async function createSearchDb() {
  const client = new PGlite({ extensions: { pg_trgm, unaccent } })
  for (const name of GENERATED) await client.exec(readMigration(name))
  for (const name of HAND_WRITTEN) await client.exec(readMigration(`migrations/${name}`))
  await client.exec(readMigration(SEARCH_MIGRATION))
  return { client, db: drizzle(client) }
}

type Seed = {
  shows?: { id: number; title: string; slug?: string; tags?: string[]; description?: string }[]
  arrangements?: {
    id: number
    title: string
    slug?: string
    showId?: number
    composer?: string
    pieces?: { title: string; composer?: string }[]
    tags?: string[]
  }[]
}

const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** Inserts the rows, then rebuilds the search views (as a committed write would). */
export async function seed(client: PGlite, data: Seed) {
  const tagId = async (name: string) => {
    const { rows } = await client.query<{ id: number }>(
      `insert into tags (name) values ($1) on conflict (name) do update set name = excluded.name returning id`, [name])
    return rows[0].id
  }
  for (const s of data.shows ?? []) {
    await client.query(`insert into shows (id, title, slug, description) values ($1, $2, $3, $4)`, [s.id, s.title, s.slug ?? slugify(s.title), s.description ?? null])
    for (const t of s.tags ?? []) await client.query(`insert into shows_to_tags (show_id, tag_id) values ($1, $2)`, [s.id, await tagId(t)])
  }
  for (const a of data.arrangements ?? []) {
    await client.query(`insert into arrangements (id, title, slug, composer) values ($1, $2, $3, $4)`, [a.id, a.title, a.slug ?? slugify(a.title), a.composer ?? null])
    if (a.showId) await client.query(`insert into show_arrangements (show_id, arrangement_id, order_index) values ($1, $2, $3)`, [a.showId, a.id, a.id])
    for (const [i, p] of (a.pieces ?? []).entries()) {
      const { rows } = await client.query<{ id: number }>(`insert into pieces (title, composer) values ($1, $2) returning id`, [p.title, p.composer ?? null])
      await client.query(`insert into arrangement_pieces (arrangement_id, piece_id, order_index) values ($1, $2, $3)`, [a.id, rows[0].id, i + 1])
    }
    for (const t of a.tags ?? []) await client.query(`insert into arrangements_to_tags (arrangement_id, tag_id) values ($1, $2)`, [a.id, await tagId(t)])
  }
  await client.query('select public.refresh_search()')
}
