import { describe, it, expect } from 'vitest'
import { buildDeleteUrl, buildListUrl } from '@/components/features/admin/admin-table-urls'

describe('buildDeleteUrl', () => {
  it('appends the id to a clean path', () => {
    expect(buildDeleteUrl('/api/shows', 5)).toBe('/api/shows/5')
  })
  it('drops any query string from the endpoint', () => {
    expect(buildDeleteUrl('/api/resources?all=true', 12)).toBe('/api/resources/12')
  })
})

describe('buildListUrl', () => {
  it('adds listQuery and paging', () => {
    expect(buildListUrl('/api/resources', 'all=true', 2, 10)).toBe('/api/resources?all=true&page=2&limit=10')
  })
  it('works without listQuery', () => {
    expect(buildListUrl('/api/shows', undefined, 1, 25)).toBe('/api/shows?page=1&limit=25')
  })
})
