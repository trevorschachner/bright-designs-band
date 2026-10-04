#!/usr/bin/env tsx
/**
 * Export shows, parts and pieces as CSVs that line up with the "Show Database"
 * Google Sheet (#51), so keeping the two in sync is a copy-paste.
 *
 *   npm run export:shows -- <output-dir>
 *
 * Writes <output-dir>/shows.csv, parts.csv and pieces.csv. Column orders live
 * in lib/export/show-sheet.ts.
 *
 * Read-only by construction: every query runs inside a READ ONLY transaction
 * (verified before reading), which Postgres enforces, so this is safe to point
 * at production.
 */
import { config } from 'dotenv'
import { mkdir, writeFile } from 'fs/promises'
import { resolve } from 'path'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { asc, eq, sql } from 'drizzle-orm'
import * as schema from '../lib/database/schema'
import {
  PART_COLUMNS,
  PIECE_COLUMNS,
  SHOW_COLUMNS,
  partRow,
  pieceRow,
  publicFileUrl,
  showRow,
  toCsv,
  type PartRecord,
} from '../lib/export/show-sheet'

config({ path: resolve(process.cwd(), '.env.local'), quiet: true })

const { shows, arrangements, showArrangements, files, pieces, arrangementPieces } = schema

async function main() {
  const outDir = process.argv[2]
  if (!outDir) {
    console.error('Usage: npm run export:shows -- <output-dir>')
    process.exit(1)
  }
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not found in .env.local')

  const client = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 })
  const db = drizzle(client, { schema })

  try {
    const data = await db.transaction(
      async tx => {
        const [{ readOnly }] = await tx.execute<{ readOnly: string }>(
          sql`select current_setting('transaction_read_only') as "readOnly"`
        )
        if (readOnly !== 'on') throw new Error('Refusing to export: transaction is not read-only')

        const showRows = await tx.query.shows.findMany({
          orderBy: [asc(shows.displayOrder), asc(shows.id)],
          with: { showsToTags: { with: { tag: true } } },
        })

        const links = await tx
          .select({
            arrangementId: showArrangements.arrangementId,
            orderIndex: showArrangements.orderIndex,
            showTitle: shows.title,
          })
          .from(showArrangements)
          .innerJoin(shows, eq(shows.id, showArrangements.showId))
          .orderBy(asc(shows.displayOrder), asc(shows.id), asc(showArrangements.orderIndex))

        const arrangementRows = await tx.select().from(arrangements).orderBy(asc(arrangements.id))

        const audioRows = await tx
          .select({ arrangementId: files.arrangementId, url: files.url })
          .from(files)
          .where(sql`${files.fileType} = 'audio' and ${files.isPublic} and ${files.arrangementId} is not null`)
          .orderBy(asc(files.displayOrder), asc(files.id))

        // Until the #51 migration is applied the pieces tables do not exist.
        // Export the rest rather than failing; pieces.csv is then header-only.
        const [{ hasPieces }] = await tx.execute<{ hasPieces: boolean }>(
          sql`select to_regclass('public.pieces') is not null and to_regclass('public.arrangement_pieces') is not null as "hasPieces"`
        )
        if (!hasPieces) console.warn('pieces tables not found (migration not applied?); pieces will be empty')

        const pieceLinks = hasPieces
          ? await tx
              .select({ arrangementId: arrangementPieces.arrangementId, title: pieces.title })
              .from(arrangementPieces)
              .innerJoin(pieces, eq(pieces.id, arrangementPieces.pieceId))
              .orderBy(asc(arrangementPieces.arrangementId), asc(arrangementPieces.orderIndex))
          : []

        const pieceRows = hasPieces ? await tx.select().from(pieces).orderBy(asc(pieces.id)) : []

        return { showRows, links, arrangementRows, audioRows, pieceLinks, pieceRows }
      },
      { accessMode: 'read only' }
    )

    const storage = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      bucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET?.trim() || 'Bright Designs',
      rootPrefix: process.env.NEXT_PUBLIC_STORAGE_ROOT_PREFIX?.trim() || 'files',
    }

    // First public audio file per arrangement, by display order.
    const audioByArrangement = new Map<number, string | null>()
    for (const f of data.audioRows) {
      if (f.arrangementId !== null && !audioByArrangement.has(f.arrangementId)) {
        audioByArrangement.set(f.arrangementId, publicFileUrl(f.url, storage))
      }
    }

    const piecesByArrangement = new Map<number, string[]>()
    for (const l of data.pieceLinks) {
      piecesByArrangement.set(l.arrangementId, [...(piecesByArrangement.get(l.arrangementId) ?? []), l.title])
    }

    const arrangementById = new Map(data.arrangementRows.map(a => [a.id, a]))
    const toPart = (
      a: (typeof data.arrangementRows)[number],
      showTitle: string | null,
      orderIndex: number | null
    ): PartRecord => ({
      id: a.id,
      showTitle,
      orderIndex,
      title: a.title,
      scene: a.scene,
      durationSeconds: a.durationSeconds,
      grade: a.grade,
      ensembleSize: a.ensembleSize,
      arranger: a.arranger,
      percussionArranger: a.percussionArranger,
      year: a.year,
      commissioned: a.commissioned,
      youtubeUrl: a.youtubeUrl,
      sampleScoreUrl: a.sampleScoreUrl,
      audioUrl: audioByArrangement.get(a.id) ?? null,
      pieceTitles: piecesByArrangement.get(a.id) ?? [],
    })

    // One row per show link, in show then part order. An arrangement in two
    // shows appears twice; one in no show is listed at the end with no show.
    const linked = new Set<number>()
    const parts: PartRecord[] = []
    for (const l of data.links) {
      const a = arrangementById.get(l.arrangementId)
      if (!a) continue
      linked.add(a.id)
      parts.push(toPart(a, l.showTitle, l.orderIndex))
    }
    for (const a of data.arrangementRows) if (!linked.has(a.id)) parts.push(toPart(a, null, null))

    const showsCsv = toCsv(
      SHOW_COLUMNS,
      data.showRows.map(s => {
        // ensemble_size / includes are not columns on `shows` yet (#51). Read
        // them if a later migration adds them; otherwise they export blank.
        const extra = s as unknown as { ensembleSize?: string | null; includes?: string[] | null }
        return showRow({
          ...s,
          ensembleSize: extra.ensembleSize ?? null,
          includes: extra.includes ?? null,
          tagNames: s.showsToTags.map(st => st.tag.name).sort((x, y) => x.localeCompare(y)),
        })
      })
    )
    const partsCsv = toCsv(PART_COLUMNS, parts.map(partRow))
    const piecesCsv = toCsv(PIECE_COLUMNS, data.pieceRows.map(pieceRow))

    const dir = resolve(process.cwd(), outDir)
    await mkdir(dir, { recursive: true })
    await writeFile(resolve(dir, 'shows.csv'), showsCsv)
    await writeFile(resolve(dir, 'parts.csv'), partsCsv)
    await writeFile(resolve(dir, 'pieces.csv'), piecesCsv)

    console.log(`Wrote to ${dir}:`)
    console.log(`  shows.csv   ${data.showRows.length} rows`)
    console.log(`  parts.csv   ${parts.length} rows`)
    console.log(`  pieces.csv  ${data.pieceRows.length} rows`)
  } finally {
    await client.end()
  }
}

main().catch(e => {
  console.error(`\nError: ${e instanceof Error ? e.message : e}`)
  process.exit(1)
})
