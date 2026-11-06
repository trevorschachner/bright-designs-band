import { z } from 'zod'
import { concurrencyStamp, rowId } from './concurrency'
import { TAG_KINDS } from './enums'

/**
 * Tag write payload.
 *
 * The POST/PUT handlers previously spread the raw request body straight into
 * `db.insert(tags).values(body)`, which made every column writable by anyone
 * who could reach the route. zod's default strip behaviour is what closes
 * that: unknown keys never reach Drizzle.
 */
export const tagInputSchema = z.object({
  name: z.string().trim().min(1, 'Tag name is required').max(100, 'Tag name is too long'),
  /** The facet the tag belongs to. Left out: `other` on create, unchanged on update. */
  kind: z.enum(TAG_KINDS).optional(),
})

export type TagInput = z.infer<typeof tagInputSchema>

/** Action payloads (lib/actions/tags.ts). Strict: unknown keys are rejected. */
export const createTagSchema = tagInputSchema.strict()

export const updateTagSchema = tagInputSchema
  .extend({
    id: rowId,
    /** The `updatedAt` the caller loaded (optimistic concurrency). */
    updatedAt: concurrencyStamp,
  })
  .strict()

export const tagIdSchema = z.object({ id: rowId }).strict()
