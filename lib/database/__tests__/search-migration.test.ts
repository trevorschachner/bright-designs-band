import { describe, expect, it } from 'vitest'
import { createSearchDb, readMigration, SEARCH_MIGRATION, SEARCH_ROLLBACK } from '@/lib/services/__tests__/search-db'

/** drizzle/migrations/2026-11-01_search_foundation.sql and its rollback, run on pglite. */
const objects = `
  select
    (select count(*) from pg_matviews where matviewname in ('arrangement_search', 'show_search'))::int as views,
    (select count(*) from pg_proc where proname in ('refresh_search', 'search_fold'))::int as functions,
    (select count(*) from information_schema.columns
      where (table_name, column_name) in (('tags', 'kind'), ('arrangements', 'featured')))::int as columns`

describe('search foundation migration', () => {
  it('marks existing "Theme: " tags as themes and everything else as other', async () => {
    const { client } = await createSearchDb()
    await client.exec(readMigration(SEARCH_ROLLBACK))
    await client.exec(`insert into tags (name) values ('Theme: Space'), ('Small Band')`)
    await client.exec(readMigration(SEARCH_MIGRATION))
    const { rows } = await client.query(`select name, kind from tags order by name`)
    expect(rows).toEqual([{ name: 'Small Band', kind: 'other' }, { name: 'Theme: Space', kind: 'theme' }])
  })

  it('rejects an unknown tag kind', async () => {
    const { client } = await createSearchDb()
    await expect(client.exec(`insert into tags (name, kind) values ('x', 'color')`)).rejects.toThrow(/tags_kind_check/)
  })

  it('rolls back without a trace and applies again', async () => {
    const { client } = await createSearchDb()
    expect((await client.query(objects)).rows[0]).toEqual({ views: 2, functions: 2, columns: 2 })
    await client.exec(readMigration(SEARCH_ROLLBACK))
    expect((await client.query(objects)).rows[0]).toEqual({ views: 0, functions: 0, columns: 0 })
    await client.exec(readMigration(SEARCH_MIGRATION))
    await client.exec(readMigration(SEARCH_MIGRATION))
    await client.query('select public.refresh_search()')
    expect((await client.query(objects)).rows[0]).toEqual({ views: 2, functions: 2, columns: 2 })
  })
})
