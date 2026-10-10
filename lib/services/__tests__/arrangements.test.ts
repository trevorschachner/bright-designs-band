import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * getArrangementBySlug: one relational query with explicit columns at every
 * level, no licensing cost, the parent show projected to what the page
 * renders, and cache tags for everything the read touches.
 */

import { getArrangementBySlug } from '@/lib/services/arrangements'

type Opts = { columns?: Record<string, boolean>; with?: Record<string, any>; where?: unknown }

const { unstableCache, findFirst } = vi.hoisted(() => ({
  unstableCache: vi.fn(
    (fn: (...a: unknown[]) => unknown, _key: string[], _opts: { tags: string[]; revalidate: number }) => fn,
  ),
  findFirst: vi.fn<(opts: Opts) => Promise<unknown>>(),
}))
vi.mock('next/cache', () => ({ unstable_cache: unstableCache }))
vi.mock('@/lib/database', () => ({
  isDatabaseConfigured: () => true,
  db: { query: { arrangements: { findFirst } } },
}))

const row = {
  id: 7,
  title: 'Opener',
  composer: 'Piazzolla',
  arranger: 'BD',
  percussionArranger: null,
  description: null,
  grade: '3_4',
  year: 2025,
  durationSeconds: 120,
  scene: 'Opener',
  ensembleSize: 'medium',
  commissioned: null,
  sampleScoreUrl: null,
  showArrangements: [
    {
      show: {
        id: 3,
        title: 'True North',
        slug: 'true-north',
        thumbnailUrl: null,
        graphicUrl: 'https://cdn.example/g.webp',
        files: [{ url: 'https://cdn.example/art.webp' }],
      },
    },
  ],
  files: [{ id: 1, fileName: 'a.mp3', originalName: 'a.mp3', fileType: 'audio', url: 'u', isPublic: true, description: null, displayOrder: 0 }],
  arrangementPieces: [{ piece: { id: 4, title: 'Libertango', composer: 'Piazzolla' } }],
}

beforeEach(() => {
  findFirst.mockReset()
  unstableCache.mockClear()
})

describe('getArrangementBySlug', () => {
  it('makes one query with explicit columns and never licensing cost', async () => {
    findFirst.mockResolvedValue(row)
    await getArrangementBySlug('pipeline')
    expect(findFirst).toHaveBeenCalledTimes(1)
    const opts = findFirst.mock.calls[0][0]
    expect(opts.columns).toBeDefined()
    expect(opts.columns).not.toHaveProperty('copyrightAmountUsd')
    expect(opts.columns).not.toHaveProperty('displayOrder')
    expect(opts.with?.arrangementPieces.with.piece.columns).toEqual({ id: true, title: true, composer: true })
    expect(JSON.stringify(opts.columns)).not.toContain('copyright')
    expect(opts.with?.files.columns).not.toHaveProperty('storagePath')
    expect(Object.keys(opts.with?.files.columns ?? {}).length).toBeGreaterThan(0)
  })

  it('projects the parent show to exactly what the page renders', async () => {
    findFirst.mockResolvedValue(row)
    const result = await getArrangementBySlug('pipeline')
    const showOpts = findFirst.mock.calls[0][0].with?.showArrangements.with.show
    expect(Object.keys(showOpts.columns).sort()).toEqual(['graphicUrl', 'id', 'slug', 'thumbnailUrl', 'title'])
    expect(showOpts.with.files.columns).toEqual({ url: true })
    expect(Object.keys(result!.show!).sort()).toEqual(['graphicUrl', 'id', 'imageUrl', 'slug', 'thumbnailUrl', 'title'])
    expect(result!.show!.slug).toBe('true-north')
    expect(result!.show!.imageUrl).toBe('https://cdn.example/art.webp')
    expect(result!.pieces).toEqual([{ id: 4, title: 'Libertango', composer: 'Piazzolla' }])
  })

  it('returns show: null when the arrangement has no parent show', async () => {
    findFirst.mockResolvedValue({ ...row, showArrangements: [] })
    expect((await getArrangementBySlug('pipeline'))!.show).toBeNull()
  })

  it('caches under the arrangements, shows and pieces tags', async () => {
    findFirst.mockResolvedValue(row)
    await getArrangementBySlug('pipeline')
    const [, key, options] = unstableCache.mock.calls[0]
    expect(key).toEqual(['arrangement-detail-v2'])
    expect(options.tags).toEqual(['arrangements', 'shows', 'pieces'])
    expect(options.revalidate).toBe(3600)
  })

  it('returns null for a missing arrangement and for an empty slug without querying', async () => {
    findFirst.mockResolvedValue(undefined)
    expect(await getArrangementBySlug('nope')).toBeNull()
    expect(await getArrangementBySlug('')).toBeNull()
    expect(findFirst).toHaveBeenCalledTimes(1)
  })

  it('lets a database failure propagate', async () => {
    findFirst.mockRejectedValue(new Error('timeout'))
    await expect(getArrangementBySlug('pipeline')).rejects.toThrow('timeout')
  })
})
