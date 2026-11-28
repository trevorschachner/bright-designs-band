import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PGlite } from '@electric-sql/pglite'
import { createSearchDb, readMigration } from '@/lib/services/__tests__/search-db'

/**
 * drizzle/migrations/2026-11-26_arrangements_perusal_score.sql,
 * 2026-11-27_drop_sample_score_url.sql and their rollbacks on pglite, and getPerusalScore (lib/services/perusal-scores.ts)
 * against the migrated schema.
 */

const MIGRATION = 'migrations/2026-11-26_arrangements_perusal_score.sql'
const ROLLBACK = 'migrations/2026-11-26_arrangements_perusal_score.rollback.sql'
const DROP = 'migrations/2026-11-27_drop_sample_score_url.sql'
const DROP_ROLLBACK = 'migrations/2026-11-27_drop_sample_score_url.rollback.sql'

const state = vi.hoisted(() => ({ db: null as unknown }))
vi.mock('@/lib/database', () => ({
  db: new Proxy({}, { get: (_t, prop) => (state.db as Record<string | symbol, unknown>)[prop] }),
}))

import { getPerusalScore } from '@/lib/services/perusal-scores'

const columns = `
  select column_name from information_schema.columns
  where table_name = 'arrangements' and column_name in ('perusal_score_file_id', 'sample_score_url')
  order by column_name`

let client: PGlite

async function addFile(id: number, { isPublic = false, url = `/api/files/${id}/download` } = {}) {
  await client.query(
    `insert into files (id, file_name, original_name, file_type, file_size, mime_type, url, storage_path, show_id, arrangement_id, is_public)
     values ($1, $2, 'Full score.pdf', 'score', 1000, 'application/pdf', $3, $4, 7, 9, $5)`,
    [id, `${id}.pdf`, url, `shows/7/arrangements/9/score/${id}.pdf`, isPublic]
  )
}

beforeEach(async () => {
  const created = await createSearchDb()
  client = created.client
  state.db = created.db
  await client.exec(readMigration(MIGRATION))
  await client.exec(readMigration(DROP))
  await client.exec(`insert into shows (id, title, slug) values (7, 'Show', 'show')`)
  await client.exec(`insert into arrangements (id, title, slug) values (9, 'Opener', 'opener')`)
})

describe('perusal score migration', () => {
  it('adds perusal_score_file_id and drops sample_score_url', async () => {
    expect((await client.query(columns)).rows).toEqual([{ column_name: 'perusal_score_file_id' }])
  })

  it('clears the slot when its file row is deleted', async () => {
    await addFile(41)
    await client.exec(`update arrangements set perusal_score_file_id = 41 where id = 9`)
    await client.exec(`delete from files where id = 41`)
    const { rows } = await client.query(`select perusal_score_file_id from arrangements where id = 9`)
    expect(rows).toEqual([{ perusal_score_file_id: null }])
  })

  it('refuses a slot that points at no file', async () => {
    await expect(client.exec(`update arrangements set perusal_score_file_id = 999 where id = 9`)).rejects.toThrow(/foreign key/)
  })

  it('is additive on its own: sample_score_url stays until the held drop runs', async () => {
    await client.exec(readMigration(DROP_ROLLBACK))
    await client.exec(readMigration(ROLLBACK))
    await client.exec(readMigration(MIGRATION))
    expect((await client.query(columns)).rows).toEqual([
      { column_name: 'perusal_score_file_id' },
      { column_name: 'sample_score_url' },
    ])
  })

  it('holds the drop back from a plain --apply', () => {
    expect(readMigration(DROP)).toMatch(/^-- migrate: manual$/m)
  })

  it('rolls back and applies again', async () => {
    await client.exec(readMigration(DROP_ROLLBACK))
    await client.exec(readMigration(ROLLBACK))
    expect((await client.query(columns)).rows).toEqual([{ column_name: 'sample_score_url' }])
    await client.exec(readMigration(MIGRATION))
    await client.exec(readMigration(MIGRATION))
    await client.exec(readMigration(DROP))
    await client.exec(readMigration(DROP))
    expect((await client.query(columns)).rows).toEqual([{ column_name: 'perusal_score_file_id' }])
  })
})

describe('getPerusalScore', () => {
  it('returns the private object key of the slot file', async () => {
    await addFile(41)
    await client.exec(`update arrangements set perusal_score_file_id = 41 where id = 9`)
    expect(await getPerusalScore(9)).toBe('files/shows/7/arrangements/9/score/41.pdf')
  })

  it('is null for an empty slot or an unknown part', async () => {
    await addFile(41)
    expect(await getPerusalScore(9)).toBeNull()
    expect(await getPerusalScore(12345)).toBeNull()
  })

  it('is null when the slot file is not in the private bucket', async () => {
    await addFile(41, { isPublic: true, url: 'https://cdn.example/41.pdf' })
    await addFile(42, { url: 'https://cdn.example/42.pdf' })
    await client.exec(`update arrangements set perusal_score_file_id = 41 where id = 9`)
    expect(await getPerusalScore(9)).toBeNull()
    await client.exec(`update arrangements set perusal_score_file_id = 42 where id = 9`)
    expect(await getPerusalScore(9)).toBeNull()
  })
})
