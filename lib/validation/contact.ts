import { z } from 'zod'

/**
 * Public contact-form payload.
 *
 * The handler previously destructured the raw body and passed `email` into
 * both a database insert and `sendEmail`'s `to:` field with no checks at all.
 * The newline guard matters specifically for that second use: an address
 * containing CR/LF is a header-injection vector.
 */
const noControlChars = (value: string) => !/[\r\n]/.test(value)

export const contactSubmissionSchema = z.object({
  // name and message are optional in practice: the resource-download flow
  // posts without them and the handler substitutes defaults.
  name: z.string().trim().max(200).optional(),
  email: z
    .string()
    .trim()
    .max(320)
    .email('A valid email address is required')
    .refine(noControlChars, 'Email must not contain line breaks'),
  message: z.string().trim().max(10000).optional(),
  type: z.string().trim().max(64).optional(),
  source: z.string().trim().max(128).optional(),
  phone: z.string().trim().max(64).optional(),
  school: z.string().trim().max(200).optional(),
  interestedShowId: z.coerce.number().int().positive().optional(),
  interestedArrangementId: z.coerce.number().int().positive().optional(),
})

export type ContactSubmission = z.infer<typeof contactSubmissionSchema>
