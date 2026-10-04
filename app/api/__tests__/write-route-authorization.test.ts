import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * Every write handler must reject an unauthenticated caller with 401 and a
 * signed-in caller without the relevant permission with 403.
 *
 * The seam is the exported route handler: what an HTTP client observes. Nothing
 * here knows whether a route calls guard() or hand-rolls the check, so the test
 * survives the migration it exists to protect, and a route added later is only
 * covered once someone adds it to WRITE_HANDLERS.
 *
 * Both rejection paths must return before any database access, so no database
 * mock is needed. lib/database throws at import without DATABASE_URL, so a
 * route that checks permissions too late fails loudly here.
 */

let currentUser: { email: string } | null = null
// When true, the cookie still carries a session but the auth server rejects the
// user. This is what a revoked, expired or forged session looks like, and it is
// the only case in which getUser() and getSession() disagree.
let authServerRejects = false

vi.mock('@/lib/utils/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getUser: async () =>
        authServerRejects
          ? { data: { user: null }, error: { message: 'invalid JWT' } }
          : { data: { user: currentUser }, error: null },
      getSession: async () => ({
        data: { session: currentUser ? { user: currentUser } : null },
        error: null,
      }),
    },
  }),
}))

beforeEach(() => {
  currentUser = null
  authServerRejects = false
})

// Handlers differ in arity: the [id] routes take a params context, the rest do
// not. The test only ever needs to invoke them and read a status.
type Handler = (req: never, ctx: never) => Promise<Response>

const WRITE_HANDLERS: { name: string; load: () => Promise<Handler>; hasParams?: boolean }[] = [
  { name: 'POST /api/shows', load: async () => (await import('@/app/api/shows/route')).POST as unknown as Handler },
  { name: 'PUT /api/shows/[id]', load: async () => (await import('@/app/api/shows/[id]/route')).PUT as unknown as Handler, hasParams: true },
  { name: 'DELETE /api/shows/[id]', load: async () => (await import('@/app/api/shows/[id]/route')).DELETE as unknown as Handler, hasParams: true },
  { name: 'POST /api/arrangements', load: async () => (await import('@/app/api/arrangements/route')).POST as unknown as Handler },
  { name: 'PUT /api/arrangements/[id]', load: async () => (await import('@/app/api/arrangements/[id]/route')).PUT as unknown as Handler, hasParams: true },
  { name: 'DELETE /api/arrangements/[id]', load: async () => (await import('@/app/api/arrangements/[id]/route')).DELETE as unknown as Handler, hasParams: true },
  { name: 'POST /api/resources', load: async () => (await import('@/app/api/resources/route')).POST as unknown as Handler },
  { name: 'PUT /api/resources/[id]', load: async () => (await import('@/app/api/resources/[id]/route')).PUT as unknown as Handler, hasParams: true },
  { name: 'DELETE /api/resources/[id]', load: async () => (await import('@/app/api/resources/[id]/route')).DELETE as unknown as Handler, hasParams: true },
  { name: 'POST /api/tags', load: async () => (await import('@/app/api/tags/route')).POST as unknown as Handler },
  { name: 'PUT /api/tags/[id]', load: async () => (await import('@/app/api/tags/[id]/route')).PUT as unknown as Handler, hasParams: true },
  { name: 'DELETE /api/tags/[id]', load: async () => (await import('@/app/api/tags/[id]/route')).DELETE as unknown as Handler, hasParams: true },
  { name: 'POST /api/files', load: async () => (await import('@/app/api/files/route')).POST as unknown as Handler },
  { name: 'DELETE /api/files/[id]', load: async () => (await import('@/app/api/files/[id]/route')).DELETE as unknown as Handler, hasParams: true },
  { name: 'POST /api/files/sign', load: async () => (await import('@/app/api/files/sign/route')).POST as unknown as Handler },
  { name: 'POST /api/files/youtube', load: async () => (await import('@/app/api/files/youtube/route')).POST as unknown as Handler },
  { name: 'POST /api/admin/shows/backfill-images', load: async () => (await import('@/app/api/admin/shows/backfill-images/route')).POST as unknown as Handler },
  { name: 'POST /api/pieces', load: async () => (await import('@/app/api/pieces/route')).POST as unknown as Handler },
  { name: 'PUT /api/pieces/[id]', load: async () => (await import('@/app/api/pieces/[id]/route')).PUT as unknown as Handler, hasParams: true },
  { name: 'DELETE /api/pieces/[id]', load: async () => (await import('@/app/api/pieces/[id]/route')).DELETE as unknown as Handler, hasParams: true },
  { name: 'PUT /api/arrangements/[id]/pieces', load: async () => (await import('@/app/api/arrangements/[id]/pieces/route')).PUT as unknown as Handler, hasParams: true },
  // Reads, but gated: pieces carry copyright cost and licensing status (#51).
  { name: 'GET /api/pieces', load: async () => (await import('@/app/api/pieces/route')).GET as unknown as Handler },
  { name: 'GET /api/arrangements/[id]/pieces', load: async () => (await import('@/app/api/arrangements/[id]/pieces/route')).GET as unknown as Handler, hasParams: true },
]

// /api/contact POST is deliberately absent: it serves the public contact form.

const call = async (entry: (typeof WRITE_HANDLERS)[number]) => {
  const handler = await entry.load()
  const request = new Request('http://localhost/test', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  }) as never
  const ctx = (entry.hasParams ? { params: Promise.resolve({ id: '1' }) } : undefined) as never
  return handler(request, ctx)
}

describe('every write route is gated on permission', () => {
  for (const entry of WRITE_HANDLERS) {
    it(`${entry.name} rejects a signed-out caller with 401`, async () => {
      const res = await call(entry)
      expect(res.status).toBe(401)
    })

    it(`${entry.name} rejects a signed-in caller without permission with 403`, async () => {
      currentUser = { email: 'nobody@example.com' }
      const res = await call(entry)
      expect(res.status).toBe(403)
    })
  }
})

describe('a session the auth server rejects is not a session', () => {
  // getSession() reads the cookie and trusts it; getUser() revalidates against
  // the auth server. guard()'s own comment says as much. A route that asks
  // getSession() accepts a session the server has already invalidated, which is
  // the whole reason to standardise on getUser().
  for (const entry of WRITE_HANDLERS) {
    it(`${entry.name} rejects a cookie session the auth server denies`, async () => {
      currentUser = { email: 'admin@brightdesigns.band' }
      authServerRejects = true

      let status: number | string
      try {
        status = (await call(entry)).status
      } catch (error) {
        // Getting past the check and into the handler body counts as a failure
        // just as much as returning 200 does.
        status = `threw past the authorization check: ${(error as Error).message}`
      }
      expect(status).toBe(401)
    })
  }
})
