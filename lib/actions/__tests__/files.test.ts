import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createFakeDb, opsOn, type Op, type Respond } from './fake-db'

/**
 * File actions against the recording fake of the Drizzle client and a mocked
 * server Supabase client (auth for guard(), storage for remove()).
 */

const state = vi.hoisted(() => ({
  email: 'editor@example.com' as string | null,
  fake: null as unknown as ReturnType<typeof import('./fake-db').createFakeDb>,
  removeError: null as { message: string } | null,
  removed: [] as string[][],
}))

vi.mock('@/lib/utils/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.email ? { email: state.email } : null }, error: null }) },
    storage: {
      from: () => ({
        remove: async (paths: string[]) => {
          state.removed.push(paths)
          return { data: state.removeError ? null : paths.map((name) => ({ name })), error: state.removeError }
        },
      }),
    },
  }),
}))
vi.mock('@/lib/auth/roles', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/auth/roles')>()),
  getUserRole: async (email: string | null | undefined) => (email === 'editor@example.com' ? 'editor' : null),
}))
vi.mock('@/lib/database', () => ({
  db: new Proxy({}, { get: (_t, prop) => (state.fake.db as Record<string | symbol, unknown>)[prop] }),
}))
const invalidateFileOwner = vi.hoisted(() => vi.fn(async (..._args: unknown[]) => { state.fake.events.push('invalidate') }))
vi.mock('@/lib/services/files', () => ({ invalidateFileOwner }))
const invalidateShow = vi.hoisted(() => vi.fn((..._args: unknown[]) => state.fake.events.push('invalidate')))
vi.mock('@/lib/services/invalidate', () => ({ invalidateShow }))
vi.mock('@/lib/observability/report-error', () => ({ reportError: vi.fn(async () => {}) }))

import { attachYouTube, deleteFile, setShowThumbnail } from '@/lib/actions/files'

const SAVED = new Date('2026-10-07T12:05:00.000Z')
const IMAGE = {
  id: 5,
  url: 'https://cdn.example/files/shows/7/image/a.png',
  storagePath: 'shows/7/image/a.png',
  fileType: 'image',
  showId: 7,
  arrangementId: null,
}

function filesDb(overrides: Partial<Record<string, (op: Op) => unknown[]>> = {}): Respond {
  return (op) => {
    const custom = overrides[`${op.kind}:${op.table}`]
    if (custom) return custom(op)
    if (op.kind === 'select' && op.table === 'files') return [IMAGE]
    if (op.kind === 'select' && op.table === 'shows') return [{ id: 7, thumbnailUrl: IMAGE.url, graphicUrl: null }]
    if (op.kind === 'update' && op.table === 'shows') {
      return [{ id: 7, slug: 'my-show', thumbnailUrl: (op.set?.thumbnailUrl as string | null) ?? null, updatedAt: SAVED }]
    }
    if (op.kind === 'insert' && op.table === 'files') return [{ id: 6, url: 'https://youtu.be/abc', showId: 7, arrangementId: null }]
    return []
  }
}

function use(respond: Respond) {
  state.fake = createFakeDb(respond)
  return state.fake
}

beforeEach(() => {
  state.email = 'editor@example.com'
  state.removeError = null
  state.removed = []
  invalidateFileOwner.mockClear()
  invalidateShow.mockClear()
  use(filesDb())
})

describe('deleteFile', () => {
  it('removes the Storage object, clears the thumbnail that pointed at it, then deletes the row', async () => {
    const fake = state.fake
    const result = await deleteFile({ id: 5 })
    expect(result).toEqual({
      ok: true,
      data: { id: 5, show: { id: 7, thumbnailUrl: null, updatedAt: SAVED.toISOString() } },
    })
    expect(state.removed).toEqual([['files/shows/7/image/a.png']])
    const [showUpdate] = opsOn(fake.ops, 'shows', 'update')
    expect(showUpdate.set).toMatchObject({ thumbnailUrl: null })
    expect(showUpdate.set).not.toHaveProperty('graphicUrl')
    expect(opsOn(fake.ops, 'files', 'delete')).toHaveLength(1)
    expect(invalidateFileOwner).toHaveBeenCalledWith(expect.objectContaining({ showId: 7 }))
    expect(fake.events.slice(-2)).toEqual(['commit', 'invalidate'])
  })

  it('keeps the row (and the show) when Storage refuses the remove', async () => {
    state.removeError = { message: 'boom' }
    const fake = state.fake
    expect(await deleteFile({ id: 5 })).toEqual({ ok: false, error: 'failed' })
    expect(opsOn(fake.ops, 'files', 'delete')).toHaveLength(0)
    expect(opsOn(fake.ops, 'shows', 'update')).toHaveLength(0)
    expect(invalidateFileOwner).not.toHaveBeenCalled()
  })

  it('leaves the show alone when its art points elsewhere', async () => {
    const fake = use(filesDb({ 'select:shows': () => [{ id: 7, thumbnailUrl: 'https://other', graphicUrl: null }] }))
    expect(await deleteFile({ id: 5 })).toEqual({ ok: true, data: { id: 5, show: null } })
    expect(opsOn(fake.ops, 'shows', 'update')).toHaveLength(0)
    expect(opsOn(fake.ops, 'files', 'delete')).toHaveLength(1)
  })

  it('a YouTube link has no Storage object to remove', async () => {
    use(filesDb({ 'select:files': () => [{ ...IMAGE, fileType: 'youtube', url: 'https://youtu.be/x' }] }))
    expect(await deleteFile({ id: 5 })).toMatchObject({ ok: true })
    expect(state.removed).toEqual([])
  })

  it('not_found for a missing file; forbidden without a session', async () => {
    use(filesDb({ 'select:files': () => [] }))
    expect(await deleteFile({ id: 5 })).toEqual({ ok: false, error: 'not_found' })
    state.email = null
    expect(await deleteFile({ id: 5 })).toEqual({ ok: false, error: 'forbidden' })
    expect(state.removed).toEqual([])
  })
})

describe('setShowThumbnail', () => {
  it('points the thumbnail at one of the show’s images and returns the new updatedAt', async () => {
    const fake = state.fake
    expect(await setShowThumbnail({ showId: 7, fileId: 5 })).toEqual({
      ok: true,
      data: { showId: 7, thumbnailUrl: IMAGE.url, updatedAt: SAVED.toISOString() },
    })
    expect(opsOn(fake.ops, 'shows', 'update')[0].set).toMatchObject({ thumbnailUrl: IMAGE.url })
    expect(invalidateShow).toHaveBeenCalledWith(7, 'my-show')
  })

  it('refuses another show’s file, a non-image, and neither/both of fileId and url', async () => {
    use(filesDb({ 'select:files': () => [{ ...IMAGE, showId: 8 }] }))
    expect(await setShowThumbnail({ showId: 7, fileId: 5 })).toEqual({ ok: false, error: 'not_found' })
    use(filesDb({ 'select:files': () => [{ ...IMAGE, fileType: 'audio' }] }))
    expect(await setShowThumbnail({ showId: 7, fileId: 5 })).toMatchObject({ ok: false, error: 'invalid' })
    expect(await setShowThumbnail({ showId: 7 })).toMatchObject({ ok: false, error: 'invalid' })
    expect(await setShowThumbnail({ showId: 7, fileId: 5, url: 'x' })).toMatchObject({ ok: false, error: 'invalid' })
  })

  it('clears the thumbnail with url: null', async () => {
    const fake = state.fake
    expect(await setShowThumbnail({ showId: 7, url: null })).toMatchObject({ ok: true, data: { thumbnailUrl: null } })
    expect(opsOn(fake.ops, 'shows', 'update')[0].set).toMatchObject({ thumbnailUrl: null })
  })
})

describe('attachYouTube', () => {
  it('rejects a URL that is not YouTube, before any write', async () => {
    const fake = state.fake
    expect(await attachYouTube({ showId: 7, url: 'https://vimeo.com/123' })).toEqual({
      ok: false,
      error: 'invalid',
      issues: [{ path: 'url', message: 'Enter a valid YouTube URL' }],
    })
    expect(fake.ops).toHaveLength(0)
  })

  it('stores a youtube file row under the show and invalidates its owner', async () => {
    const fake = state.fake
    const result = await attachYouTube({ showId: 7, url: 'https://youtu.be/abc', description: 'Full run' })
    expect(result).toEqual({ ok: true, data: { id: 6, url: 'https://youtu.be/abc', showId: 7, arrangementId: null } })
    const [insert] = opsOn(fake.ops, 'files', 'insert')
    expect(insert.values).toMatchObject({
      fileType: 'youtube',
      fileName: 'youtube_abc.url',
      storagePath: 'shows/7/youtube/youtube_abc.url',
      originalName: 'Full run',
      isPublic: true,
    })
    expect(invalidateFileOwner).toHaveBeenCalled()
  })

  it('requires a show or a part', async () => {
    expect(await attachYouTube({ url: 'https://youtu.be/abc' })).toMatchObject({ ok: false, error: 'invalid' })
  })
})
