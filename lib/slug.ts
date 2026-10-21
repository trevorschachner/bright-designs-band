/**
 * Show slugs: lowercase words separated by single hyphens
 * (`lib/validation/shows.ts` enforces the same pattern on writes).
 *
 * `normaliseSlug` is the one definition of "the canonical form of a slug".
 * `createShow` (lib/actions/shows.ts) builds new slugs with `slugFromTitle`, and the
 * pre-check in drizzle/migrations/2026-10-07_shows_slug_unique.sql looks for
 * rows whose stored slug differs from this form.
 */

/** Trim, lowercase, collapse runs of hyphens, strip leading/trailing hyphens. */
export function normaliseSlug(value: string): string {
  return value.trim().toLowerCase().replace(/-+/g, '-').replace(/^-+|-+$/g, '');
}

/** A slug from a free-text title: drops punctuation, spaces become hyphens. */
export function slugFromTitle(title: string): string {
  return normaliseSlug(
    title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
  );
}

/** What every stored slug (show, part, resource) must match; the schemas check it on writes. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const SLUG_MESSAGE = 'Slug must be lowercase words separated by hyphens'

/** Most numbered variants tried before giving up. */
const MAX_SLUG_ATTEMPTS = 50

/**
 * `base`, else `base-<firstSuffix>`, `base-<firstSuffix + 1>`... until
 * `isTaken` says the candidate is free. Past MAX_SLUG_ATTEMPTS the last
 * candidate is returned unchecked: the insert then hits the unique index and
 * surfaces as `conflict`.
 */
export async function firstFreeSlug(
  base: string,
  isTaken: (slug: string) => Promise<boolean>,
  firstSuffix = 2
): Promise<string> {
  let candidate = base
  for (let n = firstSuffix; n < firstSuffix + MAX_SLUG_ATTEMPTS && (await isTaken(candidate)); n++) {
    candidate = `${base}-${n}`
  }
  return candidate
}

/**
 * A public slug for a new arrangement: the title's slug, then `-2`, `-3`...
 * until `exists` says the candidate is free.
 */
export async function uniqueArrangementSlug(title: string, exists: (slug: string) => Promise<boolean>): Promise<string> {
  const raw = slugFromTitle(title)
  // Empty or all-digit slugs would be read as numeric ids by the route.
  const base = raw === '' ? 'arrangement' : /^\d+$/.test(raw) ? `arrangement-${raw}` : raw
  return firstFreeSlug(base, exists)
}
