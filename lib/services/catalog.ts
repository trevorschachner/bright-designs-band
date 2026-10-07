/**
 * The public catalog: one page of shows or arrangements for `/shows`,
 * `/arrangements` and their `/api/...` list routes.
 *
 * A thin layer over the paged reads in ./shows.ts and ./arrangements.ts, which
 * already run `buildTableQuery` with explicit columns and are cached under the
 * list tags. This file adds what both callers need on top: parsing a query
 * string into bounded, allowlisted filters (lib/filters/catalog-params.ts), a
 * canonical argument object so one filter means one cache entry, and the
 * `{ rows, total, page, pageSize }` shape. There is no second cache here.
 */

import { cache } from 'react';
import {
  ARRANGEMENTS_FILTER_FIELDS,
  SHOWS_ADMIN_FILTER_FIELDS,
  SHOWS_FILTER_FIELDS,
} from '@/lib/filters/filter-definitions';
import {
  CATALOG_DEFAULT_LIMIT,
  clampLimit,
  clampPage,
  normalizeSearch,
  parseCatalogQuery,
  totalPagesFor,
  type CatalogFilters,
  type QueryInput,
} from '@/lib/filters/catalog-params';
import { getShowsPage, type ShowListItem, type ShowsPageParams } from './shows';
import { getArrangementsPage, type ArrangementListItem } from './arrangements';

export type { CatalogFilters } from '@/lib/filters/catalog-params';

export const SHOWS_DEFAULT_LIMIT = CATALOG_DEFAULT_LIMIT;
export const ARRANGEMENTS_DEFAULT_LIMIT = CATALOG_DEFAULT_LIMIT;

export interface CatalogPage<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function parseShowsQuery(input: QueryInput): CatalogFilters {
  return parseCatalogQuery(input, {
    fields: SHOWS_FILTER_FIELDS,
    defaultLimit: SHOWS_DEFAULT_LIMIT,
    allowFeatured: true,
  });
}

export function parseArrangementsQuery(input: QueryInput): CatalogFilters {
  return parseCatalogQuery(input, { fields: ARRANGEMENTS_FILTER_FIELDS, defaultLimit: ARRANGEMENTS_DEFAULT_LIMIT });
}

/**
 * The argument the cached read is keyed on, with a fixed key order and the
 * bounds re-applied, so a caller that skipped parsing still cannot mint
 * unbounded cache entries, and `{ page, limit }` vs `{ limit, page }` is one
 * entry, not two.
 */
const PUBLIC_SHOW_KEYS = new Set(SHOWS_FILTER_FIELDS.map((f) => f.key));
/** Admin-only show fields (`price`): dropped even from unparsed public input. */
const ADMIN_ONLY_SHOW_KEYS = new Set(
  SHOWS_ADMIN_FILTER_FIELDS.map((f) => f.key).filter((k) => !PUBLIC_SHOW_KEYS.has(k))
);
const isPublicShowField = (field: string) => !ADMIN_ONLY_SHOW_KEYS.has(field);

export function canonicalShowsParams(filters: CatalogFilters): ShowsPageParams {
  const params: ShowsPageParams = {
    search: normalizeSearch(filters.search),
    conditions: (filters.conditions ?? [])
      .filter((c) => isPublicShowField(c.field))
      .map(({ field, operator, value, values }) => ({ field, operator, value, values })),
    sort: (filters.sort ?? [])
      .filter((s) => isPublicShowField(s.field))
      .map(({ field, direction }) => ({ field, direction })),
    page: clampPage(filters.page),
    limit: clampLimit(filters.limit, SHOWS_DEFAULT_LIMIT),
    featured: filters.featured ? true : undefined,
  };
  return params;
}

export function canonicalArrangementsParams(filters: CatalogFilters): Required<Omit<CatalogFilters, 'featured' | 'search'>> & {
  search: string | undefined;
} {
  return {
    search: normalizeSearch(filters.search),
    conditions: (filters.conditions ?? []).map(({ field, operator, value, values }) => ({ field, operator, value, values })),
    sort: (filters.sort ?? []).map(({ field, direction }) => ({ field, direction })),
    page: clampPage(filters.page),
    limit: clampLimit(filters.limit, ARRANGEMENTS_DEFAULT_LIMIT),
  };
}

/** The serialised form a cache entry is keyed on (unstable_cache appends JSON args). */
export function catalogCacheKey(entity: 'shows' | 'arrangements', filters: CatalogFilters): string {
  const params = entity === 'shows' ? canonicalShowsParams(filters) : canonicalArrangementsParams(filters);
  return `${entity}:${JSON.stringify(params)}`;
}

function toPage<T>(rows: T[], total: number, page: number, pageSize: number): CatalogPage<T> {
  return { rows, total, page, pageSize, totalPages: totalPagesFor(total, pageSize) };
}

// React `cache` dedupes within one server render: the page's list and its
// result count both ask for the same page and get one call. It is keyed on the
// serialised params because `cache` compares arguments by identity.
const showsPageOnce = cache(async (key: string) => {
  const params = JSON.parse(key) as ShowsPageParams;
  const first = await getShowsPage(params);
  const last = totalPagesFor(first.total, params.limit);
  // A page past the end (a stale `?page=99`) shows the last page, never an
  // empty "No shows found" while there are results.
  if (last > 0 && params.page > last) {
    const { data, total } = await getShowsPage({ ...params, page: last });
    return toPage(data, total, last, params.limit);
  }
  return toPage(first.data, first.total, params.page, params.limit);
});

const arrangementsPageOnce = cache(async (key: string) => {
  const params = JSON.parse(key) as ReturnType<typeof canonicalArrangementsParams>;
  const first = await getArrangementsPage(params);
  const last = totalPagesFor(first.total, params.limit);
  if (last > 0 && params.page > last) {
    const { data, total } = await getArrangementsPage({ ...params, page: last });
    return toPage(data, total, last, params.limit);
  }
  return toPage(first.data, first.total, params.page, params.limit);
});

/** One page of shows. Throws UnknownFilterFieldError only for unparsed input naming a missing column. */
export function queryShows(filters: CatalogFilters): Promise<CatalogPage<ShowListItem>> {
  return showsPageOnce(JSON.stringify(canonicalShowsParams(filters)));
}

/** One page of arrangements. */
export function queryArrangements(filters: CatalogFilters): Promise<CatalogPage<ArrangementListItem>> {
  return arrangementsPageOnce(JSON.stringify(canonicalArrangementsParams(filters)));
}
