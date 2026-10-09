import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/services/shows', () => ({ getCollectionCounts: vi.fn() }))

import { collections, collectionsForShow, getCollectionBySlug, matchesFilter, MIN_COLLECTION_SHOWS, publishedCollections } from '@/lib/collections'
import { getCollectionCounts } from '@/lib/services/shows'

describe('collections config', () => {
  it('has the 14 launch collections with unique slugs and groups', () => {
    expect(collections).toHaveLength(14)
    expect(new Set(collections.map((c) => c.slug)).size).toBe(14)
    for (const c of collections) {
      expect(c.description.length).toBeGreaterThanOrEqual(100)
      expect(c.description.length).toBeLessThanOrEqual(160)
      expect(c.description).toMatch(/[.!?]$/)
      expect(c.description).not.toMatch(/\b(nineteen|eighteen|seven|six|four|three) shows\b/i)
      expect(['level', 'size', 'theme', 'season']).toContain(c.group)
      for (const r of c.relatedCollections) expect(getCollectionBySlug(r)).toBeDefined()
    }
    expect(MIN_COLLECTION_SHOWS).toBe(2)
  })
  it('maps a show to every collection whose filter it satisfies', () => {
    const slugs = collectionsForShow({ difficulty: 'Beginner', year: 2025, tagNames: ['Theme: Space', 'Small Band'] }).map((c) => c.slug)
    expect(slugs).toEqual(expect.arrayContaining(['easy-marching-band-shows', 'small-band-marching-band-shows', 'space-marching-band-shows', 'new-marching-band-shows-2027']))
    expect(slugs).not.toContain('grade-3-marching-band-shows')
  })
  it('publishes only collections with at least MIN_COLLECTION_SHOWS shows', async () => {
    vi.mocked(getCollectionCounts).mockResolvedValue({ 'easy-marching-band-shows': 2, 'space-marching-band-shows': 1 })
    expect((await publishedCollections()).map((c) => c.slug)).toEqual(['easy-marching-band-shows'])
  })
  it('matchesFilter handles year and all-of tags', () => {
    const base = { difficulty: null, tagNames: [] as string[] }
    expect(matchesFilter({ ...base, year: null }, { yearMin: 2025 })).toBe(false)
    expect(matchesFilter({ ...base, year: 2024 }, { yearMin: 2025 })).toBe(false)
    expect(matchesFilter({ ...base, year: 2025 }, { yearMin: 2025 })).toBe(true)
    const f = { tags: ['Theme: Space', 'Small Band'] }
    expect(matchesFilter({ ...base, year: 1, tagNames: ['Theme: Space'] }, f)).toBe(false)
    expect(matchesFilter({ ...base, year: 1, tagNames: ['Theme: Space', 'Small Band'] }, f)).toBe(true)
  })
})
