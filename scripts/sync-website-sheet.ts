#!/usr/bin/env tsx
/**
 * Mirror the website's shows, parts and pieces into the "Active Assets on
 * Website" Google Sheet. One-way: the database is the source, every tab listed
 * below is rewritten in full, and edits made in those tabs are overwritten.
 * Change things in /admin instead.
 *
 *   npm run sync:sheet              # write to the sheet
 *   npm run sync:sheet -- --dry-run # read the database, print counts, write nothing
 *
 * Env:
 *   DATABASE_URL                 read-only role is enough (reads run in a READ ONLY transaction)
 *   GOOGLE_SERVICE_ACCOUNT_JSON  service-account key JSON; the sheet must be shared with its client_email as Editor
 *   WEBSITE_SHEET_ID             optional, defaults to the Active Assets sheet
 *
 * Runs nightly from .github/workflows/sync-website-sheet.yml.
 */
import { config } from 'dotenv'
import { resolve } from 'path'
import { PART_COLUMNS, PIECE_COLUMNS, SHOW_COLUMNS } from '../lib/export/show-sheet'
import { LINK_COLUMNS, loadShowSheetTables, storageFromEnv } from '../lib/export/load-show-sheet'
import { getAccessToken, replaceTabs, toSheetValues, type ServiceAccount } from '../lib/export/google-sheets'

config({ path: resolve(process.cwd(), '.env.local'), quiet: true })

/** "Active Assets on Website 2026" in the Business drive. */
const DEFAULT_SHEET_ID = '1KG86ojOiA8DgD2hISiyJVumnjmWe-6TDNcy4nSSHqPY'

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is not set')
  const sheetId = process.env.WEBSITE_SHEET_ID?.trim() || DEFAULT_SHEET_ID

  const tables = await loadShowSheetTables(databaseUrl, storageFromEnv())
  const syncedAt = new Date().toISOString()

  // Tab names match the sheet. "Arrangements" is the site's word for a part.
  const tabs = [
    { title: 'Shows', values: toSheetValues(SHOW_COLUMNS, tables.shows) },
    { title: 'Arrangements', values: toSheetValues(PART_COLUMNS, tables.parts) },
    { title: 'Pieces', values: toSheetValues(PIECE_COLUMNS, tables.pieces) },
    { title: 'links', values: toSheetValues(LINK_COLUMNS, tables.links) },
    {
      title: 'Sync status',
      values: [
        ['Mirrored from the brightdesigns.band database. Do not edit: every tab here is overwritten on each sync.'],
        ['Change shows and parts in brightdesigns.band/admin instead.'],
        [''],
        ['last synced (UTC)', syncedAt],
        ['shows', tables.shows.length],
        ['arrangements (parts)', tables.parts.length],
        ['pieces', tables.pieces.length],
        ['links', tables.links.length],
      ],
    },
  ]

  for (const t of tabs.slice(0, 4)) console.log(`  ${t.title.padEnd(13)} ${t.values.length - 1} rows`)

  if (dryRun) {
    console.log('Dry run: nothing written.')
    return
  }

  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not set')
  const sa = JSON.parse(raw) as ServiceAccount

  await replaceTabs(await getAccessToken(sa), sheetId, tabs)
  console.log(`Synced to https://docs.google.com/spreadsheets/d/${sheetId} at ${syncedAt}`)
}

main().catch(e => {
  console.error(`\nError: ${e instanceof Error ? e.message : e}`)
  process.exit(1)
})
