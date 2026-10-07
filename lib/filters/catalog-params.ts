import type { FilterCondition, FilterField, FilterOperator, FilterState, SortCondition } from './types'

/**
 * The catalog's URL contract: how `/shows?…` and `/arrangements?…` (and the
 * matching `/api/...` list routes) turn a query string into a filter, and back.
 *
 * Pure and client-safe on purpose (no Drizzle import): the server page parses
 * with it, the filter islands serialise with it, so the two cannot disagree on
 * what a URL means.
 *
 * Query string:
 *   search   free text, trimmed, whitespace collapsed, at most 80 characters
 *   filters  JSON array of { field, operator, value?, values? }
 *   sort     JSON array of { field, direction }
 *   page     1-based page number
 *   limit    page size, 1..48
 *   featured "true" | "1" (shows only)
 *
 * Anything else is ignored. A condition or sort naming a field that is not in
 * the entity's filter definitions (lib/filters/filter-definitions.ts), or an
 * operator that field does not offer, is dropped rather than rejected: a stale
 * or hand-edited link renders the unfiltered catalog instead of an error page.
 * The bounds keep the number of distinct cache entries (one per serialised
 * filter) finite.
 */

export const MAX_LIMIT = 48
export const MAX_SEARCH_LENGTH = 80
const MAX_PAGE = 10_000
const MAX_CONDITIONS = 10
const MAX_VALUES = 20
const MAX_VALUE_LENGTH = 80

/** Page sizes the catalog offers. All within MAX_LIMIT. */
export const CATALOG_LIMIT_OPTIONS = [12, 24, 48] as const
export const CATALOG_DEFAULT_LIMIT = 24

export interface CatalogFilters {
  search?: string
  conditions: FilterCondition[]
  sort: SortCondition[]
  page: number
  limit: number
  featured?: boolean
}

/** URLSearchParams, or what a Next page receives as `await searchParams`. */
export type QueryInput =
  | URLSearchParams
  | { get(name: string): string | null }
  | Record<string, string | string[] | undefined>

export interface ParseOptions {
  /** The filter definitions: the allowlist of fields and their operators. */
  fields: FilterField[]
  defaultLimit?: number
  /** Whether `featured` is meaningful for this entity. */
  allowFeatured?: boolean
}

function reader(input: QueryInput): (name: string) => string | undefined {
  if (typeof (input as URLSearchParams).get === 'function') {
    return (name) => (input as { get(n: string): string | null }).get(name) ?? undefined
  }
  const record = input as Record<string, string | string[] | undefined>
  return (name) => {
    const v = record[name]
    return Array.isArray(v) ? v[0] : v
  }
}

/** Trim, collapse whitespace, cap at MAX_SEARCH_LENGTH. Empty becomes undefined. */
export function normalizeSearch(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const s = value.replace(/\s+/g, ' ').trim().slice(0, MAX_SEARCH_LENGTH).trim()
  return s || undefined
}

export function clampLimit(value: unknown, fallback: number = CATALOG_DEFAULT_LIMIT): number {
  const n = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(n) || n < 1) return Math.min(fallback, MAX_LIMIT)
  return Math.min(Math.floor(n), MAX_LIMIT)
}

export function clampPage(value: unknown): number {
  const n = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.min(Math.floor(n), MAX_PAGE)
}

function parseJsonArray(raw: string | undefined): unknown[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

type Scalar = string | number | boolean | null

function isScalar(v: unknown): v is Scalar {
  return v === null || ['string', 'number', 'boolean'].includes(typeof v)
}

function cleanScalar(v: Scalar): Scalar {
  return typeof v === 'string' ? v.slice(0, MAX_VALUE_LENGTH) : v
}

/** Keeps a condition only if its field and operator are allowlisted; canonical key order. */
function cleanCondition(raw: unknown, fields: FilterField[]): FilterCondition | null {
  if (!raw || typeof raw !== 'object') return null
  const { field, operator, value, values } = raw as Record<string, unknown>
  const def = fields.find((f) => f.key === field)
  if (!def || typeof operator !== 'string' || !def.operators.includes(operator as FilterOperator)) return null

  // `value` stays undefined when `values` carries the operands; JSON drops it,
  // so the serialised form (and the cache key) has one spelling per filter.
  const condition: FilterCondition = { field: def.key, operator: operator as FilterOperator, value: undefined }
  if (Array.isArray(values)) {
    const kept = values.filter(isScalar).slice(0, MAX_VALUES).map(cleanScalar)
    if (kept.length === 0) return null
    condition.values = kept
  } else if (isScalar(value)) {
    condition.value = cleanScalar(value)
  } else if (operator !== 'isNull' && operator !== 'isNotNull') {
    return null
  }
  return condition
}

/** Fields a list may be ordered by: allowlisted columns, never relations. */
function sortable(fields: FilterField[]): Set<string> {
  return new Set(fields.filter((f) => f.type !== 'relation' && f.type !== 'array').map((f) => f.key))
}

function cleanSort(raw: unknown, allowed: Set<string>): SortCondition | null {
  if (!raw || typeof raw !== 'object') return null
  const { field, direction } = raw as Record<string, unknown>
  if (typeof field !== 'string' || !allowed.has(field)) return null
  if (direction !== 'asc' && direction !== 'desc') return null
  return { field, direction }
}

/** A query string (or Next `searchParams`) to bounded, allowlisted catalog filters. */
export function parseCatalogQuery(input: QueryInput, options: ParseOptions): CatalogFilters {
  const get = reader(input)
  const { fields, defaultLimit = CATALOG_DEFAULT_LIMIT, allowFeatured = false } = options
  const allowedSort = sortable(fields)

  const conditions = parseJsonArray(get('filters'))
    .map((c) => cleanCondition(c, fields))
    .filter((c): c is FilterCondition => c !== null)
    .slice(0, MAX_CONDITIONS)
  const sort = parseJsonArray(get('sort'))
    .map((s) => cleanSort(s, allowedSort))
    .filter((s): s is SortCondition => s !== null)
    .slice(0, 2)

  const filters: CatalogFilters = {
    search: normalizeSearch(get('search')),
    conditions,
    sort,
    page: clampPage(get('page')),
    limit: clampLimit(get('limit'), defaultLimit),
  }
  if (!filters.search) delete filters.search
  if (allowFeatured) {
    const featured = get('featured')
    if (featured && ['true', '1'].includes(featured.toLowerCase())) filters.featured = true
  }
  return filters
}

/**
 * Catalog filters to a query string (no leading `?`). Defaults are omitted, so
 * the unfiltered first page is the bare path.
 */
export function serializeCatalogQuery(
  state: Partial<FilterState> & { featured?: boolean },
  defaultLimit: number = CATALOG_DEFAULT_LIMIT
): string {
  const params = new URLSearchParams()
  const search = normalizeSearch(state.search)
  if (search) params.set('search', search)
  if (state.conditions && state.conditions.length > 0) params.set('filters', JSON.stringify(state.conditions))
  if (state.sort && state.sort.length > 0) params.set('sort', JSON.stringify(state.sort))
  if (state.featured) params.set('featured', 'true')
  if (state.page && state.page > 1) params.set('page', String(state.page))
  if (state.limit && state.limit !== defaultLimit) params.set('limit', String(state.limit))
  return params.toString()
}

/** `basePath` plus the serialised query, or the bare path when there is none. */
export function catalogHref(
  basePath: string,
  state: Partial<FilterState> & { featured?: boolean },
  defaultLimit: number = CATALOG_DEFAULT_LIMIT
): string {
  const qs = serializeCatalogQuery(state, defaultLimit)
  return qs ? `${basePath}?${qs}` : basePath
}

/** Total pages for a total and page size (at least 1 when there are rows). */
export function totalPagesFor(total: number, pageSize: number): number {
  if (total <= 0 || pageSize <= 0) return 0
  return Math.ceil(total / pageSize)
}
