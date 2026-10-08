/**
 * The admin tables' title search: `?q=` on the `?admin=true` / `?all=true`
 * list endpoints and on the server-rendered admin lists. Only staff branches
 * read it; the public parsers (catalog-params.ts) never see `q`.
 */

/** Same cap as the public catalog's free-text search. */
export const ADMIN_SEARCH_MAX_CHARS = 80;

/** The trimmed, capped `q` param, or undefined when absent or blank. */
export function readAdminSearch(searchParams: URLSearchParams): string | undefined {
  const q = searchParams.get('q')?.trim().slice(0, ADMIN_SEARCH_MAX_CHARS).trim();
  return q || undefined;
}

/** `%term%` with `%`, `_` and `\` escaped, so the term matches literally in `ilike`. */
export function likePattern(term: string): string {
  return `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}
