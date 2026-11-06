import { after } from 'next/server'
import { sql } from 'drizzle-orm'
import { db, isDatabaseConfigured } from '@/lib/database'
import { reportError } from '@/lib/observability/report-error'

/**
 * Rebuilds the search views (public.refresh_search(), see
 * drizzle/migrations/2026-11-01_search_foundation.sql). A few milliseconds
 * for the whole catalog.
 */
export async function refreshSearch(): Promise<void> {
  await db.execute(sql`select public.refresh_search()`)
}

/**
 * Called by the invalidate helpers after a catalog write commits. The rebuild
 * runs after the response is sent (`after`), so a save never waits on it; a
 * failure is reported and search stays one write behind until the next one.
 * Outside a request (scripts) it runs straight away.
 */
export function scheduleSearchRefresh(): void {
  if (!isDatabaseConfigured()) return
  const run = () =>
    refreshSearch().catch((error) =>
      reportError(error, { operation: 'refreshSearch', degradedTo: 'search results stale until the next catalog write' })
    )
  try {
    after(run)
  } catch {
    void run()
  }
}
