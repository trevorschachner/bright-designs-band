import { describe, it, expect, vi } from 'vitest'

/**
 * `GET /api/shows/[id]` is read only by the admin editor, which loads it when a
 * show is opened. It used to be served from the CDN for an hour, so a thumbnail
 * saved a moment ago was missing when the editor was reopened, and the next
 * auto-save wrote the stale copy back over it. The editor must always read the
 * row as it is now.
 */

vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }))

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

describe('GET /api/shows/[id]', () => {
  it('is never cached by the CDN or the browser', async () => {
    const { GET } = await import('@/app/api/shows/[id]/route')
    const res = await GET(new Request('http://localhost/api/shows/7'), { params: Promise.resolve({ id: '7' }) })

    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe('private, no-store')
    const data = await res.json()
    expect(data).toMatchObject({ id: 7, thumbnailUrl: 'https://cdn/poster.png', arrangements: [] })
  })
})
