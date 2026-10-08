'use server'

import { eq } from 'drizzle-orm'
import { tags } from '@/lib/database/schema'
import { invalidateTags } from '@/lib/services/invalidate'
import { toIso } from '@/lib/services/cache'
import { createTagSchema, tagIdSchema, updateTagSchema } from '@/lib/validation/tags'
import { assertFresh, guarded, NotFoundError } from './_guarded'
import type { ActionResult } from './result'

/**
 * Tag writes. guard('canManageTags') → strict schema → write →
 * invalidateTags after commit. Tag names are unique (tags_name_unique): a
 * duplicate is `conflict`. See ./README.md.
 */

export type TagWriteResult = { id: number; name: string; updatedAt: string }

const COLUMNS = { id: tags.id, name: tags.name, updatedAt: tags.updatedAt }

const toResult = (row: { id: number; name: string; updatedAt: Date | string }): TagWriteResult => ({
  id: row.id,
  name: row.name,
  updatedAt: toIso(row.updatedAt) ?? '',
})

const runCreateTag = guarded(
  'canManageTags',
  createTagSchema,
  async ({ name }, { db }) => {
    const [row] = await db.insert(tags).values({ name }).returning(COLUMNS)
    return { data: toResult(row), invalidate: () => invalidateTags() }
  },
  'createTag'
)

export async function createTag(input: { name: string }): Promise<ActionResult<TagWriteResult>> {
  return runCreateTag(input)
}

const runUpdateTag = guarded(
  'canManageTags',
  updateTagSchema,
  async ({ id, name, updatedAt }, { db }) => {
    const row = await db.transaction(async (tx) => {
      const [current] = await tx
        .select({ updatedAt: tags.updatedAt })
        .from(tags)
        .where(eq(tags.id, id))
        .limit(1)
        .for('update')
      if (!current) throw new NotFoundError('tag')
      assertFresh(current.updatedAt, updatedAt, 'tag')
      const [updated] = await tx
        .update(tags)
        .set({ name, updatedAt: new Date() })
        .where(eq(tags.id, id))
        .returning(COLUMNS)
      return updated
    })
    return { data: toResult(row), invalidate: () => invalidateTags() }
  },
  'updateTag'
)

/** Renames a tag. `updatedAt` is the value the caller loaded; a changed tag is `stale`. */
export async function updateTag(input: { id: number; name: string; updatedAt: string }): Promise<ActionResult<TagWriteResult>> {
  return runUpdateTag(input)
}

const runDeleteTag = guarded(
  'canManageTags',
  tagIdSchema,
  async ({ id }, { db }) => {
    // Show and part links go with it (FK cascades).
    const [deleted] = await db.delete(tags).where(eq(tags.id, id)).returning({ id: tags.id })
    if (!deleted) throw new NotFoundError('tag')
    return { data: { id: deleted.id }, invalidate: () => invalidateTags() }
  },
  'deleteTag'
)

export async function deleteTag(id: number): Promise<ActionResult<{ id: number }>> {
  return runDeleteTag({ id })
}
