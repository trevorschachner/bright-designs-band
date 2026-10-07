/**
 * Reads everything the show sheets need from the database, read-only, and
 * shapes it with the row builders in ./show-sheet. Shared by
 * `npm run export:shows` (CSV files) and `npm run sync:sheet` (Google Sheet).
 *
 * Read-only by construction: every query runs inside a READ ONLY transaction
 * (verified before reading), which Postgres enforces, so this is safe to point
 * at production.
 */
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { asc, eq, sql } from 'drizzle-orm'
import * as schema from '../database/schema'
import {
  PART_COLUMNS,
  PIECE_COLUMNS,
  SHOW_COLUMNS,
  partRow,
  pieceRow,
  publicFileUrl,
  showRow,
  type PartRecord,
  type Row,
} from './show-sheet'

const { shows, arrangements, showArrangements, files, pieces, arrangementPieces } = schema

export const LINK_COLUMNS = ['show_id', 'arrangement_id', 'order_index'] as const

export type ShowSheetTables = {
  shows: Row<typeof SHOW_COLUMNS>[]
  parts: Row<typeof PART_COLUMNS>[]
  pieces: Row<typeof PIECE_COLUMNS>[]
  links: Row<typeof LINK_COLUMNS>[]
}

export type StorageConfig = { supabaseUrl?: string | null; bucket: string; rootPrefix: string }

export function storageFromEnv(env: NodeJS.ProcessEnv = process.env): StorageConfig {
  return {
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    bucket: env.NEXT_PUBLIC_STORAGE_BUCKET?.trim() || 'Bright Designs',
    rootPrefix: env.NEXT_PUBLIC_STORAGE_ROOT_PREFIX?.trim() || 'files',
  }
}

export async function loadShowSheetTables(databaseUrl: string, storage: StorageConfig): Promise<ShowSheetTables> {
  const client = postgres(databaseUrl, { prepare: false, max: 1 })
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
            showId: showArrangements.showId,
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

        const pieceLinks = await tx
          .select({ arrangementId: arrangementPieces.arrangementId, title: pieces.title })
          .from(arrangementPieces)
          .innerJoin(pieces, eq(pieces.id, arrangementPieces.pieceId))
          .orderBy(asc(arrangementPieces.arrangementId), asc(arrangementPieces.orderIndex))

        const pieceRows = await tx.select().from(pieces).orderBy(asc(pieces.id))

        return { showRows, links, arrangementRows, audioRows, pieceLinks, pieceRows }
      },
      { accessMode: 'read only' }
    )

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

    return {
      shows: data.showRows.map(s => {
        // ensemble_size / includes are not columns on `shows` yet (#51). Read
        // them if a later migration adds them; otherwise they export blank.
        const extra = s as unknown as { ensembleSize?: string | null; includes?: string[] | null }
        return showRow({
          ...s,
          ensembleSize: extra.ensembleSize ?? null,
          includes: extra.includes ?? null,
          tagNames: s.showsToTags.map(st => st.tag.name).sort((x, y) => x.localeCompare(y)),
        })
      }),
      parts: parts.map(partRow),
      pieces: data.pieceRows.map(pieceRow),
      links: data.links.map(l => ({ show_id: l.showId, arrangement_id: l.arrangementId, order_index: l.orderIndex })),
    }
  } finally {
    await client.end()
  }
}
