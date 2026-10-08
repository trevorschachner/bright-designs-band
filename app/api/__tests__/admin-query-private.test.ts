import { describe, it, expect, vi } from 'vitest'

/**
 * The admin UI reads /api/shows?admin=true, /api/shows/:id?admin=true and
 * /api/tags?admin=true. A non-staff request for those URLs must not leave an
 * edge-cacheable copy behind, or staff could be served it: every ?admin=true
 * answer is private, whether or not the guard passes.
 */

vi.mock('@/lib/utils/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: null }, error: null }) },
  }),
}))
vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: <T extends (...a: never[]) => unknown>(fn: T) => fn,
}))

const adminRead = vi.fn()
vi.mock('@/lib/services/shows', () => ({
  getShowsPage: async () => ({ data: [{ id: 1, title: 'Public' }], total: 1 }),
  getShowsPageForAdmin: async (...a: unknown[]) => adminRead(...a),
  getShowForApi: async () => ({ id: 1, title: 'Public' }),
  getShowForAdmin: async (...a: unknown[]) => adminRead(...a),
  showWhere: () => ({}),
}))
vi.mock('@/lib/services/tags', () => ({
  getAllTags: async () => [{ id: 1, name: 'Dark' }],
  getTagsForAdmin: async (...a: unknown[]) => adminRead(...a),
}))

const PRIVATE = 'private, no-store'

describe('anonymous ?admin=true', () => {
  it('GET /api/shows?admin=true answers the public data privately', async () => {
    const { GET } = await import('@/app/api/shows/route')
    const res = await GET(new Request('http://localhost/api/shows?admin=true'))
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe(PRIVATE)
    expect(res.headers.get('netlify-vary')).toBeNull()
    expect((await res.json()).data.data[0].title).toBe('Public')
    expect(adminRead).not.toHaveBeenCalled()
  })

  it('GET /api/shows/:id?admin=true answers the public data privately', async () => {
    const { GET } = await import('@/app/api/shows/[id]/route')
    const res = await GET(new Request('http://localhost/api/shows/1?admin=true'), {
      params: Promise.resolve({ id: '1' }),
    })
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe(PRIVATE)
    expect((await res.json()).title).toBe('Public')
    expect(adminRead).not.toHaveBeenCalled()
  })

  it('GET /api/tags?admin=true answers the public data privately', async () => {
    const { GET } = await import('@/app/api/tags/route')
    const res = await GET(new Request('http://localhost/api/tags?admin=true'))
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe(PRIVATE)
    expect(await res.json()).toEqual([{ id: 1, name: 'Dark' }])
    expect(adminRead).not.toHaveBeenCalled()
  })

  it('without ?admin=true the same routes stay edge-cacheable', async () => {
    const { GET } = await import('@/app/api/tags/route')
    const res = await GET(new Request('http://localhost/api/tags'))
    expect(res.headers.get('cache-control')).toContain('s-maxage=60')
  })
})
