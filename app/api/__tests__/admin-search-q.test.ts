import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * `?q=` (the admin tables' title search) reaches only the staff reads. The
 * public branches never see it, and an anonymous `?admin=true&q=` gets the
 * public data with no admin read.
 */

const m = vi.hoisted(() => ({
  guard: vi.fn(),
  showsAdmin: vi.fn(async () => ({ data: [], total: 0 })),
  queryShows: vi.fn(async () => ({ rows: [], total: 0, page: 1, pageSize: 24, totalPages: 0 })),
  parseShowsQuery: vi.fn(() => ({ page: 1, limit: 24, conditions: [], sort: [] })),
  resourcesAdmin: vi.fn(async () => ({ rows: [], total: 0, page: 1, pageSize: 20, totalPages: 0 })),
  resourcesPublic: vi.fn(async () => []),
}))
vi.mock('@/lib/auth/guard', () => ({ guard: m.guard }))
vi.mock('@/lib/services/shows', () => ({ getShowsPageForAdmin: m.showsAdmin }))
vi.mock('@/lib/services/catalog', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/services/catalog')>()),
  parseShowsQuery: m.parseShowsQuery,
  queryShows: m.queryShows,
}))
vi.mock('@/lib/services/resources', () => ({ getResourcesPageForAdmin: m.resourcesAdmin, getActiveResources: m.resourcesPublic }))
vi.mock('@/lib/observability/report-error', () => ({ reportError: vi.fn() }))

import { GET as getShows } from '@/app/api/shows/route'
import { GET as getResources } from '@/app/api/resources/route'
import { likePattern, readAdminPage, readAdminSearch } from '@/lib/filters/admin-search'

const staff = { denied: null, email: 'a@b.c', role: 'editor' }
const anon = { denied: new Response(null, { status: 401 }) }

beforeEach(() => {
  for (const fn of Object.values(m)) fn.mockClear()
})

describe('readAdminSearch / likePattern', () => {
  it('trims, caps at 80 and drops a blank term', () => {
    expect(readAdminSearch(new URLSearchParams('q=%20%20apex%20'))).toBe('apex')
    expect(readAdminSearch(new URLSearchParams('q=%20%20'))).toBeUndefined()
    expect(readAdminSearch(new URLSearchParams(''))).toBeUndefined()
    expect(readAdminSearch(new URLSearchParams(`q=${'x'.repeat(200)}`))).toHaveLength(80)
  })
  it('escapes like wildcards so the term matches literally', () => {
    expect(likePattern('50%_off\\')).toBe('%50\\%\\_off\\\\%')
  })
})

describe('readAdminPage', () => {
  it('defaults to page 1 of 20', () => {
    expect(readAdminPage(new URLSearchParams(''))).toEqual({ page: 1, limit: 20 })
  })
  it('reads page and limit, capping limit at the table\'s largest page size', () => {
    expect(readAdminPage(new URLSearchParams('page=2&limit=50'))).toEqual({ page: 2, limit: 50 })
    expect(readAdminPage(new URLSearchParams('page=3&limit=5000'))).toEqual({ page: 3, limit: 100 })
  })
  it('falls back on junk', () => {
    expect(readAdminPage(new URLSearchParams('page=-1&limit=abc'))).toEqual({ page: 1, limit: 20 })
  })
})

describe('GET /api/shows', () => {
  it('passes q to the staff read', async () => {
    m.guard.mockResolvedValue(staff)
    await getShows(new Request('http://localhost/api/shows?admin=true&page=1&limit=20&q=%20north%20'))
    expect(m.showsAdmin).toHaveBeenCalledWith(expect.objectContaining({ q: 'north', page: 1, limit: 20 }))
    expect(m.queryShows).not.toHaveBeenCalled()
  })

  it('anonymous ?admin=true&q= gets the public read, which never receives q', async () => {
    m.guard.mockResolvedValue(anon)
    const res = await getShows(new Request('http://localhost/api/shows?admin=true&q=north'))
    expect(res.headers.get('cache-control')).toBe('private, no-store')
    expect(m.showsAdmin).not.toHaveBeenCalled()
    expect(JSON.stringify(m.queryShows.mock.calls)).not.toContain('north')
  })

  it('the public list ignores q', async () => {
    await getShows(new Request('http://localhost/api/shows?q=north'))
    expect(m.guard).not.toHaveBeenCalled()
    expect(m.showsAdmin).not.toHaveBeenCalled()
    expect(JSON.stringify(m.queryShows.mock.calls)).not.toContain('north')
  })
})

describe('GET /api/resources', () => {
  it('passes q to the staff read only', async () => {
    m.guard.mockResolvedValue(staff)
    await getResources(new Request('http://localhost/api/resources?all=true&q=guide') as never)
    expect(m.resourcesAdmin).toHaveBeenCalledWith(expect.objectContaining({ q: 'guide' }))

    m.guard.mockResolvedValue(anon)
    await getResources(new Request('http://localhost/api/resources?all=true&q=guide') as never)
    expect(m.resourcesPublic).toHaveBeenCalledWith()
    expect(m.resourcesAdmin).toHaveBeenCalledTimes(1)
  })

  it('pages the staff read and reports the page served and the total', async () => {
    m.guard.mockResolvedValue(staff)
    const rows = Array.from({ length: 20 }, (_, i) => ({ id: i + 21 }))
    m.resourcesAdmin.mockResolvedValueOnce({ rows, total: 45, page: 2, pageSize: 20, totalPages: 3 } as never)
    const res = await getResources(new Request('http://localhost/api/resources?all=true&page=2&limit=20') as never)
    expect(m.resourcesAdmin).toHaveBeenCalledWith({ q: undefined, page: 2, limit: 20 })
    const body = await res.json()
    expect(body.data.data.map((r: { id: number }) => r.id)).toEqual(rows.map((r) => r.id))
    expect(body.data.pagination).toEqual({ page: 2, limit: 20, total: 45, totalPages: 3, hasNext: true, hasPrev: true })
    expect(res.headers.get('cache-control')).toBe('private, no-store')
  })
})
