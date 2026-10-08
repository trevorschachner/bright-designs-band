import { describe, it, expect } from 'vitest'
import { buildListUrl, nextSort } from '@/components/features/admin/admin-table-urls'

const sortParam = (url: string) => JSON.parse(new URL(url, 'http://x').searchParams.get('sort') ?? 'null')

describe('buildListUrl', () => {
  it('adds listQuery and paging', () => {
    expect(buildListUrl('/api/resources', 'all=true', 2, 10)).toBe('/api/resources?all=true&page=2&limit=10')
  })
  it('works without listQuery', () => {
    expect(buildListUrl('/api/shows', undefined, 1, 25)).toBe('/api/shows?page=1&limit=25')
  })
  it('adds no sort param when unsorted', () => {
    expect(buildListUrl('/api/shows', undefined, 1, 25, null)).toBe('/api/shows?page=1&limit=25')
  })
  it('sorts by the column, then id so paging is stable across ties', () => {
    const url = buildListUrl('/api/shows', undefined, 2, 20, { field: 'year', direction: 'desc' })
    expect(url.startsWith('/api/shows?page=2&limit=20&sort=')).toBe(true)
    expect(sortParam(url)).toEqual([
      { field: 'year', direction: 'desc' },
      { field: 'id', direction: 'asc' },
    ])
  })
  it('does not repeat id when sorting by id', () => {
    const url = buildListUrl('/api/shows', undefined, 1, 20, { field: 'id', direction: 'asc' })
    expect(sortParam(url)).toEqual([{ field: 'id', direction: 'asc' }])
  })
})

describe('nextSort', () => {
  it('cycles a column ascending, descending, then off', () => {
    const asc = nextSort(null, 'title')
    expect(asc).toEqual({ field: 'title', direction: 'asc' })
    const desc = nextSort(asc, 'title')
    expect(desc).toEqual({ field: 'title', direction: 'desc' })
    expect(nextSort(desc, 'title')).toBeNull()
  })
  it('starts a different column ascending', () => {
    expect(nextSort({ field: 'title', direction: 'desc' }, 'year')).toEqual({ field: 'year', direction: 'asc' })
  })
})
