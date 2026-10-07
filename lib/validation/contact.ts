import { z } from 'zod'
import type { ServiceCategory } from '@/lib/email/types'

/**
 * Public contact-form payload.
 *
 * The handler previously destructured the raw body and passed `email` into
 * both a database insert and `sendEmail`'s `to:` field with no checks at all.
 * The newline guard matters specifically for that second use: an address
 * containing CR/LF is a header-injection vector.
 *
 * Every scalar the handler reads is modelled here. An earlier version declared
 * only some of them while the handler still read the rest off the raw body,
 * which made those constraints decorative — a non-string `phone` reached the
 * insert, threw, and was swallowed by the handler's catch, so the endpoint
 * reported success on a submission it never stored.
 */
const noControlChars = (value: string) => !/[\r\n]/.test(value)

const optionalText = (max: number) => z.string().trim().max(max).optional()

export const contactSubmissionSchema = z.object({
  // name and message are optional in practice: the resource-download flow
  // posts without them and the handler substitutes defaults.
  name: optionalText(200),
  email: z
    .string()
    .trim()
    .max(320)
    .email('A valid email address is required')
    .refine(noControlChars, 'Email must not contain line breaks'),
  message: optionalText(10000),
  type: optionalText(64),
  source: optionalText(128),
  phone: optionalText(64),
  school: optionalText(200),
  role: optionalText(128),
  showInterest: optionalText(500),
  bandSize: optionalText(64),
  abilityLevel: optionalText(64),
  instrumentation: optionalText(1000),
  referralSource: optionalText(200),
  referralBandDirector: optionalText(200),
  // These feed the email templates, which type them as ServiceCategory[] and
  // string[]. Validating the element type here is what lets the handler pass
  // them through without a cast.
  services: z.array(z.string()).max(50).optional(),
  showPlan: z.array(z.string()).max(50).optional(),
  // Cloudflare Turnstile response from the widget. Required on every form
  // that posts here; verified server-side before anything is stored or sent.
  // Stripped by the handler before persistence or email.
  turnstileToken: z.string().min(1).max(2048),
})

export type ContactSubmission = z.infer<typeof contactSubmissionSchema>

/**
 * The email templates narrow `services` to ServiceCategory. Unknown values are
 * dropped rather than rejected: a new option on the form should not 400 a
 * genuine enquiry, and the templates render whatever survives.
 */
const SERVICE_CATEGORIES = new Set<string>([
  'existing-show-purchase', 'custom-show-creation', 'music-arranging', 'music-licensing',
  'drill-design', 'choreography', 'visual-design', 'costume-consultation', 'wind-arranging',
  'program-coordination', 'drill', 'show-consultation', 'rehearsal-support', 'audio-production',
  'video-production', 'copyright', 'percussion', 'solos', 'visual-technique-guide',
  'collaboration', 'other',
])

export function toServiceCategories(values: string[] | undefined): ServiceCategory[] {
  return (values ?? []).filter((v): v is ServiceCategory => SERVICE_CATEGORIES.has(v))
}
