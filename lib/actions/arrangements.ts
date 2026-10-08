'use server'

import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import type { Database } from '@/lib/database'
import {
  arrangementPieces,
  arrangements,
  arrangementsToTags,
  files,
  pieces,
  showArrangements,
  shows,
  tags,
} from '@/lib/database/schema'
import { invalidateArrangement, invalidateShow } from '@/lib/services/invalidate'
import { trackServerEvent } from '@/lib/observability/events'
import { toIso } from '@/lib/services/cache'
import { getArrangementPiecesForAdmin } from '@/lib/services/pieces'
import { invalidateShowsById, REMOVABLE_FILE_COLUMNS, removeFilesInOrder } from '@/lib/services/file-removal'
import { createClient } from '@/lib/utils/supabase/server'
import {
  arrangementIdSchema,
  createArrangementSchema,
  reorderArrangementsSchema,
  setArrangementPiecesSchema,
  setArrangementTagsSchema,
  updateArrangementSchema,
  type CreateArrangementInput,
  type UpdateArrangementInput,
} from '@/lib/validation/arrangements'
import { assertFresh, guarded, InvalidError, NotFoundError } from './_guarded'
import type { ActionResult } from './result'

/**
 * Arrangement (show part) writes. guard → strict camelCase schema → writes in
 * one transaction → invalidateArrangement (or invalidateShow for a reorder)
 * after commit. See ./README.md.
 *
 * The order of parts on a show is `show_arrangements.order_index`, 1..n.
 * `createArrangement` appends; `reorderArrangements` rewrites the whole list.
 * `arrangements.display_order` is legacy (never read for ordering) and is not
 * written here.
 */

type Tx = Parameters<Parameters<Database['transaction']>[0]>[0]

export type ArrangementWriteResult = {
  id: number
  title: string
  /** Send this back as `updatedAt` on the next `updateArrangement`. */
  updatedAt: string
}

const COLUMNS = { id: arrangements.id, title: arrangements.title, updatedAt: arrangements.updatedAt }

const toResult = (row: { id: number; title: string; updatedAt: Date | string }): ArrangementWriteResult => ({
  id: row.id,
  title: row.title,
  updatedAt: toIso(row.updatedAt) ?? '',
})

/** Every id must name an existing tag (`invalid`, path `tags`), checked before writing. */
async function replaceArrangementTags(tx: Tx, arrangementId: number, tagIds: number[]) {
  const unique = [...new Set(tagIds)]
  if (unique.length > 0) {
    const found = new Set((await tx.select({ id: tags.id }).from(tags).where(inArray(tags.id, unique))).map((r) => r.id))
    const unknown = unique.filter((id) => !found.has(id))
    if (unknown.length > 0) {
      throw new InvalidError(unknown.map((id) => ({ path: 'tags', message: `Unknown tag id ${id}` })))
    }
  }
  await tx.delete(arrangementsToTags).where(eq(arrangementsToTags.arrangementId, arrangementId))
  if (unique.length > 0) {
    await tx.insert(arrangementsToTags).values(unique.map((tagId) => ({ arrangementId, tagId })))
  }
}

/** Locks the arrangement row; NotFoundError when it does not exist. */
async function lockArrangement(tx: Tx, id: number) {
  const [row] = await tx
    .select({ id: arrangements.id, updatedAt: arrangements.updatedAt })
    .from(arrangements)
    .where(eq(arrangements.id, id))
    .limit(1)
    .for('update')
  if (!row) throw new NotFoundError('arrangement')
  return row
}

/** Locks the show row; NotFoundError when it does not exist. */
async function lockShow(tx: Tx, id: number) {
  const [row] = await tx.select({ id: shows.id, slug: shows.slug }).from(shows).where(eq(shows.id, id)).limit(1).for('update')
  if (!row) throw new NotFoundError('show')
  return row
}

/** The (first) show the part belongs to: its slug for the show page path, its id for events. */
async function firstShowFor(tx: Tx | Database, arrangementId: number): Promise<{ id: number; slug: string } | null> {
  const [row] = await tx
    .select({ id: shows.id, slug: shows.slug })
    .from(showArrangements)
    .innerJoin(shows, eq(shows.id, showArrangements.showId))
    .where(eq(showArrangements.arrangementId, arrangementId))
    .orderBy(asc(showArrangements.orderIndex))
    .limit(1)
  return row ?? null
}

async function showSlugFor(tx: Tx | Database, arrangementId: number): Promise<string | null> {
  return (await firstShowFor(tx, arrangementId))?.slug ?? null
}

// ---------------------------------------------------------------------------

const runCreateArrangement = guarded(
  'canCreateArrangements',
  createArrangementSchema,
  async (data, { db, email }) => {
    const { showId, tags: tagIds, ...fields } = data
    const { row, slug } = await db.transaction(async (tx) => {
      const show = await lockShow(tx, showId)
      const [last] = await tx
        .select({ orderIndex: showArrangements.orderIndex })
        .from(showArrangements)
        .where(eq(showArrangements.showId, showId))
        .orderBy(desc(showArrangements.orderIndex))
        .limit(1)
      const orderIndex = (last?.orderIndex ?? 0) + 1
      const [inserted] = await tx
        .insert(arrangements)
        .values({ ...fields, updatedAt: new Date() })
        .returning(COLUMNS)
      await tx.insert(showArrangements).values({ showId, arrangementId: inserted.id, orderIndex })
      if (tagIds && tagIds.length > 0) await replaceArrangementTags(tx, inserted.id, tagIds)
      return { row: inserted, slug: show.slug }
    })
    return {
      data: toResult(row),
      invalidate: async () => {
        try {
          await invalidateArrangement(row.id, slug)
        } finally {
          await trackServerEvent('arrangement.saved', { arrangementId: row.id, showId }, email)
        }
      },
    }
  },
  'createArrangement'
)

/** Adds a part to the end of a show's list. */
export async function createArrangement(input: CreateArrangementInput): Promise<ActionResult<ArrangementWriteResult>> {
  return runCreateArrangement(input)
}

// ---------------------------------------------------------------------------

const runUpdateArrangement = guarded(
  'canEditArrangements',
  updateArrangementSchema,
  async (data, { db, email }) => {
    const { id, updatedAt, tags: tagIds, ...fields } = data
    const { row, slug, showId } = await db.transaction(async (tx) => {
      const current = await lockArrangement(tx, id)
      assertFresh(current.updatedAt, updatedAt, 'arrangement')
      const [updated] = await tx
        .update(arrangements)
        .set({ ...fields, updatedAt: new Date() })
        .where(eq(arrangements.id, id))
        .returning(COLUMNS)
      if (tagIds !== undefined) await replaceArrangementTags(tx, id, tagIds)
      const owner = await firstShowFor(tx, id)
      return { row: updated, slug: owner?.slug ?? null, showId: owner?.id ?? null }
    })
    return {
      data: toResult(row),
      invalidate: async () => {
        try {
          await invalidateArrangement(row.id, slug)
        } finally {
          await trackServerEvent('arrangement.saved', { arrangementId: row.id, showId }, email)
        }
      },
    }
  },
  'updateArrangement'
)

/**
 * Saves a part. `updatedAt` must be the value the form loaded (or got back
 * from its last save); if the part changed since, nothing is written: `stale`.
 */
export async function updateArrangement(input: UpdateArrangementInput): Promise<ActionResult<ArrangementWriteResult>> {
  return runUpdateArrangement(input)
}

// ---------------------------------------------------------------------------

const runDeleteArrangement = guarded(
  'canDeleteArrangements',
  arrangementIdSchema,
  async ({ id }, { db }) => {
    // The part's files first, each through the confirmed path deleteFile
    // uses (lib/services/file-removal.ts), each committed on its own. A
    // failure aborts before the part is touched: `failed`, part and remaining
    // files kept, and what was already removed is invalidated.
    const partFiles = await db.select(REMOVABLE_FILE_COLUMNS).from(files).where(eq(files.arrangementId, id))
    let clearedShowIds: number[] = []
    if (partFiles.length > 0) {
      const ownerSlug = await showSlugFor(db, id)
      ;({ clearedShowIds } = await removeFilesInOrder(db, partFiles, createClient, async (cleared) => {
        invalidateArrangement(id, ownerSlug)
        await invalidateShowsById(cleared)
      }))
    }

    const { deleted, slug } = await db.transaction(async (tx) => {
      // Read first: the cascade removes the link to the show.
      const slug = await showSlugFor(tx, id)
      // Show links, tag links and piece links go with it (FK cascades); its files are already gone.
      const [deleted] = await tx.delete(arrangements).where(eq(arrangements.id, id)).returning({ id: arrangements.id })
      if (!deleted) throw new NotFoundError('arrangement')
      return { deleted, slug }
    })
    return {
      data: { id: deleted.id },
      invalidate: async () => {
        invalidateArrangement(deleted.id, slug)
        // A show whose thumbnail/graphic pointed at one of the part's files was cleared.
        await invalidateShowsById(clearedShowIds)
      },
    }
  },
  'deleteArrangement'
)

export async function deleteArrangement(input: { id: number }): Promise<ActionResult<{ id: number }>> {
  return runDeleteArrangement(input)
}

// ---------------------------------------------------------------------------

const runReorderArrangements = guarded(
  'canEditArrangements',
  reorderArrangementsSchema,
  async ({ showId, orderedIds }, { db }) => {
    const slug = await db.transaction(async (tx) => {
      const show = await lockShow(tx, showId)
      const linked = await tx
        .select({ arrangementId: showArrangements.arrangementId })
        .from(showArrangements)
        .where(eq(showArrangements.showId, showId))
      const current = new Set(linked.map((r) => r.arrangementId))
      const sameSet = current.size === orderedIds.length && orderedIds.every((id) => current.has(id))
      if (!sameSet) {
        // The list changed under the editor (a part was added or removed).
        throw new InvalidError([{ path: 'orderedIds', message: 'The parts on this show changed. Reload and try again.' }])
      }
      for (const [index, arrangementId] of orderedIds.entries()) {
        await tx
          .update(showArrangements)
          .set({ orderIndex: index + 1 })
          .where(and(eq(showArrangements.showId, showId), eq(showArrangements.arrangementId, arrangementId)))
      }
      return show.slug
    })
    return { data: { showId, orderedIds }, invalidate: () => invalidateShow(showId, slug) }
  },
  'reorderArrangements'
)

/** Rewrites the show's part order to 1..n in the given order. Every part must be listed once. */
export async function reorderArrangements(input: {
  showId: number
  orderedIds: number[]
}): Promise<ActionResult<{ showId: number; orderedIds: number[] }>> {
  return runReorderArrangements(input)
}

// ---------------------------------------------------------------------------

const runSetArrangementTags = guarded(
  'canEditArrangements',
  setArrangementTagsSchema,
  async ({ arrangementId, tagIds }, { db }) => {
    const { row, slug } = await db.transaction(async (tx) => {
      await lockArrangement(tx, arrangementId)
      await replaceArrangementTags(tx, arrangementId, tagIds)
      // Last-writer-wins, but bumps updated_at so an open form gets `stale`.
      const [updated] = await tx
        .update(arrangements)
        .set({ updatedAt: new Date() })
        .where(eq(arrangements.id, arrangementId))
        .returning(COLUMNS)
      return { row: updated, slug: await showSlugFor(tx, arrangementId) }
    })
    return { data: toResult(row), invalidate: () => invalidateArrangement(row.id, slug) }
  },
  'setArrangementTags'
)

export async function setArrangementTags(input: {
  arrangementId: number
  tagIds: number[]
}): Promise<ActionResult<ArrangementWriteResult>> {
  return runSetArrangementTags(input)
}

// ---------------------------------------------------------------------------

export type LinkedPiece = Awaited<ReturnType<typeof getArrangementPiecesForAdmin>>[number]

const runSetArrangementPieces = guarded(
  'canEditArrangements',
  setArrangementPiecesSchema,
  async ({ arrangementId, pieceIds }, { db }) => {
    const slug = await db.transaction(async (tx) => {
      await lockArrangement(tx, arrangementId)
      if (pieceIds.length > 0) {
        const known = new Set((await tx.select({ id: pieces.id }).from(pieces).where(inArray(pieces.id, pieceIds))).map((p) => p.id))
        const missing = pieceIds.filter((id) => !known.has(id))
        if (missing.length > 0) {
          throw new InvalidError(missing.map((id) => ({ path: 'pieceIds', message: `Unknown piece id ${id}` })))
        }
      }
      await tx.delete(arrangementPieces).where(eq(arrangementPieces.arrangementId, arrangementId))
      if (pieceIds.length > 0) {
        await tx
          .insert(arrangementPieces)
          .values(pieceIds.map((pieceId, i) => ({ arrangementId, pieceId, orderIndex: i + 1 })))
      }
      return showSlugFor(tx, arrangementId)
    })
    // The credit list is part of the arrangement: an arrangement change. It
    // does not bump arrangements.updated_at (the pieces editor saves on each
    // change, beside an arrangement form that may be open).
    return {
      data: await getArrangementPiecesForAdmin(arrangementId),
      invalidate: () => invalidateArrangement(arrangementId, slug),
    }
  },
  'setArrangementPieces'
)

/** Replaces the part's ordered source pieces (add, remove and reorder are one call). */
export async function setArrangementPieces(input: {
  arrangementId: number
  pieceIds: number[]
}): Promise<ActionResult<LinkedPiece[]>> {
  return runSetArrangementPieces(input)
}
