import { describe, it, expect, beforeEach, vi } from 'vitest'
import { z } from 'zod'

/**
 * guarded(): the gate every content action passes through. Identity comes
 * from a mocked Supabase session and getUserRole; the error mapping is driven
 * with fake errors shaped like the real ones.
 */

const state = vi.hoisted(() => ({
  email: 'editor@example.com' as string | null,
  roles: {} as Record<string, 'owner' | 'editor'>,
  roleLookupFails: false,
}))

vi.mock('@/lib/utils/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.email ? { email: state.email } : null }, error: null }) },
  }),
}))

vi.mock('@/lib/auth/roles', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/auth/roles')>()),
  getUserRole: async (email: string | null | undefined) => {
    if (state.roleLookupFails) throw new Error('connection refused')
    return email ? state.roles[email.toLowerCase()] ?? null : null
  },
}))

const fakeDb = vi.hoisted(() => ({ marker: 'db' }))
vi.mock('@/lib/database', () => ({ db: fakeDb }))

const reportError = vi.hoisted(() => vi.fn(async () => {}))
vi.mock('@/lib/observability/report-error', () => ({ reportError }))

import { assertFresh, guarded, InvalidError, NotFoundError, postgresCode, StaleError, toActionFailure } from '@/lib/actions/_guarded'

const schema = z.object({ name: z.string().min(1, 'Name is required') }).strict()

beforeEach(() => {
  state.email = 'editor@example.com'
  state.roles = { 'editor@example.com': 'editor' }
  state.roleLookupFails = false
  reportError.mockClear()
})

describe('error mapping', () => {
  const SECRET = 'duplicate key value violates unique constraint "tags_name_unique" Key (name)=(Dark)'

  it('maps NotFoundError, StaleError and InvalidError', async () => {
    expect(await toActionFailure(new NotFoundError('show'), 'op')).toEqual({ ok: false, error: 'not_found' })
    expect(await toActionFailure(new StaleError('show'), 'op')).toEqual({ ok: false, error: 'stale' })
    const issues = [{ path: 'title', message: 'Needs a letter' }]
    expect(await toActionFailure(new InvalidError(issues), 'op')).toEqual({ ok: false, error: 'invalid', issues })
    expect(reportError).not.toHaveBeenCalled()
  })

  it('maps a unique violation to conflict, on the error or down its cause chain (DrizzleQueryError)', async () => {
    const pg = Object.assign(new Error(SECRET), { code: '23505' })
    expect(await toActionFailure(pg, 'op')).toEqual({ ok: false, error: 'conflict' })
    const wrapped = Object.assign(new Error(`Failed query: insert into "tags"\nparams: Dark`), { cause: pg })
    expect(await toActionFailure(wrapped, 'op')).toEqual({ ok: false, error: 'conflict' })
    expect(postgresCode(wrapped)).toBe('23505')
    expect(reportError).not.toHaveBeenCalled()
  })

  it('maps anything else to failed, reports it, and never returns its message', async () => {
    const other = Object.assign(new Error(SECRET), { code: '23503' })
    const result = await toActionFailure(other, 'createTag')
    expect(result).toEqual({ ok: false, error: 'failed' })
    expect(JSON.stringify(result)).not.toContain('tags_name_unique')
    expect(reportError).toHaveBeenCalledWith(other, expect.objectContaining({ operation: 'createTag' }))

    expect(await toActionFailure('a string', 'op')).toEqual({ ok: false, error: 'failed' })
    expect(await toActionFailure(null, 'op')).toEqual({ ok: false, error: 'failed' })
  })
})

describe('guarded()', () => {
  it('runs fn with the parsed data and { email, db }, and wraps the result in ok', async () => {
    const fn = vi.fn(async (data: { name: string }) => data.name.toUpperCase())
    const run = guarded('canManageTags', schema, fn, 'test')
    expect(await run({ name: 'dark' })).toEqual({ ok: true, data: 'DARK' })
    expect(fn).toHaveBeenCalledWith({ name: 'dark' }, { email: 'editor@example.com', db: fakeDb })
  })

  it('is forbidden without a session, and for an address with no role, before fn runs', async () => {
    const fn = vi.fn(async () => 'x')
    const run = guarded('canManageTags', schema, fn, 'test')
    state.email = null
    expect(await run({ name: 'a' })).toEqual({ ok: false, error: 'forbidden' })
    state.email = 'stranger@example.com'
    expect(await run({ name: 'a' })).toEqual({ ok: false, error: 'forbidden' })
    expect(fn).not.toHaveBeenCalled()
  })

  it('is forbidden when the role lacks the permission', async () => {
    const fn = vi.fn(async () => 'x')
    expect(await guarded('canManageUsers', schema, fn, 'test')({ name: 'a' })).toEqual({ ok: false, error: 'forbidden' })
    expect(fn).not.toHaveBeenCalled()
  })

  it('is failed (not forbidden) when authorization itself is unavailable', async () => {
    state.roleLookupFails = true
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await guarded('canManageTags', schema, async () => 'x', 'test')({ name: 'a' })).toEqual({ ok: false, error: 'failed' })
    error.mockRestore()
  })

  it('returns invalid with field issues for bad input, and rejects unknown keys', async () => {
    const fn = vi.fn(async () => 'x')
    const run = guarded('canManageTags', schema, fn, 'test')
    const bad = await run({ name: '' })
    expect(bad).toEqual({ ok: false, error: 'invalid', issues: [{ path: 'name', message: 'Name is required' }] })
    const extra = await run({ name: 'a', id: 1 })
    expect(extra).toMatchObject({ ok: false, error: 'invalid' })
    expect(fn).not.toHaveBeenCalled()
  })

  it('refuses a non-strict object schema at definition time', () => {
    expect(() => guarded('canManageTags', z.object({ name: z.string() }), async () => 'x', 'loose')).toThrow(/strict/)
  })

  it('maps a throw from fn without leaking its message', async () => {
    const run = guarded('canManageTags', schema, async () => {
      throw new Error('relation "tags" does not exist')
    }, 'boom')
    const result = await run({ name: 'a' })
    expect(result).toEqual({ ok: false, error: 'failed' })
    expect(JSON.stringify(result)).not.toContain('relation')
  })
})

describe('assertFresh', () => {
  it('passes when the instants match, whatever the ISO spelling', () => {
    const stored = new Date('2026-10-07T12:00:00.123Z')
    expect(() => assertFresh(stored, '2026-10-07T12:00:00.123Z')).not.toThrow()
    expect(() => assertFresh(stored, '2026-10-07T08:00:00.123-04:00')).not.toThrow()
    expect(() => assertFresh('2026-10-07T12:00:00.123Z', '2026-10-07T12:00:00.123Z')).not.toThrow()
  })

  it('throws StaleError when they differ or nothing is stored', () => {
    expect(() => assertFresh(new Date('2026-10-07T12:00:00.124Z'), '2026-10-07T12:00:00.123Z')).toThrow(StaleError)
    expect(() => assertFresh(null, '2026-10-07T12:00:00.123Z')).toThrow(StaleError)
  })
})
