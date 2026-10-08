import { describe, it, expect, vi } from 'vitest'

/**
 * The admin editor (`app/admin/shows/[id]`) loads a show with
 * `GET /api/shows/[id]?admin=true` when it opens and PUTs the whole snapshot
 * back on auto-save. That read used to be served from the CDN for an hour, so
 * a thumbnail saved a moment ago was missing when the editor was reopened, and
 * the next auto-save wrote the stale copy back over it (#70). The editor must
 * always read the row as it is now: never through the data cache, and never
 * stored by the CDN or the browser.
 *
 * (#70 made the bare URL no-store. The service-layer refactor keeps the bare
 * URL as the cached public read and gives staff an uncached, private read
 * under ?admin=true, which is the URL the editor calls; this asserts that.)
 */

const cachedCalls = vi.fn()
vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: <T extends (...a: never[]) => unknown>(fn: T) =>
    ((...args: Parameters<T>) => {
      cachedCalls(...args)
      return fn(...args)
    }) as unknown as T,
}))

vi.mock('@/lib/auth/guard', () => ({
  guard: async () => ({ denied: null, email: 'staff@brightdesigns.band' }),
}))

vi.mock('@/lib/database', () => ({
  db: {
    query: {
      shows: {
        findFirst: async () => ({
          id: 7,
          slug: 'the-show',
          title: 'The Show',
          thumbnailUrl: 'https://cdn/poster.png',
          showsToTags: [],
          showArrangements: [],
        }),
      },
    },
  },
}))

describe('GET /api/shows/[id]?admin=true (the editor read)', () => {
  it('is uncached and never stored by the CDN or the browser', async () => {
    const { GET } = await import('@/app/api/shows/[id]/route')
    const res = await GET(new Request('http://localhost/api/shows/7?admin=true'), {
      params: Promise.resolve({ id: '7' }),
    })

    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe('private, no-store')
    expect(cachedCalls).not.toHaveBeenCalled()
    const data = await res.json()
    expect(data).toMatchObject({ id: 7, thumbnailUrl: 'https://cdn/poster.png' })
  })
})
