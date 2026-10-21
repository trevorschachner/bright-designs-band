import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The admin resources list against a mocked db that honours `limit` and
 * `offset` the way Postgres does, so paging is checked end to end: the count
 * query answers the stored total, the row query answers its slice.
 */

const state = vi.hoisted(() => ({
  rows: [] as { id: number; title: string; createdAt: Date; updatedAt: Date }[],
  wheres: [] as unknown[],
}))

vi.mock('@/lib/database', () => {
  const select = (fields?: Record<string, unknown>) => {
    const counting = !!fields && 'count' in fields
    let limit = Infinity
    let offset = 0
    const chain = {
      from: () => chain,
      where(where: unknown) {
        state.wheres.push(where)
        return chain
      },
      orderBy: () => chain,
      limit(n: number) {
        limit = n
        return chain
      },
      offset(n: number) {
        offset = n
        return chain
      },
      then(resolve: (rows: unknown[]) => void) {
        resolve(counting ? [{ count: state.rows.length }] : state.rows.slice(offset, offset + limit))
      },
    }
    return chain
  }
  return { db: { select } }
})

vi.mock('next/cache', () => ({ unstable_cache: <T>(fn: T) => fn }))

import { getResourcesPageForAdmin } from '@/lib/services/resources'

const seed = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    title: `Resource ${i + 1}`,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  }))

beforeEach(() => {
  state.rows = seed(45)
  state.wheres = []
})

describe('getResourcesPageForAdmin', () => {
  it('serves rows 21–40 for page 2 of 20, with the total', async () => {
    const page = await getResourcesPageForAdmin({ page: 2, limit: 20 })
    expect(page.rows.map((r) => r.id)).toEqual(Array.from({ length: 20 }, (_, i) => i + 21))
    expect(page).toMatchObject({ total: 45, page: 2, pageSize: 20, totalPages: 3 })
  })

  it('serves the last page for a page past the end and reports it', async () => {
    const page = await getResourcesPageForAdmin({ page: 9, limit: 20 })
    expect(page.rows.map((r) => r.id)).toEqual([41, 42, 43, 44, 45])
    expect(page.page).toBe(3)
  })

  it('serves page 1 with no rows when there are none', async () => {
    state.rows = []
    const page = await getResourcesPageForAdmin({ page: 2, limit: 20 })
    expect(page).toEqual({ rows: [], total: 0, page: 1, pageSize: 20, totalPages: 0 })
  })

  it('filters both the count and the rows by q', async () => {
    await getResourcesPageForAdmin({ q: 'guide', page: 1, limit: 20 })
    expect(state.wheres).toHaveLength(2)
  })
})
