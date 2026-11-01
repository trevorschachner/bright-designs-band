#!/usr/bin/env tsx
/**
 * Rebuild the search views (public.refresh_search(), see
 * drizzle/migrations/2026-11-01_search_foundation.sql) and print their row
 * counts. Every catalog write already does this after it commits; run it by
 * hand after editing the database directly (SQL editor, a backfill).
 *
 *   npx tsx scripts/refresh-search.ts
 *
 * Needs DATABASE_URL in .env.local.
 */
import { withDb } from './_common'

async function main() {
  await withDb(async (db) => {
    await db.query('select public.refresh_search()')
    const { rows } = await db.query(
      `select (select count(*) from public.arrangement_search)::int as arrangements,
              (select count(*) from public.show_search)::int as shows`
    )
    console.log(`Search rebuilt: ${rows[0].arrangements} arrangements, ${rows[0].shows} shows.`)
  })
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
