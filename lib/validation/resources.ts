import { z } from 'zod'
import { concurrencyStamp, rowId } from './concurrency'

/**
 * Resource (downloadable guide) payloads for lib/actions/resources.ts.
 *
 * The API routes these replace read fields off the raw body with no
 * validation. Strict objects: an unknown key is rejected, not ignored.
 * `downloadCount`, `createdAt` and `updatedAt` are server-owned.
 */

const slug = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase words separated by hyphens')

/** Empty strings from cleared inputs mean "none". */
const optionalText = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
  z.string().trim().nullable().optional()
)

const fields = {
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title is too long'),
  slug,
  description: optionalText,
  fileUrl: optionalText,
  imageUrl: optionalText,
  isActive: z.boolean(),
  requiresContactForm: z.boolean(),
}

/** `slug` is optional: derived from the title when absent. */
export const createResourceSchema = z
  .object({
    ...fields,
    slug: slug.optional(),
    isActive: fields.isActive.optional(),
    requiresContactForm: fields.requiresContactForm.optional(),
  })
  .strict()
export type CreateResourceInput = z.input<typeof createResourceSchema>

/** Partial: only the keys sent change. `id` and `updatedAt` are required. */
export const updateResourceSchema = z
  .object(fields)
  .partial()
  .extend({ id: rowId, updatedAt: concurrencyStamp })
  .strict()
export type UpdateResourceInput = z.input<typeof updateResourceSchema>

export const resourceIdSchema = z.object({ id: rowId }).strict()

export const setResourceActiveSchema = z.object({ id: rowId, isActive: z.boolean() }).strict()
