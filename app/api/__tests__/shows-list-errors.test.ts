import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * GET /api/shows used to answer a database failure with an empty 200, which
 * looked identical to "no shows match" and was never reported. It must now be
 * a 500 and reach reportError.
 */

// Like the real reportError, which logs once itself.
const reportError = vi.fn(async (_e: unknown, _c: unknown) => {
  console.error('reportError')
})
vi.mock('@/lib/observability/report-error', () => ({ reportError }))

vi.mock('@/lib/utils/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: null }, error: null }) },
  }),
}))
vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  unstable_cache: <T extends (...a: never[]) => unknown>(fn: T) => fn,
}))

const boom = new Error('connection refused: db.internal:5432')
const failing = new Proxy(
  {},
  {
    get() {
      return () => {
        throw boom
      }
    },
  },
)
vi.mock('@/lib/database', () => ({ db: failing }))

beforeEach(() => {
  reportError.mockClear()
  vi.restoreAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('GET /api/shows database failure', () => {
  it('returns 500 and reports the error instead of an empty 200', async () => {
    const { GET } = await import('@/app/api/shows/route')
    const res = await GET(new Request('http://localhost/api/shows'))

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error).toBe('Failed to load shows')
    expect(JSON.stringify(body)).not.toContain('connection refused')
    expect(reportError).toHaveBeenCalledOnce()
    expect(reportError.mock.calls[0][0]).toBe(boom)
    // reportError logs once itself; the route must not log a second time.
    expect(console.error).toHaveBeenCalledTimes(1)
  })
})
