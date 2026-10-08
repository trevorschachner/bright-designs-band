import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * /api/export/[file]: the CSVs read shows, arrangements, tags and pieces, so
 * the cached read must carry every one of those tags. Otherwise an edit to a
 * tag or a piece leaves the Active Assets sheet stale for up to an hour.
 */

const { unstableCache, readShowSheetTables } = vi.hoisted(() => ({
  unstableCache: vi.fn(
    (fn: (...a: unknown[]) => unknown, _key: string[], _opts: { tags: string[]; revalidate: number }) => fn,
  ),
  readShowSheetTables: vi.fn(async () => ({ shows: [], parts: [], pieces: [], links: [] })),
}))
vi.mock('next/cache', () => ({ unstable_cache: unstableCache }))
vi.mock('@/lib/database', () => ({ isDatabaseConfigured: () => true, db: {} }))
vi.mock('@/lib/export/load-show-sheet', () => ({
  readShowSheetTables,
  storageFromEnv: () => ({ supabaseUrl: null, bucket: 'b', rootPrefix: 'files' }),
}))

import { GET } from '@/app/api/export/[file]/route'

const call = (file: string) => GET(new Request(`http://x/api/export/${file}`), { params: Promise.resolve({ file }) })

beforeEach(() => {
  unstableCache.mockClear()
  readShowSheetTables.mockClear()
})

describe('GET /api/export/[file] cache tags', () => {
  it('caches under every tag the export reads', async () => {
    const res = await call('shows.csv')
    expect(res.status).toBe(200)
    expect(unstableCache).toHaveBeenCalledTimes(1)
    const opts = unstableCache.mock.calls[0][2]
    expect(opts.tags).toEqual(['shows', 'arrangements', 'tags', 'pieces'])
    expect(opts.revalidate).toBe(3600)
    expect(readShowSheetTables).toHaveBeenCalledTimes(1)
  })

  it('does not read or cache for an unknown file', async () => {
    const res = await call('secrets.csv')
    expect(res.status).toBe(404)
    expect(unstableCache).not.toHaveBeenCalled()
    expect(readShowSheetTables).not.toHaveBeenCalled()
  })
})
