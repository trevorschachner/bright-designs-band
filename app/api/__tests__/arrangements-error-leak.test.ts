import { describe, it, expect, beforeEach, vi } from 'vitest'

/** Error responses from arrangement writes must not echo internal error text. */

vi.mock('@/lib/utils/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { email: 'admin@brightdesigns.band' } }, error: null }) },
  }),
}))
vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: <T extends (...a: never[]) => unknown>(fn: T) => fn,
}))
vi.mock('@/lib/database', () => ({
  db: {
    transaction: async () => {
      throw new Error('secret internal detail')
    },
  },
}))

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

describe('PUT /api/arrangements/[id] failure', () => {
  it('returns 500 without details or the underlying message', async () => {
    const { PUT } = await import('@/app/api/arrangements/[id]/route')
    const res = await PUT(
      new Request('http://localhost/api/arrangements/1', { method: 'PUT', body: JSON.stringify({ title: 'x' }) }),
      { params: Promise.resolve({ id: '1' }) },
    )
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body).toEqual({ error: 'Failed to update arrangement' })
    expect(JSON.stringify(body)).not.toContain('secret')
  })
})
