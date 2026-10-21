/**
 * The admin tables' title search: `?q=` on the `?admin=true` / `?all=true`
 * list endpoints and on the server-rendered admin lists. Only staff branches
 * read it; the public parsers (catalog-params.ts) never see `q`. Also the
 * admin table's paging (`?page=&limit=`), which allows larger pages than the
 * public catalog.
 */

import { clampPage } from './catalog-params';

/** Same cap as the public catalog's free-text search. */
export const ADMIN_SEARCH_MAX_CHARS = 80;

/** The trimmed, capped `q` param, or undefined when absent or blank. */
export function readAdminSearch(searchParams: URLSearchParams): string | undefined {
  const q = searchParams.get('q')?.trim().slice(0, ADMIN_SEARCH_MAX_CHARS).trim();
  return q || undefined;
}

/** The admin table's default and largest page sizes (AdminTablePagination offers 10–100). */
export const ADMIN_DEFAULT_LIMIT = 20;
export const ADMIN_MAX_LIMIT = 100;

/** `page` and `limit` for an admin list: page at least 1, limit 1–100, defaults 1 and 20. */
export function readAdminPage(searchParams: URLSearchParams): { page: number; limit: number } {
  const n = parseInt(searchParams.get('limit') ?? '', 10);
  const limit = Number.isFinite(n) && n >= 1 ? Math.min(n, ADMIN_MAX_LIMIT) : ADMIN_DEFAULT_LIMIT;
  return { page: clampPage(searchParams.get('page')), limit };
}

/** `term` with `%`, `_` and `\` escaped, so it matches literally inside a LIKE pattern. */
export function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** `%term%` with the term escaped, so it matches literally in `ilike`. */
export function likePattern(term: string): string {
  return `%${escapeLike(term)}%`;
}
