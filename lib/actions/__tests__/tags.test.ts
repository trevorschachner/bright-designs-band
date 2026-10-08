import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createFakeDb, opsOn, type Op, type Respond } from './fake-db'

/**
 * Tag actions against a recording fake of the Drizzle client (./fake-db).
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
const invalidateTags = vi.hoisted(() => vi.fn(() => state.fake.events.push('invalidate')))
vi.mock('@/lib/services/invalidate', () => ({ invalidateTags }))
vi.mock('@/lib/observability/report-error', () => ({ reportError: vi.fn(async () => {}) }))

import { createTag, deleteTag, updateTag } from '@/lib/actions/tags'

const LOADED = '2026-10-07T12:00:00.000Z'
const SAVED = new Date('2026-10-07T12:05:00.000Z')
const uniqueViolation = () => Object.assign(new Error('Failed query'), { cause: Object.assign(new Error('dup "tags_name_unique"'), { code: '23505' }) })

function tagDb(overrides: Partial<Record<string, (op: Op) => unknown[]>> = {}): Respond {
  return (op) => {
    const custom = overrides[`${op.kind}:${op.table}`]
    if (custom) return custom(op)
    if (op.kind === 'select') return [{ updatedAt: new Date(LOADED) }]
    if (op.kind === 'insert') return [{ id: 5, name: (op.values as { name: string }).name, updatedAt: SAVED }]
    if (op.kind === 'update') return [{ id: 5, name: op.set?.name, updatedAt: SAVED }]
    if (op.kind === 'delete') return [{ id: 5 }]
    return []
  }
}
const use = (respond: Respond) => (state.fake = createFakeDb(respond))

beforeEach(() => {
  state.email = 'editor@example.com'
  invalidateTags.mockClear()
  use(tagDb())
})

describe('tag actions', () => {
  it('are forbidden without a session and invalid on bad input, before any query', async () => {
    state.email = null
    expect(await createTag({ name: 'Dark' })).toEqual({ ok: false, error: 'forbidden' })
    state.email = 'editor@example.com'
    expect(await createTag({ name: '   ' })).toMatchObject({ ok: false, error: 'invalid', issues: [{ path: 'name' }] })
    expect(await updateTag({ id: 5, name: 'X' } as never)).toMatchObject({ ok: false, error: 'invalid' })
    expect(state.fake.ops).toHaveLength(0)
  })

  it('createTag trims, inserts, invalidates; a duplicate name is conflict', async () => {
    expect(await createTag({ name: '  Dark ' })).toEqual({ ok: true, data: { id: 5, name: 'Dark', updatedAt: SAVED.toISOString() } })
    expect(invalidateTags).toHaveBeenCalledTimes(1)
    use(tagDb({ 'insert:tags': () => { throw uniqueViolation() } }))
    expect(await createTag({ name: 'Dark' })).toEqual({ ok: false, error: 'conflict' })
    expect(invalidateTags).toHaveBeenCalledTimes(1)
  })

  it('updateTag locks, checks updatedAt, renames, bumps updatedAt, invalidates after commit', async () => {
    const fake = state.fake
    expect(await updateTag({ id: 5, name: 'Light', updatedAt: LOADED })).toMatchObject({ ok: true, data: { name: 'Light' } })
    expect(opsOn(fake.ops, 'tags', 'select')[0].lock).toBe('update')
    expect(opsOn(fake.ops, 'tags', 'update')[0].set).toEqual({ name: 'Light', updatedAt: expect.any(Date) })
    expect(fake.events.slice(-2)).toEqual(['commit', 'invalidate'])
  })

  it('updateTag: stale, not_found and conflict', async () => {
    use(tagDb({ 'select:tags': () => [{ updatedAt: new Date('2026-10-07T12:00:01.000Z') }] }))
    expect(await updateTag({ id: 5, name: 'Light', updatedAt: LOADED })).toEqual({ ok: false, error: 'stale' })
    expect(opsOn(state.fake.ops, 'tags', 'update')).toHaveLength(0)
    use(tagDb({ 'select:tags': () => [] }))
    expect(await updateTag({ id: 5, name: 'Light', updatedAt: LOADED })).toEqual({ ok: false, error: 'not_found' })
    use(tagDb({ 'update:tags': () => { throw uniqueViolation() } }))
    expect(await updateTag({ id: 5, name: 'Dark', updatedAt: LOADED })).toEqual({ ok: false, error: 'conflict' })
    expect(invalidateTags).not.toHaveBeenCalled()
  })

  it('deleteTag deletes and invalidates; not_found when nothing matched', async () => {
    expect(await deleteTag(5)).toEqual({ ok: true, data: { id: 5 } })
    expect(invalidateTags).toHaveBeenCalledTimes(1)
    use(tagDb({ 'delete:tags': () => [] }))
    expect(await deleteTag(6)).toEqual({ ok: false, error: 'not_found' })
    expect(await deleteTag(-1)).toMatchObject({ ok: false, error: 'invalid' })
  })
})
