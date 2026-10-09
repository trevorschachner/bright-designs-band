import { describe, it, expect, beforeEach, vi } from 'vitest'

import { getRelatedShows } from '@/lib/services/shows'

const { unstableCache, findMany } = vi.hoisted(() => ({
  unstableCache: vi.fn(
    (fn: (...a: unknown[]) => unknown, _key: string[], _opts: { tags: string[]; revalidate: number }) => fn,
  ),
  findMany: vi.fn<(opts: unknown) => Promise<unknown[]>>(),
}))
vi.mock('next/cache', () => ({ unstable_cache: unstableCache }))
vi.mock('@/lib/database', () => ({
  isDatabaseConfigured: () => true,
  db: { query: { shows: { findMany } } },
}))

const row = (id: number, difficulty: string | null, tagNames: string[] = []) => ({
  id,
  title: `Show ${id}`,
  slug: `show-${id}`,
  description: null,
  year: 2025,
  difficulty,
  duration: null,
  thumbnailUrl: null,
  graphicUrl: null,
  featured: false,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  showsToTags: tagNames.map((name, i) => ({ tag: { id: i + 1, name } })),
  showArrangements: [],
  files: [],
})

beforeEach(() => findMany.mockReset())

describe('getRelatedShows', () => {
  it('puts same-theme shows first, then same difficulty, max 3', async () => {
    findMany.mockResolvedValue([
      row(2, 'Intermediate'),
      row(3, 'Advanced', ['Theme: Nature']),
      row(4, 'Intermediate'),
      row(5, 'Beginner'),
      row(6, 'Intermediate', ['Theme: Nature']),
    ])
    const result = await getRelatedShows(1, 'Intermediate', ['Theme: Nature', 'Small Band'])
    expect(result.map((s) => s.id)).toEqual([3, 6, 2])
  })

  it('returns nothing when neither theme nor difficulty match', async () => {
    findMany.mockResolvedValue([row(2, 'Beginner')])
    expect(await getRelatedShows(1, 'Advanced', [])).toEqual([])
  })

  it('is cached under related-shows-v1 with shows, arrangements and tags tags', async () => {
    findMany.mockResolvedValue([])
    await getRelatedShows(1, null, [])
    const call = unstableCache.mock.calls.find((c) => c[1].includes('related-shows-v1'))
    expect(call).toBeTruthy()
    expect([...call![2].tags].sort()).toEqual(['arrangements', 'shows', 'tags'])
  })
})
