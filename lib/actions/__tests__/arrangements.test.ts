import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createFakeDb, opsOn, type Op, type Respond } from './fake-db'

/**
 * Arrangement actions against the recording fake of the Drizzle client
 * (./fake-db). Identity is a mocked Supabase session + getUserRole;
 * invalidation is a spy logging into the same event list as the transaction.
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
const invalidate = vi.hoisted(() => ({
  invalidateArrangement: vi.fn((..._args: unknown[]) => state.fake.events.push('invalidate')),
  invalidateShow: vi.fn((..._args: unknown[]) => state.fake.events.push('invalidate')),
}))
vi.mock('@/lib/services/invalidate', () => invalidate)
const tracked = vi.hoisted(() => ({
  calls: [] as { name: string; props: unknown; distinctId: unknown; eventsSoFar: string[] }[],
}))
vi.mock('@/lib/observability/events', () => ({
  trackServerEvent: async (name: string, props: unknown, distinctId?: unknown) => {
    tracked.calls.push({ name, props, distinctId, eventsSoFar: [...state.fake.events] })
  },
}))
vi.mock('@/lib/observability/report-error', () => ({ reportError: vi.fn(async () => {}) }))

import {
  createArrangement,
  deleteArrangement,
  reorderArrangements,
  setArrangementPieces,
  setArrangementTags,
  updateArrangement,
} from '@/lib/actions/arrangements'

const LOADED = '2026-10-07T12:00:00.000Z'
const SAVED = new Date('2026-10-07T12:05:00.000Z')

/** Show 7 (`my-show`) has parts 11, 12, 13; part 11 was loaded at LOADED. */
function partsDb(overrides: Partial<Record<string, (op: Op) => unknown[]>> = {}): Respond {
  return (op) => {
    const custom = overrides[`${op.kind}:${op.table}`]
    if (custom) return custom(op)
    if (op.kind === 'select' && op.table === 'shows') return [{ id: 7, slug: 'my-show' }]
    if (op.kind === 'select' && op.table === 'arrangements') return [{ id: 11, updatedAt: new Date(LOADED) }]
    if (op.kind === 'select' && op.table === 'show_arrangements') {
      return [11, 12, 13].map((arrangementId, i) => ({ arrangementId, orderIndex: i + 1, slug: 'my-show' }))
    }
    if (op.kind === 'select' && op.table === 'tags') return [{ id: 2 }, { id: 3 }]
    if (op.kind === 'select' && op.table === 'pieces') return [{ id: 21 }, { id: 22 }]
    if (op.kind === 'select' && op.table === 'arrangement_pieces') {
      return [{ id: 22, title: 'B', composer: null, copyrightAmountUsd: null, licensingStatus: null, orderIndex: 1 }]
    }
    if ((op.kind === 'insert' || op.kind === 'update') && op.table === 'arrangements') {
      return [{ id: op.kind === 'insert' ? 14 : 11, title: 'Part', updatedAt: SAVED }]
    }
    if (op.kind === 'delete' && op.table === 'arrangements') return [{ id: 11 }]
    return []
  }
}

function use(respond: Respond) {
  state.fake = createFakeDb(respond)
  return state.fake
}

beforeEach(() => {
  tracked.calls.length = 0
  state.email = 'editor@example.com'
  invalidate.invalidateArrangement.mockClear()
  invalidate.invalidateShow.mockClear()
  use(partsDb())
})

describe('guard and validation', () => {
  it('is forbidden without a session, before any query', async () => {
    state.email = null
    const fake = state.fake
    expect(await createArrangement({ showId: 7, title: 'X' })).toEqual({ ok: false, error: 'forbidden' })
    expect(await reorderArrangements({ showId: 7, orderedIds: [11] })).toEqual({ ok: false, error: 'forbidden' })
    expect(fake.ops).toHaveLength(0)
  })

  it('rejects snake_case and unknown keys (strict camelCase)', async () => {
    const fake = state.fake
    expect(await updateArrangement({ id: 11, updatedAt: LOADED, percussion_arranger: 'X' } as never)).toMatchObject({ ok: false, error: 'invalid' })
    expect(await createArrangement({ showId: 7, title: 'X', displayOrder: 3 } as never)).toMatchObject({ ok: false, error: 'invalid' })
    expect(await createArrangement({ showId: 7, title: '  ' })).toMatchObject({ ok: false, error: 'invalid' })
    expect(await updateArrangement({ id: 11, updatedAt: LOADED, grade: '9_10' } as never)).toMatchObject({ ok: false, error: 'invalid' })
    expect(fake.ops).toHaveLength(0)
  })
})

describe('createArrangement', () => {
  it('appends after the last part, links tags, invalidates the part with the show slug after commit', async () => {
    const fake = use(partsDb({ 'select:show_arrangements': () => [{ orderIndex: 3 }] }))
    const result = await createArrangement({ showId: 7, title: 'Part 4', grade: '', tags: [2] })
    expect(result).toEqual({ ok: true, data: { id: 14, title: 'Part', updatedAt: SAVED.toISOString() } })
    const [insert] = opsOn(fake.ops, 'arrangements', 'insert')
    expect(insert.values).toMatchObject({ title: 'Part 4', grade: null })
    expect(opsOn(fake.ops, 'show_arrangements', 'insert')[0].values).toEqual({ showId: 7, arrangementId: 14, orderIndex: 4 })
    expect(opsOn(fake.ops, 'arrangements_to_tags', 'insert')[0].values).toEqual([{ arrangementId: 14, tagId: 2 }])
    expect(invalidate.invalidateArrangement).toHaveBeenCalledWith(14, 'my-show')
    expect(fake.events.slice(-2)).toEqual(['commit', 'invalidate'])
  })

  it('starts at 1 on a show with no parts; not_found for a missing show', async () => {
    const fake = use(partsDb({ 'select:show_arrangements': () => [] }))
    await createArrangement({ showId: 7, title: 'First' })
    expect(opsOn(fake.ops, 'show_arrangements', 'insert')[0].values).toMatchObject({ orderIndex: 1 })
    use(partsDb({ 'select:shows': () => [] }))
    expect(await createArrangement({ showId: 7, title: 'X' })).toEqual({ ok: false, error: 'not_found' })
  })
})

describe('updateArrangement', () => {
  it('rejects a stale save: nothing written, nothing invalidated', async () => {
    const fake = use(partsDb({ 'select:arrangements': () => [{ id: 11, updatedAt: new Date('2026-10-07T12:01:00.000Z') }] }))
    expect(await updateArrangement({ id: 11, updatedAt: LOADED, title: 'Mine' })).toEqual({ ok: false, error: 'stale' })
    expect(opsOn(fake.ops, 'arrangements', 'update')).toHaveLength(0)
    expect(fake.events.at(-1)).toBe('rollback')
    expect(invalidate.invalidateArrangement).not.toHaveBeenCalled()
  })

  it('writes camelCase columns and bumps updatedAt; tags untouched when not sent', async () => {
    const fake = state.fake
    const result = await updateArrangement({ id: 11, updatedAt: LOADED, percussionArranger: 'Ryan', durationSeconds: 270, scene: 'Closer' })
    expect(result).toMatchObject({ ok: true, data: { id: 11, updatedAt: SAVED.toISOString() } })
    const [update] = opsOn(fake.ops, 'arrangements', 'update')
    expect(update.set).toMatchObject({ percussionArranger: 'Ryan', durationSeconds: 270, scene: 'Closer' })
    expect(update.set?.updatedAt).toBeInstanceOf(Date)
    expect(opsOn(fake.ops, 'arrangements_to_tags')).toHaveLength(0)
    expect(invalidate.invalidateArrangement).toHaveBeenCalledWith(11, 'my-show')
  })

  it('setArrangementTags: unknown tag is invalid, links untouched', async () => {
    const fake = state.fake
    expect(await setArrangementTags({ arrangementId: 11, tagIds: [9] })).toEqual({
      ok: false,
      error: 'invalid',
      issues: [{ path: 'tags', message: 'Unknown tag id 9' }],
    })
    expect(opsOn(fake.ops, 'arrangements_to_tags')).toHaveLength(0)
  })
})

describe('deleteArrangement', () => {
  it('reads the show slug before the cascade, then invalidates', async () => {
    const fake = state.fake
    expect(await deleteArrangement({ id: 11 })).toEqual({ ok: true, data: { id: 11 } })
    const kinds = fake.ops.map((op) => `${op.kind}:${op.table}`)
    expect(kinds.indexOf('select:show_arrangements')).toBeLessThan(kinds.indexOf('delete:arrangements'))
    expect(invalidate.invalidateArrangement).toHaveBeenCalledWith(11, 'my-show')
  })

  it('not_found when nothing was deleted', async () => {
    use(partsDb({ 'delete:arrangements': () => [] }))
    expect(await deleteArrangement({ id: 11 })).toEqual({ ok: false, error: 'not_found' })
    expect(invalidate.invalidateArrangement).not.toHaveBeenCalled()
  })
})

describe('reorderArrangements', () => {
  it('rewrites order_index to 1..n in the given order, in one transaction', async () => {
    const fake = state.fake
    const result = await reorderArrangements({ showId: 7, orderedIds: [13, 11, 12] })
    expect(result).toEqual({ ok: true, data: { showId: 7, orderedIds: [13, 11, 12] } })
    const updates = opsOn(fake.ops, 'show_arrangements', 'update')
    expect(updates.map((op) => op.set)).toEqual([{ orderIndex: 1 }, { orderIndex: 2 }, { orderIndex: 3 }])
    expect(updates.every((op) => op.inTransaction)).toBe(true)
    expect(fake.events).toContain('begin')
    expect(invalidate.invalidateShow).toHaveBeenCalledWith(7, 'my-show')
    expect(fake.events.slice(-2)).toEqual(['commit', 'invalidate'])
  })

  it('refuses a list that is not exactly the show’s parts (missing, extra, duplicate)', async () => {
    const fake = state.fake
    expect(await reorderArrangements({ showId: 7, orderedIds: [13, 11] })).toMatchObject({ ok: false, error: 'invalid' })
    expect(await reorderArrangements({ showId: 7, orderedIds: [13, 11, 12, 99] })).toMatchObject({ ok: false, error: 'invalid' })
    expect(await reorderArrangements({ showId: 7, orderedIds: [11, 11, 12] })).toMatchObject({ ok: false, error: 'invalid' })
    expect(opsOn(fake.ops, 'show_arrangements', 'update')).toHaveLength(0)
    expect(invalidate.invalidateShow).not.toHaveBeenCalled()
  })
})

describe('setArrangementPieces', () => {
  it('replaces the links in order (1..n) and returns the saved list', async () => {
    const fake = state.fake
    const result = await setArrangementPieces({ arrangementId: 11, pieceIds: [22, 21] })
    expect(result).toMatchObject({ ok: true, data: [{ id: 22, orderIndex: 1 }] })
    const links = opsOn(fake.ops, 'arrangement_pieces').filter((op) => op.kind !== 'select')
    expect(links.map((op) => op.kind)).toEqual(['delete', 'insert'])
    expect(links[1].values).toEqual([
      { arrangementId: 11, pieceId: 22, orderIndex: 1 },
      { arrangementId: 11, pieceId: 21, orderIndex: 2 },
    ])
    expect(invalidate.invalidateArrangement).toHaveBeenCalledWith(11, 'my-show')
  })

  it('an unknown piece is invalid and nothing is relinked; duplicates fail the schema', async () => {
    const fake = state.fake
    expect(await setArrangementPieces({ arrangementId: 11, pieceIds: [21, 99] })).toEqual({
      ok: false,
      error: 'invalid',
      issues: [{ path: 'pieceIds', message: 'Unknown piece id 99' }],
    })
    expect(opsOn(fake.ops, 'arrangement_pieces', 'delete')).toHaveLength(0)
    expect(await setArrangementPieces({ arrangementId: 11, pieceIds: [21, 21] })).toMatchObject({ ok: false, error: 'invalid' })
  })

  it('clears the list with an empty array', async () => {
    const fake = state.fake
    await setArrangementPieces({ arrangementId: 11, pieceIds: [] })
    expect(opsOn(fake.ops, 'arrangement_pieces', 'insert')).toHaveLength(0)
    expect(opsOn(fake.ops, 'arrangement_pieces', 'delete')).toHaveLength(1)
  })
})

describe('server events', () => {
  it('createArrangement tracks arrangement.saved after commit', async () => {
    use(partsDb({ 'select:show_arrangements': () => [{ orderIndex: 3 }] }))
    await createArrangement({ showId: 7, title: 'Part 4' })
    expect(tracked.calls).toHaveLength(1)
    expect(tracked.calls[0]).toMatchObject({
      name: 'arrangement.saved',
      props: { arrangementId: 14, showId: 7 },
      distinctId: 'editor@example.com',
    })
    expect(tracked.calls[0].eventsSoFar).toContain('commit')
  })

  it('updateArrangement tracks arrangement.saved after commit; nothing when stale', async () => {
    await updateArrangement({ id: 11, updatedAt: LOADED, title: 'Mine' })
    expect(tracked.calls).toHaveLength(1)
    expect(tracked.calls[0]).toMatchObject({ name: 'arrangement.saved', props: { arrangementId: 11 } })
    expect(tracked.calls[0].eventsSoFar).toContain('commit')
    tracked.calls.length = 0
    use(partsDb({ 'select:arrangements': () => [{ id: 11, updatedAt: new Date('2026-10-07T12:01:00.000Z') }] }))
    await updateArrangement({ id: 11, updatedAt: LOADED, title: 'Mine' })
    expect(tracked.calls).toHaveLength(0)
  })
})
