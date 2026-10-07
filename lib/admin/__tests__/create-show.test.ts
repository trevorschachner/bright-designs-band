import { describe, it, expect, vi } from 'vitest'
import { createShowWithThumbnail } from '@/lib/admin/create-show'

/**
 * The new-show page used to read `result.id` from `POST /api/shows`, but every
 * route answers with the `{ success, data }` envelope, so the id was always
 * undefined, the thumbnail step was silently skipped and the page still said
 * "Show created successfully". These tests pin the flow to the envelope and to
 * reporting, not hiding, a failed thumbnail step.
 */

type Call = { url: string; init?: RequestInit }

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

function fakeFetch(handlers: Record<string, (init?: RequestInit) => Response | Promise<Response>>) {
  const calls: Call[] = []
  const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    calls.push({ url, init })
    const key = Object.keys(handlers).find((k) => url.startsWith(k))
    if (!key) throw new Error(`unexpected fetch ${url}`)
    return handlers[key](init)
  })
  return { fetchImpl: fetchImpl as unknown as typeof fetch, calls }
}

const body = (c: Call) => JSON.parse(String(c.init?.body))

const thumbnail = new File(['png-bytes'], 'poster.png', { type: 'image/png' })

const happyHandlers = {
  'https://storage.example/upload': () => new Response('', { status: 200 }),
  '/api/shows/7': () => json({ id: 7, thumbnailUrl: 'https://cdn/poster.png' }),
  '/api/shows': () => json({ success: true, data: { id: 7, slug: 'the-show' } }, 201),
  '/api/files/sign': () =>
    json({ success: true, data: { signedUrl: 'https://storage.example/upload', storagePath: 'shows/7/image/x.png' } }),
  '/api/files': () => json({ success: true, data: { id: 99, url: 'https://cdn/poster.png' } }, 201),
}

describe('createShowWithThumbnail', () => {
  it('reads the show id from the response envelope and attaches the thumbnail to that show', async () => {
    const { fetchImpl, calls } = fakeFetch(happyHandlers)

    const result = await createShowWithThumbnail(
      { payload: { title: 'The Show' }, tags: [3, 5], thumbnail },
      fetchImpl
    )

    expect(result).toEqual({ status: 'created', showId: 7, thumbnailUrl: 'https://cdn/poster.png' })

    const urls = calls.map((c) => c.url)
    expect(urls).toEqual([
      '/api/shows',
      '/api/files/sign',
      'https://storage.example/upload',
      '/api/files',
      '/api/shows/7',
    ])

    expect(body(calls[0])).toEqual({ title: 'The Show', tags: [3, 5] })
    expect(body(calls[1])).toMatchObject({ showId: 7, fileType: 'image', isPublic: true, fileName: 'poster.png' })
    expect(calls[2].init?.method).toBe('PUT')
    expect(body(calls[3])).toMatchObject({ showId: 7, storagePath: 'shows/7/image/x.png', fileType: 'image' })
    expect(calls[4].init?.method).toBe('PUT')
    // Tags are not resent: PUT only replaces them when present, and the create
    // call already wrote them.
    expect(body(calls[4])).toEqual({ thumbnailUrl: 'https://cdn/poster.png' })
  })

  it('creates the show without touching the file routes when no thumbnail was chosen', async () => {
    const { fetchImpl, calls } = fakeFetch(happyHandlers)

    const result = await createShowWithThumbnail({ payload: { title: 'Bare' }, tags: [], thumbnail: null }, fetchImpl)

    expect(result).toEqual({ status: 'created', showId: 7, thumbnailUrl: null })
    expect(calls.map((c) => c.url)).toEqual(['/api/shows'])
  })

  it('throws the server error when the show itself cannot be created', async () => {
    const { fetchImpl } = fakeFetch({
      '/api/shows': () => json({ success: false, error: 'Bad request' }, 400),
    })

    await expect(
      createShowWithThumbnail({ payload: { title: '' }, tags: [], thumbnail }, fetchImpl)
    ).rejects.toThrow('Bad request')
  })

  it('throws when the create response has no id, instead of silently skipping the thumbnail', async () => {
    const { fetchImpl, calls } = fakeFetch({
      '/api/shows': () => json({ success: true, data: { slug: 'no-id' } }, 201),
    })

    await expect(
      createShowWithThumbnail({ payload: { title: 'X' }, tags: [], thumbnail }, fetchImpl)
    ).rejects.toThrow(/no id/i)
    expect(calls.map((c) => c.url)).toEqual(['/api/shows'])
  })

  it('reports a thumbnail that was uploaded but not saved on the show', async () => {
    const { fetchImpl } = fakeFetch({
      ...happyHandlers,
      '/api/shows/7': () => json({ success: false, error: 'Bad request', details: [{ path: ['thumbnailUrl'] }] }, 400),
    })

    const result = await createShowWithThumbnail({ payload: { title: 'X' }, tags: [1], thumbnail }, fetchImpl)

    expect(result).toEqual({
      status: 'created_without_thumbnail',
      showId: 7,
      error: expect.stringContaining('Bad request'),
    })
  })

  it('reports a storage upload failure and still returns the created show id', async () => {
    const { fetchImpl, calls } = fakeFetch({
      ...happyHandlers,
      'https://storage.example/upload': () => new Response('bucket missing', { status: 404, statusText: 'Not Found' }),
    })

    const result = await createShowWithThumbnail({ payload: { title: 'X' }, tags: [], thumbnail }, fetchImpl)

    expect(result).toMatchObject({ status: 'created_without_thumbnail', showId: 7 })
    expect((result as { error: string }).error).toMatch(/bucket missing/)
    // Nothing is recorded in the files table for an object that never landed.
    expect(calls.map((c) => c.url)).not.toContain('/api/files')
  })
})
