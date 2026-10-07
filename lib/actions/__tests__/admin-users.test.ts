import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { AdminUserRow } from '@/lib/services/admin-users'

/**
 * The seam is the action: what the browser can call. Identity comes from the
 * mocked Supabase session, the role from a mocked getUserRole, and the table
 * from an in-memory stand-in for lib/services/admin-users whose writer records
 * every call that would reach the database.
 */

let currentEmail: string | null = 'owner@example.com'
let roles: Record<string, 'owner' | 'editor'> = {}
let table: AdminUserRow[] = []
const writes: { op: string; args: unknown[] }[] = []

vi.mock('@/lib/utils/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: currentEmail ? { email: currentEmail } : null }, error: null }),
    },
  }),
}))

vi.mock('@/lib/auth/roles', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/auth/roles')>()),
  getUserRole: async (email: string | null | undefined) => (email ? roles[email.toLowerCase()] ?? null : null),
}))

vi.mock('@/lib/services/admin-users', () => ({
  listAdminUsersForAdmin: vi.fn(async () => table.map((r) => ({ ...r }))),
  mutateAdminUsers: vi.fn(async (fn: (current: AdminUserRow[], writer: unknown) => Promise<unknown>) =>
    fn(
      table.map((r) => ({ ...r })),
      {
        insert: async (row: { email: string; role: 'owner' | 'editor'; addedBy: string }) => {
          writes.push({ op: 'insert', args: [row] })
          if (table.some((r) => r.email === row.email)) return false
          table.push({ ...row, createdAt: null })
          return true
        },
        setRole: async (email: string, role: 'owner' | 'editor') => {
          writes.push({ op: 'setRole', args: [email, role] })
          table = table.map((r) => (r.email === email ? { ...r, role } : r))
        },
        remove: async (email: string) => {
          writes.push({ op: 'remove', args: [email] })
          table = table.filter((r) => r.email !== email)
        },
      }
    )
  ),
}))

const actions = () => import('@/lib/actions/admin-users')

function row(email: string, role: 'owner' | 'editor'): AdminUserRow {
  return { email, role, addedBy: null, createdAt: null }
}

beforeEach(() => {
  currentEmail = 'owner@example.com'
  roles = { 'owner@example.com': 'owner', 'editor@example.com': 'editor' }
  table = [row('owner@example.com', 'owner'), row('editor@example.com', 'editor')]
  writes.length = 0
})

describe('guard', () => {
  it('forbids an editor from every action, before touching the table', async () => {
    currentEmail = 'editor@example.com'
    const a = await actions()
    expect(await a.listAdminUsers()).toEqual({ ok: false, error: 'forbidden' })
    expect(await a.addAdminUser({ email: 'x@example.com', role: 'editor' })).toEqual({ ok: false, error: 'forbidden' })
    expect(await a.setAdminUserRole({ email: 'owner@example.com', role: 'editor' })).toEqual({ ok: false, error: 'forbidden' })
    expect(await a.removeAdminUser({ email: 'owner@example.com' })).toEqual({ ok: false, error: 'forbidden' })
    expect(writes).toHaveLength(0)
  })

  it('forbids a signed-out caller and an address not on the list', async () => {
    const a = await actions()
    currentEmail = null
    expect((await a.listAdminUsers()).ok).toBe(false)
    currentEmail = 'stranger@brightdesigns.band'
    expect(await a.removeAdminUser({ email: 'editor@example.com' })).toEqual({ ok: false, error: 'forbidden' })
    expect(writes).toHaveLength(0)
  })
})

describe('validation', () => {
  it('rejects an invalid email with field issues, not a message from the database', async () => {
    const a = await actions()
    const result = await a.addAdminUser({ email: 'not-an-email', role: 'editor' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe('invalid')
      expect(result.issues?.[0]?.path).toBe('email')
    }
    expect(writes).toHaveLength(0)
  })

  it('rejects an unknown role', async () => {
    const a = await actions()
    const result = await a.addAdminUser({ email: 'new@example.com', role: 'admin' })
    expect(result).toMatchObject({ ok: false, error: 'invalid' })
    expect(writes).toHaveLength(0)
  })

  it('trims and lower-cases the email before writing', async () => {
    const a = await actions()
    const result = await a.addAdminUser({ email: '  New.Person@Example.COM ', role: 'editor' })
    expect(result.ok).toBe(true)
    expect(writes).toEqual([
      { op: 'insert', args: [{ email: 'new.person@example.com', role: 'editor', addedBy: 'owner@example.com' }] },
    ])
  })
})

describe('rules', () => {
  it('cannot remove yourself', async () => {
    table.push(row('second@example.com', 'owner'))
    const a = await actions()
    const result = await a.removeAdminUser({ email: 'Owner@Example.com' })
    expect(result).toMatchObject({ ok: false, error: 'conflict' })
    expect(writes).toHaveLength(0)
  })

  it('cannot remove the last owner', async () => {
    // The caller is an owner per their role lookup, but the table (the truth
    // inside the locked transaction) has one owner, and it is someone else.
    roles['editor@example.com'] = 'owner'
    currentEmail = 'editor@example.com'
    const a = await actions()
    const result = await a.removeAdminUser({ email: 'owner@example.com' })
    expect(result).toMatchObject({ ok: false, error: 'conflict' })
    expect(writes).toHaveLength(0)
  })

  it('cannot demote the last owner, including yourself', async () => {
    const a = await actions()
    const result = await a.setAdminUserRole({ email: 'owner@example.com', role: 'editor' })
    expect(result).toMatchObject({ ok: false, error: 'conflict' })
    expect(writes).toHaveLength(0)
  })

  it('reports not_found for an address that is not on the list', async () => {
    const a = await actions()
    expect(await a.removeAdminUser({ email: 'ghost@example.com' })).toEqual({ ok: false, error: 'not_found' })
    expect(await a.setAdminUserRole({ email: 'ghost@example.com', role: 'owner' })).toEqual({ ok: false, error: 'not_found' })
  })

  it('reports conflict when the address already has access', async () => {
    const a = await actions()
    expect(await a.addAdminUser({ email: 'editor@example.com', role: 'owner' })).toMatchObject({ ok: false, error: 'conflict' })
  })
})

describe('success paths', () => {
  it('lists', async () => {
    const a = await actions()
    const result = await a.listAdminUsers()
    expect(result).toEqual({ ok: true, data: table })
  })

  it('promotes, then demotes an owner when another owner remains', async () => {
    const a = await actions()
    expect((await a.setAdminUserRole({ email: 'editor@example.com', role: 'owner' })).ok).toBe(true)
    expect((await a.setAdminUserRole({ email: 'owner@example.com', role: 'editor' })).ok).toBe(true)
    expect(writes.map((w) => w.op)).toEqual(['setRole', 'setRole'])
  })

  it('removes another user and returns the new list', async () => {
    const a = await actions()
    const result = await a.removeAdminUser({ email: 'editor@example.com' })
    expect(writes).toEqual([{ op: 'remove', args: ['editor@example.com'] }])
    expect(result).toEqual({ ok: true, data: [row('owner@example.com', 'owner')] })
  })

  it('returns failed, never the error message, when the database throws', async () => {
    const services = await import('@/lib/services/admin-users')
    vi.mocked(services.mutateAdminUsers).mockRejectedValueOnce(new Error('duplicate key value violates "admin_users_pkey"'))
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const a = await actions()
    expect(await a.removeAdminUser({ email: 'editor@example.com' })).toEqual({ ok: false, error: 'failed' })
    error.mockRestore()
  })
})
