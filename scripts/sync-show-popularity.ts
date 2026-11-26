#!/usr/bin/env tsx
/**
 * Copy each show's popularity (visitors + listeners, last 90 days) from the
 * PostHog endpoint `show-popularity` into `shows.popularity`. See
 * lib/services/show-popularity.ts for what the score means.
 *
 *   npx tsx scripts/sync-show-popularity.ts            # write
 *   npx tsx scripts/sync-show-popularity.ts --dry-run  # print, write nothing
 *   npx tsx scripts/sync-show-popularity.ts --from-file saved.json
 *                                         # use a saved endpoint response
 *
 * Needs DATABASE_URL and POSTHOG_PERSONAL_API_KEY (a personal key with the
 * `endpoint:read` scope). Runs weekly from .github/workflows/show-popularity.yml.
 * The site's cached catalog pages pick the new order up within an hour.
 */
import { withDb } from './_common'
import { readFile } from 'fs/promises'
import { parseEndpointResponse, scoreShows } from '../lib/services/show-popularity'

const ENDPOINT_URL = 'https://us.posthog.com/api/projects/261511/endpoints/show-popularity/run'

async function fetchRows() {
  const key = process.env.POSTHOG_PERSONAL_API_KEY
  if (!key) throw new Error('POSTHOG_PERSONAL_API_KEY is not set')
  const response = await fetch(ENDPOINT_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: '{}',
  })
  if (!response.ok) throw new Error(`PostHog endpoint answered ${response.status}: ${await response.text()}`)
  return parseEndpointResponse(await response.json())
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  // --from-file <path>: a saved endpoint response, for a run without an API key.
  const fileIndex = process.argv.indexOf('--from-file')
  const file = fileIndex === -1 ? null : process.argv[fileIndex + 1]
  const rows = file ? parseEndpointResponse(JSON.parse(await readFile(file, 'utf8'))) : await fetchRows()
  if (rows.length === 0) throw new Error('PostHog returned no rows; refusing to zero every show')

  await withDb(async (db) => {
    const { rows: showRows } = await db.query('select id, slug, title from shows')
    const showList = showRows.map((r) => ({ id: Number(r.id), slug: String(r.slug), title: String(r.title) }))
    const scores = scoreShows(rows, showList)

    const ranked = showList
      .map((s) => ({ slug: s.slug, popularity: scores.get(s.id) ?? 0 }))
      .sort((a, b) => b.popularity - a.popularity)
    console.table(ranked.slice(0, 15))

    if (dryRun) {
      console.log('Dry run: nothing written.')
      return
    }
    await db.sql.begin(async (tx) => {
      for (const show of showList) {
        await tx`update shows set popularity = ${scores.get(show.id) ?? 0} where id = ${show.id}`
      }
    })
    console.log(`Updated popularity for ${showList.length} shows.`)
  })
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
