import { z } from 'zod'
import { ARRANGEMENT_SCENES, ENSEMBLE_SIZES, GRADE_BANDS, type ArrangementScene, type EnsembleSize, type GradeBand } from './enums'
import { parseDuration } from '@/lib/utils'
import { concurrencyStamp, rowId } from './concurrency'

/**
 * Arrangement (show part) payloads for lib/actions/arrangements.ts.
 *
 * One camelCase shape for create and update. It replaces the old split where
 * POST /api/arrangements took camelCase and PUT took snake_case, and both
 * copied fields off an unvalidated body. Strict objects: an unknown key is
 * rejected, not ignored.
 *
 * `displayOrder` is not here: the order of parts on a show is
 * `show_arrangements.order_index`, written only by `reorderArrangements`
 * (and by `createArrangement`, which appends).
 */

/** Optional free text: trimmed; blank (or absent on create) becomes null. */
const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
    z.string().trim().max(max, `At most ${max} characters`).nullable()
  )

/** An optional enum: '' from an empty select means none. */
const optionalEnum = <T extends [string, ...string[]]>(values: T) =>
  z.preprocess((value) => (value === '' ? null : value), z.enum(values).nullable())

const fields = {
  title: z.string().trim().min(1, 'Title is required').max(300, 'Title is too long'),
  composer: optionalText(300),
  arranger: optionalText(300),
  percussionArranger: optionalText(300),
  description: optionalText(5000),
  grade: optionalEnum([...GRADE_BANDS]),
  scene: optionalEnum([...ARRANGEMENT_SCENES]),
  ensembleSize: optionalEnum([...ENSEMBLE_SIZES]),
  year: z.number().int('Year must be a whole number').min(1900, 'Year looks wrong').max(2100, 'Year looks wrong').nullable(),
  durationSeconds: z.number().int().min(0, 'Duration cannot be negative').max(60 * 60, 'Duration is over an hour').nullable(),
  youtubeUrl: optionalText(500),
  commissioned: optionalText(300),
  sampleScoreUrl: optionalText(1000),
  /** Tag ids. When present they replace the part's tags; when absent tags are untouched. */
  tags: z.array(rowId).max(200),
}

/** Same pattern as show slugs: lowercase words separated by single hyphens. */
export const arrangementSlugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase words separated by hyphens')
  .max(200, 'Slug is too long')

const optionalFields = z.object(fields).partial().omit({ title: true })

/** `createArrangement`: a new part, appended to the end of the show's list. */
export const createArrangementSchema = optionalFields
  .extend({ showId: rowId, title: fields.title })
  .strict()
export type CreateArrangementInput = z.input<typeof createArrangementSchema>

/** `updateArrangement`: partial (only the keys sent change); `id` and `updatedAt` required. */
export const updateArrangementSchema = optionalFields
  .extend({ id: rowId, updatedAt: concurrencyStamp, title: fields.title.optional(), slug: arrangementSlugSchema.optional() })
  .strict()
export type UpdateArrangementInput = z.input<typeof updateArrangementSchema>

export const arrangementIdSchema = z.object({ id: rowId }).strict()

/** Every part of the show, once each, in the new order. */
export const reorderArrangementsSchema = z
  .object({
    showId: rowId,
    orderedIds: z
      .array(rowId)
      .max(100)
      .refine((ids) => new Set(ids).size === ids.length, 'A part can appear only once'),
  })
  .strict()

export const setArrangementTagsSchema = z
  .object({ arrangementId: rowId, tagIds: z.array(rowId).max(200) })
  .strict()

/** Replaces a part's ordered source pieces (see lib/validation/pieces.ts). */
export const setArrangementPiecesSchema = z
  .object({
    arrangementId: rowId,
    pieceIds: z
      .array(rowId)
      .max(50, 'Too many pieces for one part')
      .refine((ids) => new Set(ids).size === ids.length, 'A piece can appear only once per part'),
  })
  .strict()

// ---------------------------------------------------------------------------
// The admin form (components/features/admin/show-editor/ArrangementForm.tsx)
// ---------------------------------------------------------------------------

/**
 * What the arrangement form holds: strings, as inputs produce them. Checked
 * in the browser with this schema, converted with `arrangementFormToInput`,
 * then checked again by the action's strict schema on the server.
 */
export const arrangementFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(300, 'Title is too long'),
  composer: z.string(),
  arranger: z.string(),
  percussionArranger: z.string(),
  description: z.string(),
  scene: z.string(),
  grade: z.string(),
  ensembleSize: z.string(),
  year: z.string().regex(/^(\d{4})?$/, 'Year must be four digits'),
  duration: z
    .string()
    .refine((value) => value.trim() === '' || parseDuration(value) !== null, 'Duration must be mm:ss, e.g. 4:30'),
  youtubeUrl: z.string(),
  sampleScoreUrl: z.string(),
  commissioned: z.string(),
  tags: z.array(z.number()),
})
export type ArrangementFormValues = z.infer<typeof arrangementFormSchema>

export const DEFAULT_ARRANGER = 'Brighton Barrineau, Trevor Schachner'

const blankToNull = (value: string) => (value.trim() === '' ? null : value.trim())

/** Form values → the fields both actions accept (minus ids and `updatedAt`). */
export function arrangementFormToInput(values: ArrangementFormValues) {
  return {
    title: values.title.trim(),
    composer: blankToNull(values.composer),
    arranger: blankToNull(values.arranger),
    percussionArranger: blankToNull(values.percussionArranger),
    description: blankToNull(values.description),
    scene: (blankToNull(values.scene) as ArrangementScene | null),
    grade: (blankToNull(values.grade) as GradeBand | null),
    ensembleSize: (blankToNull(values.ensembleSize) as EnsembleSize | null),
    year: values.year.trim() ? Number(values.year) : null,
    durationSeconds: values.duration.trim() ? parseDuration(values.duration) : null,
    youtubeUrl: blankToNull(values.youtubeUrl),
    sampleScoreUrl: blankToNull(values.sampleScoreUrl),
    commissioned: blankToNull(values.commissioned),
    tags: values.tags,
  }
}

/** Action issue paths → form field names (the form edits `duration`, the action takes `durationSeconds`). */
export const ARRANGEMENT_ISSUE_FIELD: Record<string, keyof ArrangementFormValues> = {
  durationSeconds: 'duration',
}
