import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createFakeDb, opsOn, type Op, type Respond } from './fake-db'

/**
 * Show actions against a recording fake of the Drizzle client (./fake-db).
 * The seam is the exported action; identity is a mocked Supabase session and
 * getUserRole, invalidation a spy that logs into the same event list as the
 * transaction so ordering (after commit) is checkable.
 */

const state = vi.hoisted(() => ({
  email: 'editor@example.com' as string | null,
  fake: null as unknown as ReturnType<typeof import('./fake-db').createFakeDb>,
}))

vi.mock('@/lib/utils/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.email ? { email: state.email } : null }, error: null }) },
  }),
}))
vi.mock('@/lib/auth/roles', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/auth/roles')>()),
  getUserRole: async (email: string | null | undefined) => (email === 'editor@example.com' ? 'editor' : null),
}))
vi.mock('@/lib/database', () => ({
  db: new Proxy({}, { get: (_t, prop) => (state.fake.db as Record<string | symbol, unknown>)[prop] }),
}))
const invalidateShow = vi.hoisted(() => vi.fn((..._args: unknown[]) => state.fake.events.push('invalidate')))
vi.mock('@/lib/services/invalidate', () => ({ invalidateShow }))
vi.mock('@/lib/observability/report-error', () => ({ reportError: vi.fn(async () => {}) }))

import { createShow, deleteShow, setFeatured, setShowTags, updateShow } from '@/lib/actions/shows'

const LOADED = '2026-10-07T12:00:00.000Z'
const SAVED = new Date('2026-10-07T12:05:00.000Z')

function stored(extra: Record<string, unknown> = {}) {
  return { id: 7, slug: 'old-slug', updatedAt: new Date(LOADED), ...extra }
}

/** The default database: show 7 exists at `old-slug`, loaded at LOADED. */
function showDb(overrides: Partial<Record<string, (op: Op) => unknown[]>> = {}): Respond {
  return (op) => {
    const custom = overrides[`${op.kind}:${op.table}`]
    if (custom) return custom(op)
    if (op.kind === 'select' && op.table === 'shows') return [stored()]
    if (op.kind === 'update' && op.table === 'shows') {
      return [{ id: 7, slug: (op.set?.slug as string) ?? 'old-slug', title: 'Show', featured: Boolean(op.set?.featured), updatedAt: SAVED }]
    }
    return []
  }
}

function use(respond: Respond) {
  state.fake = createFakeDb(respond)
  return state.fake
}

beforeEach(() => {
  state.email = 'editor@example.com'
  invalidateShow.mockClear()
  use(showDb())
})

describe('guard and validation', () => {
  it('is forbidden without a session, before any query', async () => {
    state.email = null
    const fake = state.fake
    expect(await updateShow({ id: 7, updatedAt: LOADED, title: 'X' })).toEqual({ ok: false, error: 'forbidden' })
    expect(await deleteShow(7)).toEqual({ ok: false, error: 'forbidden' })
    expect(await setFeatured(7, true)).toEqual({ ok: false, error: 'forbidden' })
    expect(fake.ops).toHaveLength(0)
    expect(invalidateShow).not.toHaveBeenCalled()
  })

  it('returns invalid with issues, before any query', async () => {
    const fake = state.fake
    const missingStamp = await updateShow({ id: 7, title: 'X' } as never)
    expect(missingStamp).toMatchObject({ ok: false, error: 'invalid' })
    if (!missingStamp.ok) expect(missingStamp.issues?.map((i) => i.path)).toContain('updatedAt')
    // price is not editable here, and unknown keys are rejected (strict).
    expect(await updateShow({ id: 7, updatedAt: LOADED, price: 10 } as never)).toMatchObject({ ok: false, error: 'invalid' })
    expect(await updateShow({ id: 7, updatedAt: LOADED, slug: 'Not A Slug' })).toMatchObject({ ok: false, error: 'invalid' })
    expect(await createShow({ title: '' })).toMatchObject({ ok: false, error: 'invalid' })
    expect(fake.ops).toHaveLength(0)
  })
})

describe('updateShow', () => {
  it('rejects a stale save: nothing written, nothing invalidated', async () => {
    const fake = use(showDb({ 'select:shows': () => [stored({ updatedAt: new Date('2026-10-07T12:01:00.000Z') })] }))
    expect(await updateShow({ id: 7, updatedAt: LOADED, title: 'Mine' })).toEqual({ ok: false, error: 'stale' })
    expect(opsOn(fake.ops, 'shows', 'update')).toHaveLength(0)
    expect(fake.ops[0]).toMatchObject({ kind: 'select', table: 'shows', lock: 'update', inTransaction: true })
    expect(fake.events.at(-1)).toBe('rollback')
    expect(invalidateShow).not.toHaveBeenCalled()
  })

  it('reports not_found for a missing show', async () => {
    use(showDb({ 'select:shows': () => [] }))
    expect(await updateShow({ id: 7, updatedAt: LOADED, title: 'X' })).toEqual({ ok: false, error: 'not_found' })
  })

  it('leaves the slug, redirects and tags alone when they are not sent; bumps updatedAt', async () => {
    const fake = state.fake
    const result = await updateShow({ id: 7, updatedAt: LOADED, title: 'New title' })
    expect(result).toEqual({
      ok: true,
      data: { id: 7, slug: 'old-slug', title: 'Show', featured: false, updatedAt: SAVED.toISOString() },
    })
    const [update] = opsOn(fake.ops, 'shows', 'update')
    expect(update.set).not.toHaveProperty('slug')
    expect(update.set).toMatchObject({ title: 'New title' })
    expect(update.set?.updatedAt).toBeInstanceOf(Date)
    expect(opsOn(fake.ops, 'slug_redirects')).toHaveLength(0)
    expect(opsOn(fake.ops, 'shows_to_tags')).toHaveLength(0)
    expect(invalidateShow).toHaveBeenCalledWith(7, 'old-slug', 'old-slug')
  })

  it('on a slug change: releases the new slug, records the old one, invalidates (id, new, old) after commit', async () => {
    const fake = state.fake
    const result = await updateShow({ id: 7, updatedAt: LOADED, slug: 'new-slug' })
    expect(result).toMatchObject({ ok: true, data: { slug: 'new-slug' } })

    const redirects = opsOn(fake.ops, 'slug_redirects')
    expect(redirects.map((op) => op.kind)).toEqual(['delete', 'insert'])
    expect(redirects[1].values).toEqual({ oldSlug: 'old-slug', showId: 7 })
    expect(redirects.every((op) => op.inTransaction)).toBe(true)

    expect(invalidateShow).toHaveBeenCalledWith(7, 'new-slug', 'old-slug')
    expect(fake.events.slice(-2)).toEqual(['commit', 'invalidate'])
  })

  it('does not write a redirect when the sent slug is the current one', async () => {
    const fake = state.fake
    await updateShow({ id: 7, updatedAt: LOADED, slug: 'old-slug', title: 'Same' })
    expect(opsOn(fake.ops, 'slug_redirects')).toHaveLength(0)
  })

  it('replaces tags (deduplicated) only when tags are sent', async () => {
    const fake = state.fake
    await updateShow({ id: 7, updatedAt: LOADED, tags: [3, 3, 4] })
    const tagOps = opsOn(fake.ops, 'shows_to_tags')
    expect(tagOps.map((op) => op.kind)).toEqual(['delete', 'insert'])
    expect(tagOps[1].values).toEqual([{ showId: 7, tagId: 3 }, { showId: 7, tagId: 4 }])
  })

  it('maps a slug taken by another show (unique violation) to conflict', async () => {
    use(showDb({
      'update:shows': () => {
        throw Object.assign(new Error('Failed query'), { cause: Object.assign(new Error('dup'), { code: '23505' }) })
      },
    }))
    expect(await updateShow({ id: 7, updatedAt: LOADED, slug: 'taken' })).toEqual({ ok: false, error: 'conflict' })
    expect(invalidateShow).not.toHaveBeenCalled()
  })
})

describe('createShow', () => {
  it('derives a free slug, releases any redirect on it, links tags, invalidates', async () => {
    let probes = 0
    const fake = use((op) => {
      if (op.kind === 'select' && op.table === 'shows') return probes++ === 0 ? [{ id: 1 }] : []
      if (op.kind === 'insert' && op.table === 'shows') {
        const v = op.values as { slug: string; title: string }
        return [{ id: 9, slug: v.slug, title: v.title, featured: false, updatedAt: SAVED }]
      }
      return []
    })
    const result = await createShow({ title: '  Neon Nights! ', tags: [2] })
    expect(result).toMatchObject({ ok: true, data: { id: 9, slug: 'neon-nights-1', title: 'Neon Nights!' } })
    expect(opsOn(fake.ops, 'slug_redirects', 'delete')).toHaveLength(1)
    expect(opsOn(fake.ops, 'shows_to_tags', 'insert')[0].values).toEqual([{ showId: 9, tagId: 2 }])
    expect(invalidateShow).toHaveBeenCalledWith(9, 'neon-nights-1')
    expect(fake.events.slice(-2)).toEqual(['commit', 'invalidate'])
  })

  it('rejects a title with nothing to build a slug from', async () => {
    expect(await createShow({ title: '!!!' })).toMatchObject({ ok: false, error: 'invalid', issues: [{ path: 'title' }] })
  })
})

describe('deleteShow, setFeatured, setShowTags', () => {
  it('deletes and invalidates; not_found when nothing was deleted', async () => {
    use(showDb({ 'delete:shows': () => [{ id: 7, slug: 'old-slug' }] }))
    expect(await deleteShow(7)).toEqual({ ok: true, data: { id: 7 } })
    expect(invalidateShow).toHaveBeenCalledWith(7, 'old-slug')
    use(showDb())
    expect(await deleteShow(8)).toEqual({ ok: false, error: 'not_found' })
  })

  it('setFeatured writes featured and bumps updatedAt without a concurrency check', async () => {
    const fake = state.fake
    expect(await setFeatured(7, true)).toMatchObject({ ok: true, data: { featured: true } })
    expect(opsOn(fake.ops, 'shows', 'select')).toHaveLength(0)
    expect(opsOn(fake.ops, 'shows', 'update')[0].set).toMatchObject({ featured: true, updatedAt: expect.any(Date) })
    expect(invalidateShow).toHaveBeenCalledWith(7, 'old-slug')
  })

  it('setShowTags replaces the links in a transaction and bumps updatedAt', async () => {
    const fake = state.fake
    expect((await setShowTags(7, [])).ok).toBe(true)
    expect(opsOn(fake.ops, 'shows_to_tags').map((op) => op.kind)).toEqual(['delete'])
    expect(opsOn(fake.ops, 'shows', 'update')[0].set).toEqual({ updatedAt: expect.any(Date) })
    expect(fake.events.slice(-2)).toEqual(['commit', 'invalidate'])
    use(showDb({ 'select:shows': () => [] }))
    expect(await setShowTags(7, [1])).toEqual({ ok: false, error: 'not_found' })
  })
})
