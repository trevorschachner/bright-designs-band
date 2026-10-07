'use server'

import { eq } from 'drizzle-orm'
import type { Database } from '@/lib/database'
import { shows, showsToTags, slugRedirects } from '@/lib/database/schema'
import { invalidateShow } from '@/lib/services/invalidate'
import { toIso } from '@/lib/services/cache'
import { slugFromTitle } from '@/lib/slug'
import {
  createShowSchema,
  setFeaturedSchema,
  setShowTagsSchema,
  showIdSchema,
  updateShowActionSchema,
  type CreateShowInput,
  type UpdateShowActionInput,
} from '@/lib/validation/shows'
import { assertFresh, guarded, InvalidError, NotFoundError } from './_guarded'
import type { ActionResult } from './result'

/**
 * Show writes for the admin. Each action: guard('canManageShows') → strict
 * schema → its writes (in one transaction where there is more than one) →
 * invalidateShow after commit. See ./README.md.
 *
 * Slugs: `updateShow` changes the slug only when `slug` is sent. On a change
 * the previous slug is recorded in `slug_redirects`, so /shows/<old> 308s to
 * the new URL, and any redirect row whose old slug is the new one is deleted
 * (a live slug never also redirects).
 */

type Tx = Parameters<Parameters<Database['transaction']>[0]>[0]

export type ShowWriteResult = {
  id: number
  slug: string
  title: string
  featured: boolean
  /** Send this back as `updatedAt` on the next `updateShow`. */
  updatedAt: string
}

const WRITE_COLUMNS = {
  id: shows.id,
  slug: shows.slug,
  title: shows.title,
  featured: shows.featured,
  updatedAt: shows.updatedAt,
}

type WriteRow = { id: number; slug: string; title: string; featured: boolean; updatedAt: Date | string }

function toWriteResult(row: WriteRow): ShowWriteResult {
  return { id: row.id, slug: row.slug, title: row.title, featured: row.featured, updatedAt: toIso(row.updatedAt) ?? '' }
}

/** A slug a show now owns must not also redirect (to it or another show). */
async function releaseRedirect(tx: Tx, slug: string) {
  await tx.delete(slugRedirects).where(eq(slugRedirects.oldSlug, slug))
}

async function replaceShowTags(tx: Tx, showId: number, tagIds: number[]) {
  await tx.delete(showsToTags).where(eq(showsToTags.showId, showId))
  const unique = [...new Set(tagIds)]
  if (unique.length > 0) {
    await tx.insert(showsToTags).values(unique.map((tagId) => ({ showId, tagId })))
  }
}

/** Locks the show row; throws NotFoundError when it does not exist. */
async function lockShow(tx: Tx, id: number) {
  const [row] = await tx
    .select({ id: shows.id, slug: shows.slug, updatedAt: shows.updatedAt })
    .from(shows)
    .where(eq(shows.id, id))
    .limit(1)
    .for('update')
  if (!row) throw new NotFoundError('show')
  return row
}

// ---------------------------------------------------------------------------

/** Most numbered variants a new show's slug is tried with before giving up (conflict). */
const MAX_SLUG_ATTEMPTS = 50

const runCreateShow = guarded(
  'canManageShows',
  createShowSchema,
  async (data, { db }) => {
    const { tags: tagIds, ...fields } = data
    const base = slugFromTitle(fields.title)
    if (!base) throw new InvalidError([{ path: 'title', message: 'Title needs at least one letter or number' }])

    const created = await db.transaction(async (tx) => {
      let slug = base
      for (let n = 1; n <= MAX_SLUG_ATTEMPTS; n++) {
        const [taken] = await tx.select({ id: shows.id }).from(shows).where(eq(shows.slug, slug)).limit(1)
        if (!taken) break
        slug = `${base}-${n}`
      }
      // Past MAX_SLUG_ATTEMPTS the insert hits the unique index: conflict.
      const [row] = await tx
        .insert(shows)
        .values({
          title: fields.title,
          slug,
          year: fields.year ?? null,
          difficulty: fields.difficulty ?? null,
          duration: fields.duration ?? null,
          description: fields.description ?? null,
          price: fields.price ?? null,
          thumbnailUrl: fields.thumbnailUrl ?? null,
          videoUrl: fields.videoUrl ?? null,
          displayOrder: fields.displayOrder ?? 0,
        })
        .returning(WRITE_COLUMNS)
      await releaseRedirect(tx, row.slug)
      if (tagIds && tagIds.length > 0) await replaceShowTags(tx, row.id, tagIds)
      return row
    })

    invalidateShow(created.id, created.slug)
    return toWriteResult(created)
  },
  'createShow'
)

export async function createShow(input: CreateShowInput): Promise<ActionResult<ShowWriteResult>> {
  return runCreateShow(input)
}

// ---------------------------------------------------------------------------

const runUpdateShow = guarded(
  'canManageShows',
  updateShowActionSchema,
  async (data, { db }) => {
    const { id, updatedAt, tags: tagIds, ...fields } = data

    const { row, previousSlug } = await db.transaction(async (tx) => {
      const current = await lockShow(tx, id)
      assertFresh(current.updatedAt, updatedAt, 'show')

      const slugChanged = fields.slug !== undefined && fields.slug !== current.slug
      const [updated] = await tx
        .update(shows)
        .set({ ...fields, updatedAt: new Date() })
        .where(eq(shows.id, id))
        .returning(WRITE_COLUMNS)

      if (slugChanged) {
        await releaseRedirect(tx, updated.slug)
        await tx
          .insert(slugRedirects)
          .values({ oldSlug: current.slug, showId: id })
          .onConflictDoUpdate({ target: slugRedirects.oldSlug, set: { showId: id, createdAt: new Date() } })
      }

      if (tagIds !== undefined) await replaceShowTags(tx, id, tagIds)

      return { row: updated, previousSlug: current.slug }
    })

    invalidateShow(row.id, row.slug, previousSlug)
    return toWriteResult(row)
  },
  'updateShow'
)

/**
 * Saves the editor. `updatedAt` must be the value the editor loaded (or got
 * back from its last save); if the show changed since, nothing is written and
 * the result is `stale`.
 */
export async function updateShow(input: UpdateShowActionInput): Promise<ActionResult<ShowWriteResult>> {
  return runUpdateShow(input)
}

// ---------------------------------------------------------------------------

const runDeleteShow = guarded(
  'canManageShows',
  showIdSchema,
  async ({ id }, { db }) => {
    // Files, tag links, part links and slug redirects go with it (FK cascades).
    const [deleted] = await db.delete(shows).where(eq(shows.id, id)).returning({ id: shows.id, slug: shows.slug })
    if (!deleted) throw new NotFoundError('show')
    invalidateShow(deleted.id, deleted.slug)
    return { id: deleted.id }
  },
  'deleteShow'
)

export async function deleteShow(id: number): Promise<ActionResult<{ id: number }>> {
  return runDeleteShow({ id })
}

// ---------------------------------------------------------------------------

/*
 * Single-field writes from list views (tag picker, featured toggle). They do
 * not take `updatedAt`: they are last-writer-wins on purpose, like a checkbox.
 * They do bump `updated_at`, so an editor open on the same show gets `stale`
 * on its next save instead of silently undoing the change.
 */

const runSetShowTags = guarded(
  'canManageShows',
  setShowTagsSchema,
  async ({ showId, tagIds }, { db }) => {
    const row = await db.transaction(async (tx) => {
      await lockShow(tx, showId)
      await replaceShowTags(tx, showId, tagIds)
      const [updated] = await tx
        .update(shows)
        .set({ updatedAt: new Date() })
        .where(eq(shows.id, showId))
        .returning(WRITE_COLUMNS)
      return updated
    })
    invalidateShow(row.id, row.slug)
    return toWriteResult(row)
  },
  'setShowTags'
)

export async function setShowTags(showId: number, tagIds: number[]): Promise<ActionResult<ShowWriteResult>> {
  return runSetShowTags({ showId, tagIds })
}

const runSetFeatured = guarded(
  'canManageShows',
  setFeaturedSchema,
  async ({ showId, featured }, { db }) => {
    const [row] = await db
      .update(shows)
      .set({ featured, updatedAt: new Date() })
      .where(eq(shows.id, showId))
      .returning(WRITE_COLUMNS)
    if (!row) throw new NotFoundError('show')
    invalidateShow(row.id, row.slug)
    return toWriteResult(row)
  },
  'setFeatured'
)

export async function setFeatured(showId: number, featured: boolean): Promise<ActionResult<ShowWriteResult>> {
  return runSetFeatured({ showId, featured })
}
