import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PgDialect } from 'drizzle-orm/pg-core'
import type { SQL } from 'drizzle-orm'

/**
 * getUserRole reads admin_users through `db`. The db is mocked at the query
 * chain so the test sees exactly what the lookup asks for and can make it
 * return rows or fail like Postgres does.
 */

let rows: { role: string }[] = []
let failWith: unknown = null
const whereArgs: SQL[] = []

vi.mock('@/lib/database', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: (condition: SQL) => {
          whereArgs.push(condition)
          return {
            limit: async () => {
              if (failWith) throw failWith
              return rows
            },
          }
        },
      }),
    }),
  },
}))

async function load() {
  // Fresh module per test: the "missing table" warning is once per process.
  vi.resetModules()
  return import('@/lib/auth/roles')
}

const dialect = new PgDialect()

beforeEach(() => {
  rows = []
  failWith = null
  whereArgs.length = 0
  vi.restoreAllMocks()
})

describe('getUserRole', () => {
  it('returns owner and editor from the admin_users row', async () => {
    const { getUserRole } = await load()
    rows = [{ role: 'owner' }]
    expect(await getUserRole('trevor@brightdesigns.band')).toBe('owner')
    rows = [{ role: 'editor' }]
    expect(await getUserRole('someone@example.com')).toBe('editor')
  })

  it('returns null when there is no row, including for domain addresses', async () => {
    // The old rule made every @brightdesigns.band address staff. Gone.
    const { getUserRole } = await load()
    rows = []
    expect(await getUserRole('designer@brightdesigns.band')).toBeNull()
  })

  it('returns null without querying for a missing email', async () => {
    const { getUserRole } = await load()
    expect(await getUserRole(undefined)).toBeNull()
    expect(await getUserRole('')).toBeNull()
    expect(await getUserRole('   ')).toBeNull()
    expect(whereArgs).toHaveLength(0)
  })

  it('ignores an unknown role value rather than trusting it', async () => {
    const { getUserRole } = await load()
    rows = [{ role: 'superuser' }]
    expect(await getUserRole('a@example.com')).toBeNull()
  })

  it('compares case-insensitively: lower(email) against the lower-cased input', async () => {
    const { getUserRole } = await load()
    rows = [{ role: 'editor' }]
    expect(await getUserRole('  Trevor@BrightDesigns.Band ')).toBe('editor')
    const query = dialect.sqlToQuery(whereArgs[0])
    expect(query.sql).toMatch(/lower\(.*"email"::text\)/)
    expect(query.params).toEqual(['trevor@brightdesigns.band'])
  })

  it('fails closed when admin_users does not exist: null, one console.error', async () => {
    const { getUserRole } = await load()
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    // drizzle wraps the driver error; the postgres code sits on `cause`.
    failWith = Object.assign(new Error('Failed query'), {
      cause: Object.assign(new Error('relation "admin_users" does not exist'), { code: '42P01' }),
    })
    expect(await getUserRole('trevor@brightdesigns.band')).toBeNull()
    expect(await getUserRole('brighton@brightdesigns.band')).toBeNull()
    expect(error).toHaveBeenCalledTimes(1)
  })

  it('throws on any other database error instead of denying silently', async () => {
    const { getUserRole } = await load()
    failWith = Object.assign(new Error('connection refused'), { code: 'ECONNREFUSED' })
    await expect(getUserRole('trevor@brightdesigns.band')).rejects.toThrow('connection refused')
  })
})

describe('getUserPermissions / requirePermission', () => {
  it('derive from the looked-up role', async () => {
    const { getUserPermissions, requirePermission } = await load()
    rows = [{ role: 'editor' }]
    expect((await getUserPermissions('e@example.com')).canDeleteFiles).toBe(true)
    expect(await requirePermission('e@example.com', 'canManageUsers')).toBe(false)
    rows = []
    expect((await getUserPermissions('guest@example.com')).canAccessAdmin).toBe(false)
    expect(await requirePermission(undefined, 'canDeleteFiles')).toBe(false)
  })
})
