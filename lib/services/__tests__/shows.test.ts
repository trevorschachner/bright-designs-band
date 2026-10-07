import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

/**
 * The shows service: explicit column lists, null (not an exception, not an
 * empty object) for a missing show, errors that propagate instead of turning
 * into empty lists, and "whatever is featured" on the home page.
 */

import { getFeaturedShows, getShowBySlug } from '@/lib/services/shows'

type Opts = { columns?: Record<string, boolean>; with?: Record<string, any>; where?: unknown }

const { unstableCache, findMany, findFirst, looseMatch } = vi.hoisted(() => ({
  unstableCache: vi.fn(
    (fn: (...a: unknown[]) => unknown, _key: string[], _opts: { tags: string[]; revalidate: number }) => fn,
  ),
  findMany: vi.fn<(opts: Opts) => Promise<unknown[]>>(),
  findFirst: vi.fn<(opts: Opts) => Promise<unknown>>(),
  looseMatch: vi.fn<() => Promise<{ id: number }[]>>(async () => []),
}))
vi.mock('next/cache', () => ({ unstable_cache: unstableCache }))

vi.mock('@/lib/database', () => ({
  isDatabaseConfigured: () => true,
  db: {
    query: { shows: { findMany, findFirst } },
    select: () => ({ from: () => ({ where: () => ({ limit: looseMatch }) }) }),
  },
}))

const showRow = (id: number, extra: Record<string, unknown> = {}) => ({
  id,
  title: `Show ${id}`,
  slug: `show-${id}`,
  description: null,
  year: 2025,
  difficulty: null,
  duration: null,
  thumbnailUrl: 'https://cdn.example/t.webp',
  graphicUrl: null,
  featured: true,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  showsToTags: [{ tag: { id: 1, name: 'Dark' } }],
  showArrangements: [{ arrangement: { id: 3, title: 'Opener', scene: 'Opener' } }],
  files: [],
  ...extra,
})

beforeEach(() => {
  findMany.mockReset()
  findFirst.mockReset()
  looseMatch.mockReset()
  looseMatch.mockResolvedValue([])
  unstableCache.mockClear()
})

describe('getFeaturedShows', () => {
  it('returns a single featured show (no "fewer than three means none" rule)', async () => {
    findMany.mockResolvedValue([showRow(1)])
    const result = await getFeaturedShows()
    expect(result.map((s) => s.id)).toEqual([1])
  })

  it('returns an empty list when nothing is featured', async () => {
    findMany.mockResolvedValue([])
    expect(await getFeaturedShows()).toEqual([])
  })

  it('selects explicit columns on the show and on every relation', async () => {
    findMany.mockResolvedValue([])
    await getFeaturedShows()
    const opts = findMany.mock.calls[0][0]
    expect(Object.keys(opts.columns ?? {}).sort()).toEqual(
      ['createdAt', 'description', 'difficulty', 'duration', 'featured', 'graphicUrl', 'id', 'slug', 'thumbnailUrl', 'title', 'year'],
    )
    expect(opts.columns).not.toHaveProperty('price')
    expect(opts.with?.showsToTags.with.tag.columns).toEqual({ id: true, name: true })
    expect(opts.with?.showArrangements.with.arrangement.columns).toEqual({ id: true, title: true, scene: true })
    expect(opts.with?.files.columns).toEqual({ storagePath: true })
  })

  it('caches under the shows, arrangements and tags tags', async () => {
    findMany.mockResolvedValue([])
    await getFeaturedShows()
    const [, , options] = unstableCache.mock.calls[0]
    expect(options.tags).toEqual(['shows', 'arrangements', 'tags'])
    expect(options.revalidate).toBe(3600)
  })

  it('returns JSON-safe timestamps, so a cache hit and a miss look the same', async () => {
    findMany.mockResolvedValue([showRow(1)])
    const [show] = await getFeaturedShows()
    expect(show.createdAt).toBe('2025-01-01T00:00:00.000Z')
  })

  it('lets a database failure propagate instead of answering an empty list', async () => {
    findMany.mockRejectedValue(new Error('connection refused'))
    await expect(getFeaturedShows()).rejects.toThrow('connection refused')
  })
})

describe('getShowBySlug', () => {
  it('returns null when no show matches, so the page can call notFound()', async () => {
    findFirst.mockResolvedValue(undefined)
    expect(await getShowBySlug('no-such-show')).toBeNull()
  })

  it('falls back to a loose slug match', async () => {
    findFirst.mockResolvedValueOnce(undefined).mockResolvedValueOnce(showRow(9))
    looseMatch.mockResolvedValue([{ id: 9 }])
    const result = await getShowBySlug('Show_9')
    expect(result?.show.id).toBe(9)
  })

  it('falls back to a numeric id', async () => {
    findFirst.mockResolvedValueOnce(undefined).mockResolvedValueOnce(showRow(42))
    const result = await getShowBySlug('42')
    expect(result?.show.id).toBe(42)
  })

  it('selects explicit detail columns, never price', async () => {
    findFirst.mockResolvedValue(showRow(1, { updatedAt: new Date('2025-02-01T00:00:00Z') }))
    const result = await getShowBySlug('show-1')
    const opts = findFirst.mock.calls[0][0]
    expect(opts.columns).toBeDefined()
    expect(opts.columns).not.toHaveProperty('price')
    expect(opts.with?.showsToTags.with.tag.columns).toEqual({ id: true, name: true })
    expect(result?.showsToTags).toEqual([{ tag: { id: 1, name: 'Dark' } }])
    expect(result?.show.updatedAt).toBe('2025-02-01T00:00:00.000Z')
  })

  it('throws on a database failure rather than reporting "not found"', async () => {
    findFirst.mockRejectedValue(new Error('timeout'))
    await expect(getShowBySlug('show-1')).rejects.toThrow('timeout')
  })
})

describe('during a build without a database', () => {
  const saved = process.env.NEXT_PHASE
  afterEach(() => {
    if (saved === undefined) delete process.env.NEXT_PHASE
    else process.env.NEXT_PHASE = saved
  })

  it('answers the build fallback without touching the database', async () => {
    vi.resetModules()
    vi.doMock('@/lib/database', () => ({ isDatabaseConfigured: () => false, db: {} }))
    process.env.NEXT_PHASE = 'phase-production-build'
    const service = await import('@/lib/services/shows')
    expect(await service.getFeaturedShows()).toEqual([])
    expect(await service.getShowBySlug('anything')).toBeNull()
    expect(findMany).not.toHaveBeenCalled()
    vi.doUnmock('@/lib/database')
  })
})
