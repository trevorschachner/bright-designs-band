import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createFakeDb, opsOn, type Op, type Respond } from './fake-db'

/**
 * Resource actions against a recording fake of the Drizzle client (./fake-db).
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
const invalidateResources = vi.hoisted(() => vi.fn(() => state.fake.events.push('invalidate')))
vi.mock('@/lib/services/invalidate', () => ({ invalidateResources }))
vi.mock('@/lib/observability/report-error', () => ({ reportError: vi.fn(async () => {}) }))

import { createResource, deleteResource, setResourceActive, updateResource } from '@/lib/actions/resources'

const LOADED = '2026-10-07T12:00:00.000Z'
const SAVED = new Date('2026-10-07T12:05:00.000Z')
const uniqueViolation = () => Object.assign(new Error('Failed query'), { cause: Object.assign(new Error('dup "resources_slug_unique"'), { code: '23505' }) })

const row = (extra: Record<string, unknown> = {}) => ({
  id: 3, slug: 'guide', title: 'Guide', isActive: true, fileUrl: null, description: null, updatedAt: SAVED, ...extra,
})

function resourceDb(overrides: Partial<Record<string, (op: Op) => unknown[]>> = {}): Respond {
  return (op) => {
    const custom = overrides[`${op.kind}:${op.table}`]
    if (custom) return custom(op)
    if (op.table !== 'resources') return []
    if (op.kind === 'select') return [{ updatedAt: new Date(LOADED) }]
    if (op.kind === 'insert') return [row(op.values as Record<string, unknown>)]
    if (op.kind === 'update') return [row(op.set)]
    if (op.kind === 'delete') return [{ id: 3 }]
    return []
  }
}
const use = (respond: Respond) => (state.fake = createFakeDb(respond))

beforeEach(() => {
  state.email = 'editor@example.com'
  invalidateResources.mockClear()
  use(resourceDb())
})

describe('resource actions', () => {
  it('are forbidden without a session and reject bad input, before any query', async () => {
    state.email = null
    expect(await createResource({ title: 'Guide' })).toEqual({ ok: false, error: 'forbidden' })
    state.email = 'editor@example.com'
    expect(await createResource({ title: 'Guide', slug: 'Bad Slug' })).toMatchObject({ ok: false, error: 'invalid', issues: [{ path: 'slug' }] })
    expect(await createResource({ title: 'Guide', downloadCount: 9 } as never)).toMatchObject({ ok: false, error: 'invalid' })
    expect(state.fake.ops).toHaveLength(0)
  })

  it('createResource derives the slug from the title and defaults the flags', async () => {
    const fake = state.fake
    const result = await createResource({ title: 'Color Guard Guide', description: '' })
    expect(result).toMatchObject({ ok: true, data: { slug: 'color-guard-guide' } })
    expect(opsOn(fake.ops, 'resources', 'insert')[0].values).toMatchObject({
      slug: 'color-guard-guide', description: null, isActive: true, requiresContactForm: true,
    })
    expect(invalidateResources).toHaveBeenCalledTimes(1)
  })

  it('createResource: a taken slug is conflict, never silently renamed', async () => {
    use(resourceDb({ 'insert:resources': () => { throw uniqueViolation() } }))
    expect(await createResource({ title: 'Guide', slug: 'guide' })).toEqual({ ok: false, error: 'conflict' })
    expect(invalidateResources).not.toHaveBeenCalled()
  })

  it('createResource copies the description onto the linked file record', async () => {
    const fake = state.fake
    await createResource({ title: 'Guide', fileUrl: 'https://cdn.example/g.pdf', description: 'How to' })
    expect(opsOn(fake.ops, 'files', 'update')[0]).toMatchObject({ set: { description: 'How to' }, inTransaction: true })
  })

  it('updateResource writes only the keys sent, bumps updatedAt, invalidates after commit', async () => {
    const fake = state.fake
    expect(await updateResource({ id: 3, updatedAt: LOADED, title: 'New' })).toMatchObject({ ok: true })
    expect(opsOn(fake.ops, 'resources', 'update')[0].set).toEqual({ title: 'New', updatedAt: expect.any(Date) })
    expect(opsOn(fake.ops, 'files')).toHaveLength(0)
    expect(fake.events.slice(-2)).toEqual(['commit', 'invalidate'])
  })

  it('updateResource: stale, not_found, slug conflict', async () => {
    use(resourceDb({ 'select:resources': () => [{ updatedAt: new Date('2026-10-08T00:00:00.000Z') }] }))
    expect(await updateResource({ id: 3, updatedAt: LOADED, title: 'New' })).toEqual({ ok: false, error: 'stale' })
    expect(opsOn(state.fake.ops, 'resources', 'update')).toHaveLength(0)
    use(resourceDb({ 'select:resources': () => [] }))
    expect(await updateResource({ id: 3, updatedAt: LOADED, title: 'New' })).toEqual({ ok: false, error: 'not_found' })
    use(resourceDb({ 'update:resources': () => { throw uniqueViolation() } }))
    expect(await updateResource({ id: 3, updatedAt: LOADED, slug: 'taken' })).toEqual({ ok: false, error: 'conflict' })
    expect(invalidateResources).not.toHaveBeenCalled()
  })

  it('setResourceActive toggles isActive and bumps updatedAt', async () => {
    const fake = state.fake
    expect(await setResourceActive(3, false)).toMatchObject({ ok: true, data: { isActive: false } })
    expect(opsOn(fake.ops, 'resources', 'update')[0].set).toEqual({ isActive: false, updatedAt: expect.any(Date) })
    expect(invalidateResources).toHaveBeenCalledTimes(1)
    use(resourceDb({ 'update:resources': () => [] }))
    expect(await setResourceActive(4, true)).toEqual({ ok: false, error: 'not_found' })
  })

  it('deleteResource deletes and invalidates; not_found when nothing matched', async () => {
    expect(await deleteResource(3)).toEqual({ ok: true, data: { id: 3 } })
    expect(invalidateResources).toHaveBeenCalledTimes(1)
    use(resourceDb({ 'delete:resources': () => [] }))
    expect(await deleteResource(4)).toEqual({ ok: false, error: 'not_found' })
  })
})
