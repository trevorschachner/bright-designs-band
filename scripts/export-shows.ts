#!/usr/bin/env tsx
/**
 * Export shows, parts and pieces as CSVs that line up with the "Show Database"
 * Google Sheet (#51), so keeping the two in sync is a copy-paste.
 *
 *   npm run export:shows -- <output-dir>
 *
 * Writes <output-dir>/shows.csv, parts.csv and pieces.csv. Column orders live
 * in lib/export/show-sheet.ts; reading is in lib/export/load-show-sheet.ts and
 * is read-only by construction.
 */
import { withDb } from './_common'
import { mkdir, writeFile } from 'fs/promises'
import { resolve } from 'path'
import { PART_COLUMNS, PIECE_COLUMNS, SHOW_COLUMNS, toCsv } from '../lib/export/show-sheet'
import { readShowSheetTables, storageFromEnv } from '../lib/export/load-show-sheet'

async function main() {
  const outDir = process.argv[2]
  if (!outDir) {
    console.error('Usage: npm run export:shows -- <output-dir>')
    process.exit(1)
  }
  // storageFromEnv(): the same URL rule /api/export/[file] uses, so both exports agree.
  const tables = await withDb((db) => readShowSheetTables(db.drizzle, storageFromEnv()))

  const dir = resolve(process.cwd(), outDir)
  await mkdir(dir, { recursive: true })
  await writeFile(resolve(dir, 'shows.csv'), toCsv(SHOW_COLUMNS, tables.shows))
  await writeFile(resolve(dir, 'parts.csv'), toCsv(PART_COLUMNS, tables.parts))
  await writeFile(resolve(dir, 'pieces.csv'), toCsv(PIECE_COLUMNS, tables.pieces))

  console.log(`Wrote to ${dir}:`)
  console.log(`  shows.csv   ${tables.shows.length} rows`)
  console.log(`  parts.csv   ${tables.parts.length} rows`)
  console.log(`  pieces.csv  ${tables.pieces.length} rows`)
}

main().catch(e => {
  console.error(`\nError: ${e instanceof Error ? e.message : e}`)
  process.exit(1)
})
