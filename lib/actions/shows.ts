'use server'

import { eq } from 'drizzle-orm'
import type { Tx } from '@/lib/database'
import { shows, slugRedirects } from '@/lib/database/schema'
import { removeOwnerFiles } from '@/lib/services/file-removal'
import { invalidateShow } from '@/lib/services/invalidate'
import { trackServerEvent } from '@/lib/observability/events'
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
import { replaceTagLinks } from './_links'
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
  async (data, { db, email }) => {
    const { tags: tagIds, ...fields } = data
    const base = slugFromTitle(fields.title)
    if (!base) throw new InvalidError([{ path: 'title', message: 'Title needs at least one letter or number' }])

    const created = await db.transaction(async (tx) => {
      let slug = base
      for (let n = 1; n <= MAX_SLUG_ATTEMPTS; n++) {
        // Skip slugs another show holds or used to hold (a live redirect).
        const [taken] = await tx.select({ id: shows.id }).from(shows).where(eq(shows.slug, slug)).limit(1)
        const [redirected] = taken
          ? [undefined]
          : await tx.select({ showId: slugRedirects.showId }).from(slugRedirects).where(eq(slugRedirects.oldSlug, slug)).limit(1)
        if (!taken && !redirected) break
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
          programNotes: fields.programNotes ?? null,
          videoUrl: fields.videoUrl ?? null,
          displayOrder: fields.displayOrder ?? 0,
        })
        .returning(WRITE_COLUMNS)
      // Belt and braces: the probe skipped redirected slugs, but a redirect
      // written concurrently must not shadow the new show.
      await releaseRedirect(tx, row.slug)
      if (tagIds && tagIds.length > 0) await replaceTagLinks(tx, { showId: row.id }, tagIds)
      return row
    })

    return {
      data: toWriteResult(created),
      invalidate: async () => {
        try {
          await invalidateShow(created.id, created.slug)
        } finally {
          await trackServerEvent('show.saved', { showId: created.id, slug: created.slug, created: true }, email)
        }
      },
    }
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
  async (data, { db, email }) => {
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

      if (tagIds !== undefined) await replaceTagLinks(tx, { showId: id }, tagIds)

      return { row: updated, previousSlug: current.slug }
    })

    return {
      data: toWriteResult(row),
      invalidate: async () => {
        try {
          await invalidateShow(row.id, row.slug, previousSlug)
        } finally {
          await trackServerEvent('show.saved', { showId: row.id, slug: row.slug, created: false }, email)
        }
      },
    }
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
    const [show] = await db.select({ id: shows.id, slug: shows.slug }).from(shows).where(eq(shows.id, id)).limit(1)
    if (!show) throw new NotFoundError('show')

    // The show's files first (lib/services/file-removal.ts). A failure aborts
    // with the show kept and what was already removed invalidated.
    const { invalidateRemoved } = await removeOwnerFiles(db, { showId: show.id })

    // Tag links, part links and slug redirects go with it (FK cascades).
    const [deleted] = await db.delete(shows).where(eq(shows.id, id)).returning({ id: shows.id, slug: shows.slug })
    if (!deleted) throw new NotFoundError('show')
    return {
      data: { id: deleted.id },
      invalidate: async () => {
        invalidateShow(deleted.id, deleted.slug)
        await invalidateRemoved()
      },
    }
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
      await replaceTagLinks(tx, { showId }, tagIds)
      const [updated] = await tx
        .update(shows)
        .set({ updatedAt: new Date() })
        .where(eq(shows.id, showId))
        .returning(WRITE_COLUMNS)
      return updated
    })
    return { data: toWriteResult(row), invalidate: () => invalidateShow(row.id, row.slug) }
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
    return { data: toWriteResult(row), invalidate: () => invalidateShow(row.id, row.slug) }
  },
  'setFeatured'
)

export async function setFeatured(showId: number, featured: boolean): Promise<ActionResult<ShowWriteResult>> {
  return runSetFeatured({ showId, featured })
}
