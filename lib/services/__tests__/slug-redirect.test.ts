import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * getSlugRedirect: old slug → the show's current slug, via slug_redirects
 * joined to shows. Cached under the `shows` tag, so every invalidateShow
 * (including the one a slug change makes) expires it.
 */

const { unstableCache, rows, calls } = vi.hoisted(() => ({
  unstableCache: vi.fn(
    (fn: (...a: unknown[]) => unknown, _key: string[], _opts: { tags: string[]; revalidate: number }) => fn,
  ),
  rows: { value: [] as { slug: string }[] },
  calls: [] as string[],
}))
vi.mock('next/cache', () => ({ unstable_cache: unstableCache }))

vi.mock('@/lib/database', async () => {
  const { getTableName } = await import('drizzle-orm')
  const chain = {
    from: (table: Parameters<typeof getTableName>[0]) => {
      calls.push(`from:${getTableName(table)}`)
      return chain
    },
    innerJoin: (table: Parameters<typeof getTableName>[0]) => {
      calls.push(`join:${getTableName(table)}`)
      return chain
    },
    where: () => chain,
    limit: async () => rows.value,
  }
  return { isDatabaseConfigured: () => true, db: { select: () => chain } }
})

import { getSlugRedirect } from '@/lib/services/shows'

beforeEach(() => {
  rows.value = []
  calls.length = 0
  unstableCache.mockClear()
})

describe('getSlugRedirect', () => {
  it('returns the current slug of the show the old slug belonged to', async () => {
    rows.value = [{ slug: 'new-slug' }]
    expect(await getSlugRedirect('old-slug')).toBe('new-slug')
    expect(calls).toEqual(['from:slug_redirects', 'join:shows'])
  })

  it('returns null when there is no redirect', async () => {
    expect(await getSlugRedirect('never-existed')).toBeNull()
  })

  it('never redirects a slug to itself', async () => {
    rows.value = [{ slug: 'same' }]
    expect(await getSlugRedirect('same')).toBeNull()
  })

  it('is cached under the shows tag', async () => {
    await getSlugRedirect('old-slug')
    const [, key, opts] = unstableCache.mock.calls[0]
    expect(key).toEqual(['slug-redirect-v1'])
    expect(opts.tags).toEqual(['shows'])
  })
})
