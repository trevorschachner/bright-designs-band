import { describe, it, expect } from 'vitest'
import { toListResponse } from '@/lib/services/catalog'

describe('toListResponse', () => {
  it('reports the page served, not the one asked for, when a page past the end was clamped', () => {
    const body = toListResponse(
      { rows: ['a'], total: 25, page: 2, pageSize: 24, totalPages: 2 },
      { page: 99, limit: 24, conditions: [], sort: [] }
    )
    expect(body.pagination).toEqual({ page: 2, limit: 24, total: 25, totalPages: 2, hasNext: false, hasPrev: true })
    expect(body.appliedFilters.page).toBe(2)
    expect(body.data).toEqual(['a'])
  })
})
