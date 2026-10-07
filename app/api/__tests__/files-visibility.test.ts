import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * GET /api/files returns different rows to different callers, so its response
 * must never enter a shared cache. SuccessResponse (public, s-maxage) is for
 * caller-independent bodies and must keep behaving that way.
 */

let currentUser: { email: string } | null = null

const ROWS = [
  { id: 1, isPublic: true, storagePath: 'a.png' },
  { id: 2, isPublic: false, storagePath: 'b.pdf' },
]

vi.mock('@/lib/utils/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: currentUser }, error: null }) },
  }),
}))

// Admin access is a row in admin_users, read by getUserRole (lib/auth/roles.ts).
// Stand in for that lookup: only the test's admin address has a row.
vi.mock('@/lib/auth/roles', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/auth/roles')>()),
  getUserRole: async (email?: string | null) => (email === 'admin@brightdesigns.band' ? 'editor' : null),
}))

// The mocked query honours the visibility predicate the route builds by
// inspecting what it asked for: rows are filtered only if the route filtered.
let requestedPublicOnly = false
vi.mock('drizzle-orm', async (orig) => {
  const actual = await orig<typeof import('drizzle-orm')>()
  return {
    ...actual,
    and: (...c: unknown[]) => c,
    eq: (col: { name?: string }, val: unknown) => ({ col: col?.name, val }),
  }
})
vi.mock('@/lib/database', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: async (conds: { col?: string; val?: unknown }[]) => {
          requestedPublicOnly = conds.some((c) => c.col === 'is_public' && c.val === true)
          return requestedPublicOnly ? ROWS.filter((r) => r.isPublic) : ROWS
        },
      }),
    }),
  },
}))
vi.mock('@/lib/storage', () => ({
  fileStorage: { getFileUrl: (p: string) => `/u/${p}` },
  withRootPrefix: (p: string) => p,
  STORAGE_BUCKET: 'test',
}))

beforeEach(() => {
  currentUser = null
  requestedPublicOnly = false
})

const getFiles = async () => {
  const { GET } = await import('@/app/api/files/route')
  return GET(new Request('http://localhost/api/files') as never)
}

describe('GET /api/files', () => {
  it('returns only public rows to an anonymous caller, uncached', async () => {
    const res = await getFiles()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.map((f: { id: number }) => f.id)).toEqual([1])
    expect(res.headers.get('cache-control')).toBe('private, no-store')
    expect(res.headers.get('netlify-vary')).toBeNull()
  })

  it('returns only public rows to a signed-in non-staff caller', async () => {
    currentUser = { email: 'nobody@example.com' }
    const res = await getFiles()
    const body = await res.json()
    expect(body.data.map((f: { id: number }) => f.id)).toEqual([1])
    expect(res.headers.get('cache-control')).toBe('private, no-store')
  })

  it('returns all rows to staff, uncached', async () => {
    currentUser = { email: 'admin@brightdesigns.band' }
    const res = await getFiles()
    const body = await res.json()
    expect(body.data.map((f: { id: number }) => f.id)).toEqual([1, 2])
    expect(res.headers.get('cache-control')).toBe('private, no-store')
  })
})

describe('SuccessResponse', () => {
  it('still sets the public cache headers for caller-independent routes', async () => {
    const { SuccessResponse } = await import('@/lib/utils/api-helpers')
    const res = SuccessResponse({ ok: true })
    expect(res.headers.get('cache-control')).toBe('public, max-age=0, s-maxage=60, stale-while-revalidate=300')
    expect(res.headers.get('netlify-vary')).toBe('query')
  })
})
