'use server'

import { eq } from 'drizzle-orm'
import type { Database } from '@/lib/database'
import { files, resources } from '@/lib/database/schema'
import { invalidateResources } from '@/lib/services/invalidate'
import { toIso } from '@/lib/services/cache'
import { slugFromTitle } from '@/lib/slug'
import {
  createResourceSchema,
  resourceIdSchema,
  setResourceActiveSchema,
  updateResourceSchema,
  type CreateResourceInput,
  type UpdateResourceInput,
} from '@/lib/validation/resources'
import { assertFresh, guarded, InvalidError, NotFoundError } from './_guarded'
import type { ActionResult } from './result'

/**
 * Resource (downloadable guide) writes. guard('canManageResources') → strict
 * schema → write → invalidateResources after commit. Slugs are unique
 * (resources_slug_unique): a taken slug, sent or derived from the title, is
 * `conflict`; nothing is silently renamed. See ./README.md.
 */

type Tx = Parameters<Parameters<Database['transaction']>[0]>[0]

export type ResourceWriteResult = {
  id: number
  slug: string
  title: string
  isActive: boolean
  updatedAt: string
}

const COLUMNS = {
  id: resources.id,
  slug: resources.slug,
  title: resources.title,
  isActive: resources.isActive,
  fileUrl: resources.fileUrl,
  description: resources.description,
  updatedAt: resources.updatedAt,
}

type Row = { id: number; slug: string; title: string; isActive: boolean; updatedAt: Date | string }

const toResult = (row: Row): ResourceWriteResult => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  isActive: row.isActive,
  updatedAt: toIso(row.updatedAt) ?? '',
})

/**
 * Same behaviour as the API routes these replace: a resource's description is
 * copied onto the file record it links to, so the file library shows it.
 */
async function syncFileDescription(tx: Tx, fileUrl: string | null, description: string | null) {
  if (!fileUrl || !description) return
  await tx.update(files).set({ description }).where(eq(files.url, fileUrl))
}

const runCreateResource = guarded(
  'canManageResources',
  createResourceSchema,
  async (data, { db }) => {
    const slug = data.slug ?? slugFromTitle(data.title)
    if (!slug) throw new InvalidError([{ path: 'slug', message: 'Add a slug: the title has no letters or numbers' }])

    const row = await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(resources)
        .values({
          title: data.title,
          slug,
          description: data.description ?? null,
          fileUrl: data.fileUrl ?? null,
          imageUrl: data.imageUrl ?? null,
          isActive: data.isActive ?? true,
          requiresContactForm: data.requiresContactForm ?? true,
        })
        .returning(COLUMNS)
      await syncFileDescription(tx, inserted.fileUrl, inserted.description)
      return inserted
    })
    invalidateResources()
    return toResult(row)
  },
  'createResource'
)

export async function createResource(input: CreateResourceInput): Promise<ActionResult<ResourceWriteResult>> {
  return runCreateResource(input)
}

const runUpdateResource = guarded(
  'canManageResources',
  updateResourceSchema,
  async (data, { db }) => {
    const { id, updatedAt, ...fields } = data
    const row = await db.transaction(async (tx) => {
      const [current] = await tx
        .select({ updatedAt: resources.updatedAt })
        .from(resources)
        .where(eq(resources.id, id))
        .limit(1)
        .for('update')
      if (!current) throw new NotFoundError('resource')
      assertFresh(current.updatedAt, updatedAt, 'resource')
      const [updated] = await tx
        .update(resources)
        .set({ ...fields, updatedAt: new Date() })
        .where(eq(resources.id, id))
        .returning(COLUMNS)
      if (fields.fileUrl !== undefined || fields.description !== undefined) {
        await syncFileDescription(tx, updated.fileUrl, updated.description)
      }
      return updated
    })
    invalidateResources()
    return toResult(row)
  },
  'updateResource'
)

/** Saves the resource editor. `updatedAt` is the value it loaded; a changed row is `stale`. */
export async function updateResource(input: UpdateResourceInput): Promise<ActionResult<ResourceWriteResult>> {
  return runUpdateResource(input)
}

const runSetResourceActive = guarded(
  'canManageResources',
  setResourceActiveSchema,
  async ({ id, isActive }, { db }) => {
    // A list-view toggle: last-writer-wins, but bumps updated_at so an open
    // editor gets `stale` rather than undoing it.
    const [row] = await db
      .update(resources)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(resources.id, id))
      .returning(COLUMNS)
    if (!row) throw new NotFoundError('resource')
    invalidateResources()
    return toResult(row)
  },
  'setResourceActive'
)

/** Publishes (`true`) or unpublishes (`false`, a draft) a resource. */
export async function setResourceActive(id: number, isActive: boolean): Promise<ActionResult<ResourceWriteResult>> {
  return runSetResourceActive({ id, isActive })
}

const runDeleteResource = guarded(
  'canManageResources',
  resourceIdSchema,
  async ({ id }, { db }) => {
    const [deleted] = await db.delete(resources).where(eq(resources.id, id)).returning({ id: resources.id })
    if (!deleted) throw new NotFoundError('resource')
    invalidateResources()
    return { id: deleted.id }
  },
  'deleteResource'
)

export async function deleteResource(id: number): Promise<ActionResult<{ id: number }>> {
  return runDeleteResource({ id })
}
