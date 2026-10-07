/**
 * Bright Designs' official social profiles, published as the Organization
 * schema's `sameAs` (lib/seo/structured-data.ts).
 *
 * Trevor fills these; empty strings are omitted from sameAs.
 */
export const SOCIAL_PROFILES = {
  youtube: '',
  instagram: '',
  facebook: '',
  linkedin: '',
} as const satisfies Record<string, string>

/** The non-empty profile URLs, in a stable order. */
export function socialProfileUrls(profiles: Record<string, string> = SOCIAL_PROFILES): string[] {
  return Object.values(profiles).map((url) => url.trim()).filter(Boolean)
}
