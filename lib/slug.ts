/**
 * Show slugs: lowercase words separated by single hyphens
 * (`lib/validation/shows.ts` enforces the same pattern on writes).
 *
 * `normaliseSlug` is the one definition of "the canonical form of a slug".
 * The POST /api/shows route builds new slugs with `slugFromTitle`, and the
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
