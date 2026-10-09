import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * The catalog layer: parsing a query string into bounded, allowlisted filters;
 * one cache entry per distinct filter (and only one); pagination math.
 */

type CacheCall = { key: string[]; opts: { tags: string[]; revalidate: number }; args: unknown[] }
const { cacheCalls, showsFindMany, arrangementsFindMany, total } = vi.hoisted(() => ({
  cacheCalls: [] as CacheCall[],
  showsFindMany: vi.fn(async (_opts: unknown) => [] as unknown[]),
  arrangementsFindMany: vi.fn(async (_opts: unknown) => [] as unknown[]),
  total: { value: 0 },
}))

vi.mock('next/cache', () => ({
  unstable_cache:
    (fn: (...a: unknown[]) => unknown, key: string[], opts: { tags: string[]; revalidate: number }) =>
    (...args: unknown[]) => {
      cacheCalls.push({ key, opts, args })
      return fn(...args)
    },
}))

vi.mock('@/lib/database', () => {
  const countResult = () => Promise.resolve([{ count: total.value }])
  return {
    isDatabaseConfigured: () => true,
    db: {
      select: () => ({
        from: () => Object.assign(countResult(), { where: countResult }),
      }),
      query: {
        shows: { findMany: showsFindMany },
        arrangements: { findMany: arrangementsFindMany },
      },
    },
  }
})

import {
  catalogCacheKey,
  parseArrangementsQuery,
  parseShowsQuery,
  queryArrangements,
  queryShows,
} from '@/lib/services/catalog'
import { MAX_LIMIT, MAX_SEARCH_LENGTH, serializeCatalogQuery, totalPagesFor } from '@/lib/filters/catalog-params'

const q = (params: Record<string, string>) => new URLSearchParams(params)

beforeEach(() => {
  cacheCalls.length = 0
  showsFindMany.mockClear()
  arrangementsFindMany.mockClear()
  total.value = 0
})

describe('parseShowsQuery', () => {
  it('defaults to page 1 of 24 with no filters', () => {
    expect(parseShowsQuery(q({}))).toEqual({ conditions: [], sort: [], page: 1, limit: 24 })
  })

  it('ignores unknown fields, unknown operators and unknown sort fields', () => {
    const filters = parseShowsQuery(
      q({
        filters: JSON.stringify([
          { field: 'difficulty', operator: 'in', values: ['Beginner'] },
          { field: 'copyrightAmountUsd', operator: 'equals', value: 1 },
          { field: 'title', operator: 'dropTable', value: 'x' },
          { field: 'arrangements', operator: 'in', values: [1] },
        ]),
        sort: JSON.stringify([
          { field: 'year', direction: 'desc' },
          { field: 'secret', direction: 'asc' },
          { field: 'tags', direction: 'asc' },
          { field: 'title', direction: 'sideways' },
        ]),
        unrelated: 'x',
      })
    )
    expect(filters.conditions).toEqual([{ field: 'difficulty', operator: 'in', values: ['Beginner'] }])
    expect(filters.sort).toEqual([{ field: 'year', direction: 'desc' }])
    expect(filters).not.toHaveProperty('unrelated')
  })

  // Pricing is never published, so price is not part of the public contract:
  // no filter or sort on it survives parsing, and no public read selects it.
  it('drops a price filter and a price sort', () => {
    const filters = parseShowsQuery(
      q({
        filters: JSON.stringify([
          { field: 'price', operator: 'between', values: [0, 1000] },
          { field: 'price', operator: 'gte', value: 500 },
        ]),
        sort: JSON.stringify([{ field: 'price', direction: 'desc' }]),
      })
    )
    expect(filters.conditions).toEqual([])
    expect(filters.sort).toEqual([])
  })

  it('queryShows drops price even from unparsed input and never selects it', async () => {
    await queryShows({
      page: 1,
      limit: 24,
      conditions: [{ field: 'price', operator: 'gte', value: 1 }],
      sort: [{ field: 'price', direction: 'asc' }],
    })
    expect(cacheCalls[0].args).toEqual([{ conditions: [], sort: [], page: 1, limit: 24 }])
    const opts = showsFindMany.mock.calls[0][0] as { columns: Record<string, boolean> }
    expect(opts.columns.price).not.toBe(true)
  })

  it('treats malformed JSON as no filter', () => {
    const filters = parseShowsQuery(q({ filters: '{not json', sort: '"year"' }))
    expect(filters.conditions).toEqual([])
    expect(filters.sort).toEqual([])
  })

  it('caps limit at 48 and floors bad page and limit values', () => {
    expect(parseShowsQuery(q({ limit: '1000' })).limit).toBe(MAX_LIMIT)
    expect(parseShowsQuery(q({ limit: '-3' })).limit).toBe(24)
    expect(parseShowsQuery(q({ limit: 'abc', page: 'abc' }))).toMatchObject({ limit: 24, page: 1 })
    expect(parseShowsQuery(q({ page: '0' })).page).toBe(1)
    expect(parseShowsQuery(q({ page: '3' })).page).toBe(3)
  })

  it('trims, collapses and caps the search text; blank means no search', () => {
    expect(parseShowsQuery(q({ search: '   gold    rush  ' })).search).toBe('gold rush')
    expect(parseShowsQuery(q({ search: 'x'.repeat(500) })).search).toHaveLength(MAX_SEARCH_LENGTH)
    expect(parseShowsQuery(q({ search: '   ' }))).not.toHaveProperty('search')
  })

  it('reads a Next searchParams record (first value of a repeated key)', () => {
    expect(parseShowsQuery({ page: ['2', '9'], search: 'apex', featured: 'true' })).toMatchObject({
      page: 2,
      search: 'apex',
      featured: true,
    })
  })

  it('accepts featured for shows only', () => {
    expect(parseArrangementsQuery(q({ featured: 'true' }))).not.toHaveProperty('featured')
  })

  it('round-trips through serializeCatalogQuery, omitting defaults', () => {
    const filters = parseShowsQuery(q({ search: 'apex', page: '2', limit: '24' }))
    expect(serializeCatalogQuery(filters)).toBe('search=apex&page=2')
    expect(serializeCatalogQuery(parseShowsQuery(q({})))).toBe('')
  })
})

describe('cache keys', () => {
  it('is one key per distinct filter, independent of property order', () => {
    const a = catalogCacheKey('shows', { page: 2, limit: 24, conditions: [], sort: [], search: 'apex' })
    const b = catalogCacheKey('shows', { search: 'apex', sort: [], conditions: [], limit: 24, page: 2 })
    const c = catalogCacheKey('shows', { search: 'apex', sort: [], conditions: [], limit: 24, page: 3 })
    expect(a).toBe(b)
    expect(a).not.toBe(c)
    expect(catalogCacheKey('arrangements', { page: 2, limit: 24, conditions: [], sort: [], search: 'apex' })).not.toBe(a)
  })

  it('re-applies the bounds, so an unparsed caller cannot mint extra keys', () => {
    const capped = catalogCacheKey('shows', { page: 1, limit: 48, conditions: [], sort: [] })
    expect(catalogCacheKey('shows', { page: 1, limit: 5000, conditions: [], sort: [] })).toBe(capped)
    expect(catalogCacheKey('shows', { page: 1, limit: 24, conditions: [], sort: [], search: '  a  ' })).toBe(
      catalogCacheKey('shows', { page: 1, limit: 24, conditions: [], sort: [], search: 'a' })
    )
  })

  it('queryShows makes one cached read, keyed shows-page-v3 plus the canonical params, under the list tags', async () => {
    await queryShows(parseShowsQuery(q({ page: '2', limit: '12' })))
    expect(cacheCalls).toHaveLength(1)
    const [call] = cacheCalls
    expect(call.key).toEqual(['shows-page-v3'])
    expect(call.args).toEqual([{ conditions: [], sort: [], page: 2, limit: 12 }])
    expect(call.opts.tags).toEqual(expect.arrayContaining(['shows', 'arrangements', 'tags']))
    expect(call.opts.revalidate).toBe(3600)
  })

  it('a searched read ages in 5 minutes instead of an hour', async () => {
    await queryShows(parseShowsQuery(q({ search: 'apex' })))
    await queryArrangements(parseArrangementsQuery(q({ search: 'apex' })))
    expect(cacheCalls.map((c) => c.opts.revalidate)).toEqual([300, 300])
  })

  it('queryArrangements uses its own key and the trimmed projection', async () => {
    await queryArrangements(parseArrangementsQuery(q({})))
    expect(cacheCalls[0].key).toEqual(['arrangements-page-v4'])
    const opts = arrangementsFindMany.mock.calls[0][0] as { columns: Record<string, boolean>; with: Record<string, unknown> }
    expect(Object.keys(opts.columns).sort()).toEqual(['composer', 'durationSeconds', 'id', 'sampleScoreUrl', 'slug', 'title'])
    expect(opts.with).not.toHaveProperty('arrangementsToTags')
  })
})

describe('pagination', () => {
  it('computes total pages', () => {
    expect(totalPagesFor(0, 24)).toBe(0)
    expect(totalPagesFor(24, 24)).toBe(1)
    expect(totalPagesFor(25, 24)).toBe(2)
  })

  it('returns rows, total, page, pageSize and totalPages, offsetting by (page - 1) * pageSize', async () => {
    total.value = 50
    const page = await queryShows(parseShowsQuery(q({ page: '3', limit: '12' })))
    expect(page).toEqual({ rows: [], total: 50, page: 3, pageSize: 12, totalPages: 5 })
    const opts = showsFindMany.mock.calls[0][0] as { limit: number; offset: number }
    expect(opts).toMatchObject({ limit: 12, offset: 24 })
  })

  it('serves the last page for a page past the end, never an empty page with results', async () => {
    total.value = 30
    const page = await queryShows(parseShowsQuery(q({ page: '99', limit: '12' })))
    expect(page).toMatchObject({ total: 30, page: 3, pageSize: 12, totalPages: 3 })
    const offsets = showsFindMany.mock.calls.map((c) => (c[0] as { offset: number }).offset)
    expect(offsets).toEqual([99 * 12 - 12, 24])
  })

  it('leaves page 1 of an empty result alone', async () => {
    total.value = 0
    const page = await queryArrangements(parseArrangementsQuery(q({ page: '5' })))
    expect(page).toMatchObject({ total: 0, page: 5, totalPages: 0 })
    expect(arrangementsFindMany).toHaveBeenCalledTimes(1)
  })
})
