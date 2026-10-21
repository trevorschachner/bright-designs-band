'use server'

import { and, asc, desc, eq } from 'drizzle-orm'
import type { Database, Tx } from '@/lib/database'
import {
  arrangementPieces,
  arrangements,
  files,
  showArrangements,
  shows,
} from '@/lib/database/schema'
import { invalidateArrangement, invalidateShow } from '@/lib/services/invalidate'
import { uniqueArrangementSlug } from '@/lib/slug'
import { toIso } from '@/lib/services/cache'
import { getArrangementPiecesForAdmin } from '@/lib/services/pieces'
import { removeOwnerFiles } from '@/lib/services/file-removal'
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
import { assertKnownIds, replaceTagLinks } from './_links'
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

async function arrangementSlugTaken(tx: Tx | Database, slug: string, exceptId?: number): Promise<boolean> {
  const rows = await tx.select({ id: arrangements.id }).from(arrangements).where(eq(arrangements.slug, slug)).limit(2)
  return rows.some((r) => r.id !== exceptId)
}

async function slugForArrangement(tx: Tx | Database, id: number): Promise<string | null> {
  const [row] = await tx.select({ slug: arrangements.slug }).from(arrangements).where(eq(arrangements.id, id)).limit(1)
  return row?.slug ?? null
}

/** Locks the arrangement row; NotFoundError when it does not exist. */
async function lockArrangement(tx: Tx, id: number) {
  const [row] = await tx
    .select({ id: arrangements.id, slug: arrangements.slug, updatedAt: arrangements.updatedAt })
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
  async (data, { db }) => {
    const { showId, tags: tagIds, ...fields } = data
    const { row, slug, arrangementSlug } = await db.transaction(async (tx) => {
      const show = await lockShow(tx, showId)
      const arrangementSlug = await uniqueArrangementSlug(fields.title, (s) => arrangementSlugTaken(tx, s))
      const [last] = await tx
        .select({ orderIndex: showArrangements.orderIndex })
        .from(showArrangements)
        .where(eq(showArrangements.showId, showId))
        .orderBy(desc(showArrangements.orderIndex))
        .limit(1)
      const orderIndex = (last?.orderIndex ?? 0) + 1
      const [inserted] = await tx
        .insert(arrangements)
        .values({ ...fields, slug: arrangementSlug, updatedAt: new Date() })
        .returning(COLUMNS)
      await tx.insert(showArrangements).values({ showId, arrangementId: inserted.id, orderIndex })
      if (tagIds && tagIds.length > 0) await replaceTagLinks(tx, { arrangementId: inserted.id }, tagIds)
      return { row: inserted, slug: show.slug, arrangementSlug }
    })
    return {
      data: toResult(row),
      invalidate: () => invalidateArrangement(row.id, arrangementSlug, slug),
      track: { event: 'arrangement.saved', props: { arrangementId: row.id, showId } },
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
  async (data, { db }) => {
    const { id, updatedAt, tags: tagIds, ...fields } = data
    const { row, slug, showId, arrangementSlug, previousSlug } = await db.transaction(async (tx) => {
      const current = await lockArrangement(tx, id)
      assertFresh(current.updatedAt, updatedAt, 'arrangement')
      if (fields.slug !== undefined && fields.slug !== current.slug && (await arrangementSlugTaken(tx, fields.slug, id))) {
        throw new InvalidError([{ path: 'slug', message: 'Another part already uses this slug' }])
      }
      const [updated] = await tx
        .update(arrangements)
        .set({ ...fields, updatedAt: new Date() })
        .where(eq(arrangements.id, id))
        .returning(COLUMNS)
      if (tagIds !== undefined) await replaceTagLinks(tx, { arrangementId: id }, tagIds)
      const owner = await firstShowFor(tx, id)
      return {
        row: updated,
        slug: owner?.slug ?? null,
        showId: owner?.id ?? null,
        arrangementSlug: fields.slug ?? current.slug,
        previousSlug: current.slug,
      }
    })
    return {
      data: toResult(row),
      invalidate: () => invalidateArrangement(row.id, arrangementSlug, slug, previousSlug),
      track: { event: 'arrangement.saved', props: { arrangementId: row.id, showId } },
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
    // The part's files first (lib/services/file-removal.ts). A failure aborts
    // before the part is touched: `failed`, part and remaining files kept, and
    // what was already removed is invalidated.
    const { invalidateRemoved } = await removeOwnerFiles(db, { arrangementId: id })

    const { deleted, slug, arrangementSlug } = await db.transaction(async (tx) => {
      // Read first: the cascade removes the link to the show.
      const slug = await showSlugFor(tx, id)
      const arrangementSlug = await slugForArrangement(tx, id)
      // Show links, tag links and piece links go with it (FK cascades); its files are already gone.
      const [deleted] = await tx.delete(arrangements).where(eq(arrangements.id, id)).returning({ id: arrangements.id })
      if (!deleted) throw new NotFoundError('arrangement')
      return { deleted, slug, arrangementSlug }
    })
    return {
      data: { id: deleted.id },
      invalidate: async () => {
        invalidateArrangement(deleted.id, arrangementSlug, slug)
        await invalidateRemoved()
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
    const { row, slug, arrangementSlug } = await db.transaction(async (tx) => {
      const current = await lockArrangement(tx, arrangementId)
      await replaceTagLinks(tx, { arrangementId }, tagIds)
      // Last-writer-wins, but bumps updated_at so an open form gets `stale`.
      const [updated] = await tx
        .update(arrangements)
        .set({ updatedAt: new Date() })
        .where(eq(arrangements.id, arrangementId))
        .returning(COLUMNS)
      return { row: updated, slug: await showSlugFor(tx, arrangementId), arrangementSlug: current.slug }
    })
    return { data: toResult(row), invalidate: () => invalidateArrangement(row.id, arrangementSlug, slug) }
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
    const { slug, arrangementSlug } = await db.transaction(async (tx) => {
      const current = await lockArrangement(tx, arrangementId)
      await assertKnownIds(tx, 'pieces', pieceIds, 'pieceIds')
      await tx.delete(arrangementPieces).where(eq(arrangementPieces.arrangementId, arrangementId))
      if (pieceIds.length > 0) {
        await tx
          .insert(arrangementPieces)
          .values(pieceIds.map((pieceId, i) => ({ arrangementId, pieceId, orderIndex: i + 1 })))
      }
      return { slug: await showSlugFor(tx, arrangementId), arrangementSlug: current.slug }
    })
    // The credit list is part of the arrangement: an arrangement change. It
    // does not bump arrangements.updated_at (the pieces editor saves on each
    // change, beside an arrangement form that may be open).
    return {
      data: await getArrangementPiecesForAdmin(arrangementId),
      invalidate: () => invalidateArrangement(arrangementId, arrangementSlug, slug),
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
