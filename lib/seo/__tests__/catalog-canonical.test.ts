import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://brightdesigns.band')
})

const base = { conditions: [], sort: [], page: 1, limit: 24 }

describe('catalogCanonical', () => {
  it('is the bare path for the first page', async () => {
    const { catalogCanonical } = await import('@/lib/seo/metadata')
    expect(catalogCanonical('/shows', base, 24)).toBe('https://brightdesigns.band/shows')
  })

  it('is self-referencing for a later page of the unfiltered catalog', async () => {
    // Pointing page 2 at page 1 tells Google page 2 is a duplicate, so the
    // shows only linked from page 2 are not discovered through it.
    const { catalogCanonical } = await import('@/lib/seo/metadata')
    expect(catalogCanonical('/shows', { ...base, page: 2 }, 24)).toBe('https://brightdesigns.band/shows?page=2')
    expect(catalogCanonical('/arrangements', { ...base, page: 3 }, 24)).toBe('https://brightdesigns.band/arrangements?page=3')
  })

  it('falls back to the bare path for filtered, searched, sorted or resized views', async () => {
    const { catalogCanonical } = await import('@/lib/seo/metadata')
    const bare = 'https://brightdesigns.band/shows'
    expect(catalogCanonical('/shows', { ...base, page: 2, search: 'space' }, 24)).toBe(bare)
    expect(catalogCanonical('/shows', { ...base, page: 2, conditions: [{ field: 'difficulty', operator: 'equals', value: 'Advanced' }] }, 24)).toBe(bare)
    expect(catalogCanonical('/shows', { ...base, page: 2, sort: [{ field: 'title', direction: 'asc' }] }, 24)).toBe(bare)
    expect(catalogCanonical('/shows', { ...base, page: 2, limit: 12 }, 24)).toBe(bare)
    expect(catalogCanonical('/shows', { ...base, page: 2, featured: true }, 24)).toBe(bare)
  })
})

describe('catalog pages', () => {
  it('give ?page=2 its own canonical', async () => {
    const shows = await import('../../../app/shows/page')
    const arrangements = await import('../../../app/arrangements/page')
    expect((await shows.generateMetadata({ searchParams: Promise.resolve({ page: '2' }) })).alternates?.canonical)
      .toBe('https://brightdesigns.band/shows?page=2')
    expect((await arrangements.generateMetadata({ searchParams: Promise.resolve({ page: '2' }) })).alternates?.canonical)
      .toBe('https://brightdesigns.band/arrangements?page=2')
    expect((await shows.generateMetadata({ searchParams: Promise.resolve({}) })).alternates?.canonical)
      .toBe('https://brightdesigns.band/shows')
  })
})

describe('root layout', () => {
  it('does not hardcode robots tags that would contradict a page-level noindex', () => {
    const source = readFileSync(join(process.cwd(), 'app/layout.tsx'), 'utf8')
    expect(source).not.toMatch(/<meta name="(robots|googlebot)"/)
  })
})
