import { z } from 'zod'

/**
 * Write payloads for source pieces (#51).
 *
 * A piece is a source work ("Libertango"), not a show part. Parts live in
 * `arrangements`; `arrangement_pieces` links the two in order.
 *
 * Unknown keys are stripped (zod's default), so only these columns can reach
 * an insert or update.
 */

/** Optional free text: trimmed, and blank becomes null so the column is not ''. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform(value => (value ? value : null))

/**
 * `copyright_amount_usd` is numeric(10,2). Drizzle carries numerics as strings
 * to avoid float loss, while the admin form sends numbers or blank strings.
 * All three normalise to the string form, or null when blank.
 */
const usdAmount = z
  .union([z.number(), z.string()])
  .nullable()
  .optional()
  .transform((value, ctx) => {
    if (value === null || value === undefined) return null
    const text = String(value).trim()
    if (text === '') return null
    if (!/^-?\d{1,8}(\.\d{1,2})?$/.test(text)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Copyright amount must be a dollar amount with at most 2 decimals',
      })
      return z.NEVER
    }
    return text
  })

export const pieceInputSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(300, 'Title is too long'),
  composer: optionalText(300),
  copyrightAmountUsd: usdAmount,
  licensingStatus: optionalText(100),
})

export type PieceInput = z.infer<typeof pieceInputSchema>

/**
 * Replaces the ordered list of pieces on one arrangement. Order in the array is
 * the order on the part; the route writes it to `order_index`.
 */
export const arrangementPiecesInputSchema = z.object({
  pieceIds: z
    .array(z.number().int().positive())
    .max(50, 'Too many pieces for one part')
    .refine(ids => new Set(ids).size === ids.length, 'A piece can appear only once per part'),
})

export type ArrangementPiecesInput = z.infer<typeof arrangementPiecesInputSchema>

// ---------------------------------------------------------------------------
// Server Action payloads (lib/actions/pieces.ts). Strict: unknown keys rejected.
// ---------------------------------------------------------------------------

export const createPieceSchema = pieceInputSchema.strict()
export type CreatePieceInput = z.input<typeof createPieceSchema>

export const updatePieceSchema = pieceInputSchema.extend({ id: z.number().int().positive() }).strict()
export type UpdatePieceInput = z.input<typeof updatePieceSchema>

export const pieceIdSchema = z.object({ id: z.number().int().positive() }).strict()

/** `listPieces` takes nothing. */
export const listPiecesSchema = z.object({}).strict()
