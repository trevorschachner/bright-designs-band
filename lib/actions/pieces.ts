'use server'

import { eq } from 'drizzle-orm'
import { pieces } from '@/lib/database/schema'
import { invalidatePieces } from '@/lib/services/invalidate'
import { getPiecesForAdmin } from '@/lib/services/pieces'
import {
  createPieceSchema,
  listPiecesSchema,
  pieceIdSchema,
  updatePieceSchema,
  type CreatePieceInput,
  type UpdatePieceInput,
} from '@/lib/validation/pieces'
import { guarded, NotFoundError } from './_guarded'
import type { ActionResult } from './result'

/**
 * Source pieces (#51): the catalogue the pieces page edits and the part
 * editor links from. Admin-only, reads included: pieces carry copyright cost
 * and licensing status. Replaces /api/pieces and /api/pieces/[id]. Linking
 * pieces to a part is `setArrangementPieces` (./arrangements.ts).
 */

export type PieceRow = {
  id: number
  title: string
  composer: string | null
  copyrightAmountUsd: string | null
  licensingStatus: string | null
  usageCount: number
}

const COLUMNS = {
  id: pieces.id,
  title: pieces.title,
  composer: pieces.composer,
  copyrightAmountUsd: pieces.copyrightAmountUsd,
  licensingStatus: pieces.licensingStatus,
}

const runListPieces = guarded(
  'canEditArrangements',
  listPiecesSchema,
  async () => {
    const rows = await getPiecesForAdmin()
    const data: PieceRow[] = rows.map(({ id, title, composer, copyrightAmountUsd, licensingStatus, usageCount }) => ({
      id,
      title,
      composer,
      copyrightAmountUsd,
      licensingStatus,
      usageCount: Number(usageCount),
    }))
    return { data }
  },
  'listPieces'
)

/** Every piece with how many parts use it, by title. */
export async function listPieces(): Promise<ActionResult<PieceRow[]>> {
  return runListPieces({})
}

const runCreatePiece = guarded(
  'canEditArrangements',
  createPieceSchema,
  async (data, { db }) => {
    const [row] = await db.insert(pieces).values(data).returning(COLUMNS)
    return { data: { ...row, usageCount: 0 }, invalidate: () => invalidatePieces() }
  },
  'createPiece'
)

export async function createPiece(input: CreatePieceInput): Promise<ActionResult<PieceRow>> {
  return runCreatePiece(input)
}

const runUpdatePiece = guarded(
  'canEditArrangements',
  updatePieceSchema,
  async ({ id, ...fields }, { db }) => {
    const [row] = await db
      .update(pieces)
      .set({ ...fields, updatedAt: new Date() })
      .where(eq(pieces.id, id))
      .returning(COLUMNS)
    if (!row) throw new NotFoundError('piece')
    return { data: { id: row.id }, invalidate: () => invalidatePieces() }
  },
  'updatePiece'
)

/** Last-writer-wins: the pieces table has no concurrency stamp in use yet. */
export async function updatePiece(input: UpdatePieceInput): Promise<ActionResult<{ id: number }>> {
  return runUpdatePiece(input)
}

const runDeletePiece = guarded(
  'canEditArrangements',
  pieceIdSchema,
  async ({ id }, { db }) => {
    // Unlinks it from every part (FK cascade).
    const [row] = await db.delete(pieces).where(eq(pieces.id, id)).returning({ id: pieces.id })
    if (!row) throw new NotFoundError('piece')
    return { data: { id: row.id }, invalidate: () => invalidatePieces() }
  },
  'deletePiece'
)

export async function deletePiece(input: { id: number }): Promise<ActionResult<{ id: number }>> {
  return runDeletePiece(input)
}
