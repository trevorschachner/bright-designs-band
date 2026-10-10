import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createFakeDb, opsOn, type Op, type Respond } from './fake-db'

/**
 * File actions against the recording fake of the Drizzle client and a mocked
 * server Supabase client (auth for guard(), storage for remove()).
 */

const state = vi.hoisted(() => ({
  email: 'editor@example.com' as string | null,
  fake: null as unknown as ReturnType<typeof import('./fake-db').createFakeDb>,
  removeError: null as { message: string } | null,
  /** What remove() reports as removed: 'all' echoes the paths, 'none' is `[]`. */
  removeReports: 'all' as 'all' | 'none',
  existsVisible: false,
  publicHeadStatus: 404,
  removed: [] as string[][],
  buckets: [] as string[],
  /** Answers for successive list() calls (private bucket lookups): true = visible, false = absent, 'error'. */
  listAnswers: [] as (boolean | 'error')[],
  listCalls: 0,
  /** Paths whose remove() errors (for the arrangement delete). */
  failRemoveFor: null as string | null,
}))

vi.mock('@/lib/utils/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.email ? { email: state.email } : null }, error: null }) },
    storage: {
      from: (bucket: string) => ({
        remove: async (paths: string[]) => {
          state.removed.push(paths)
          state.buckets.push(bucket)
          if (state.removeError || paths.includes(state.failRemoveFor ?? '')) return { data: null, error: state.removeError ?? { message: 'boom' } }
          return { data: state.removeReports === 'all' ? paths.map((name) => ({ name })) : [], error: null }
        },
        exists: async () => ({ data: state.existsVisible, error: state.existsVisible ? null : { message: 'not found' } }),
        list: async (_dir: string, opts?: { search?: string }) => {
          state.listCalls++
          const answer = state.listAnswers.shift() ?? false
          if (answer === 'error') return { data: null, error: { message: 'boom' } }
          return { data: answer ? [{ name: opts?.search, id: 'obj', metadata: {} }] : [], error: null }
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
const invalidateArrangement = vi.hoisted(() => vi.fn((..._args: unknown[]) => state.fake.events.push('invalidate')))
vi.mock('@/lib/services/invalidate', () => ({ invalidateShow, invalidateArrangement }))
vi.mock('@/lib/services/pieces', () => ({ getArrangementPiecesForAdmin: async () => [] }))
const reportError = vi.hoisted(() => vi.fn(async (..._args: unknown[]) => {}))
vi.mock('@/lib/observability/report-error', () => ({ reportError }))

import { attachYouTube, deleteFile, setShowThumbnail } from '@/lib/actions/files'
import { deleteArrangement } from '@/lib/actions/arrangements'
import { deleteShow } from '@/lib/actions/shows'

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

// Storage failures are logged by lib/storage.ts on purpose; keep them out of
// the test output.
let consoleError: ReturnType<typeof vi.spyOn>
afterEach(() => consoleError.mockRestore())

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  state.email = 'editor@example.com'
  state.removeError = null
  state.removeReports = 'all'
  state.existsVisible = false
  state.publicHeadStatus = 404
  state.removed = []
  state.buckets = []
  state.listAnswers = []
  state.listCalls = 0
  state.failRemoveFor = null
  reportError.mockClear()
  invalidateArrangement.mockClear()
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co')
  vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: state.publicHeadStatus })))
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

  it('remove() reporting nothing: deletes the row only once the object is confirmed absent', async () => {
    state.removeReports = 'none'
    const fake = state.fake
    expect(await deleteFile({ id: 5 })).toMatchObject({ ok: true, data: { id: 5 } })
    expect(opsOn(fake.ops, 'files', 'delete')).toHaveLength(1)
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('files/shows/7/image/a.png'), expect.objectContaining({ method: 'HEAD' }))
  })

  it('remove() reporting nothing while the object is still there (RLS hid it): failed, row kept, reported', async () => {
    state.removeReports = 'none'
    state.publicHeadStatus = 200
    let fake = state.fake
    expect(await deleteFile({ id: 5 })).toEqual({ ok: false, error: 'failed' })
    expect(opsOn(fake.ops, 'files', 'delete')).toHaveLength(0)
    expect(reportError).toHaveBeenCalled()

    fake = use(filesDb())
    state.existsVisible = true
    expect(await deleteFile({ id: 5 })).toEqual({ ok: false, error: 'failed' })
    expect(opsOn(fake.ops, 'files', 'delete')).toHaveLength(0)
  })

  it('remove() reporting nothing and the lookup failing: failed, row kept', async () => {
    state.removeReports = 'none'
    state.publicHeadStatus = 503
    const fake = state.fake
    expect(await deleteFile({ id: 5 })).toEqual({ ok: false, error: 'failed' })
    expect(opsOn(fake.ops, 'files', 'delete')).toHaveLength(0)
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

describe('deleteFile: private bucket', () => {
  const PRIVATE = { ...IMAGE, url: '/api/files/5/download' }
  const usePrivate = () => use(filesDb({ 'select:files': () => [PRIVATE] }))

  it('removes from the private bucket; a reported removal needs no lookup and never a public HEAD', async () => {
    const fake = usePrivate()
    expect(await deleteFile({ id: 5 })).toMatchObject({ ok: true })
    expect(state.buckets).toEqual(['private'])
    expect(state.listCalls).toBe(0)
    expect(fetch).not.toHaveBeenCalled()
    expect(opsOn(fake.ops, 'files', 'delete')).toHaveLength(1)
  })

  it('private: list empty, no error → row deleted (the object is absent), never a public HEAD', async () => {
    const fake = usePrivate()
    state.removeReports = 'none'
    state.publicHeadStatus = 200 // would say "still there" if it were (wrongly) consulted
    state.listAnswers = [false]
    expect(await deleteFile({ id: 5 })).toMatchObject({ ok: true })
    expect(state.listCalls).toBe(1)
    expect(fetch).not.toHaveBeenCalled()
    expect(opsOn(fake.ops, 'files', 'delete')).toHaveLength(1)
  })

  it('still listed after the remove: failed, row kept', async () => {
    const fake = usePrivate()
    state.removeReports = 'none'
    state.listAnswers = [true]
    expect(await deleteFile({ id: 5 })).toEqual({ ok: false, error: 'failed' })
    expect(opsOn(fake.ops, 'files', 'delete')).toHaveLength(0)
    expect(opsOn(fake.ops, 'shows', 'update')).toHaveLength(0)
  })

  it('a list error is unclear: failed, row kept', async () => {
    const fake = usePrivate()
    state.removeReports = 'none'
    state.listAnswers = ['error']
    expect(await deleteFile({ id: 5 })).toEqual({ ok: false, error: 'failed' })
    expect(fetch).not.toHaveBeenCalled()
    expect(opsOn(fake.ops, 'files', 'delete')).toHaveLength(0)
  })
})

describe('deleteArrangement removes its files first', () => {
  const PART_FILES = [
    { id: 21, storagePath: 'shows/7/arrangements/3/audio/a.mp3', url: 'https://cdn.example/a.mp3', fileType: 'audio', showId: 7, arrangementId: 3 },
    { id: 22, storagePath: 'shows/7/arrangements/3/score/b.pdf', url: '/api/files/22/download', fileType: 'score', showId: null, arrangementId: 3 },
    { id: 23, storagePath: 'shows/7/arrangements/3/youtube/y.url', url: 'https://youtu.be/y', fileType: 'youtube', showId: null, arrangementId: 3 },
  ]
  const usePartDb = (showArt: { thumbnailUrl: string | null; graphicUrl: string | null } = { thumbnailUrl: null, graphicUrl: null }) =>
    use(filesDb({
      'select:files': () => PART_FILES,
      'select:shows': () => [{ id: 7, ...showArt }],
      'select:show_arrangements': () => [{ slug: 'my-show' }],
      'delete:arrangements': () => [{ id: 3 }],
    }))

  it('each object, then its row, then the part; YouTube rows have no object', async () => {
    const fake = usePartDb()
    expect(await deleteArrangement({ id: 3 })).toEqual({ ok: true, data: { id: 3 } })
    expect(state.removed).toEqual([['files/shows/7/arrangements/3/audio/a.mp3'], ['files/shows/7/arrangements/3/score/b.pdf']])
    expect(state.buckets).toEqual(['Bright Designs', 'private'])
    expect(opsOn(fake.ops, 'files', 'delete')).toHaveLength(3)
    const lastFileDelete = fake.events.lastIndexOf('delete:files')
    expect(lastFileDelete).toBeLessThan(fake.events.indexOf('delete:arrangements'))
    expect(fake.events.slice(-2)).toEqual(['commit', 'invalidate'])
  })

  it('a Storage failure aborts: failed, part kept, files after it kept, removed ones invalidated', async () => {
    state.failRemoveFor = 'files/shows/7/arrangements/3/score/b.pdf'
    const fake = usePartDb()
    expect(await deleteArrangement({ id: 3 })).toEqual({ ok: false, error: 'failed' })
    // The first file's object and row are gone (committed on its own), the rest stay.
    expect(opsOn(fake.ops, 'files', 'delete')).toHaveLength(1)
    expect(opsOn(fake.ops, 'arrangements', 'delete')).toHaveLength(0)
    // The row already deleted is a public change: invalidated despite `failed`.
    expect(invalidateArrangement).toHaveBeenCalledWith(3, null, 'my-show')
  })

  it('a failure on the first file changed nothing, so nothing is invalidated', async () => {
    state.failRemoveFor = 'files/shows/7/arrangements/3/audio/a.mp3'
    const fake = usePartDb()
    expect(await deleteArrangement({ id: 3 })).toEqual({ ok: false, error: 'failed' })
    expect(opsOn(fake.ops, 'files', 'delete')).toHaveLength(0)
    expect(invalidateArrangement).not.toHaveBeenCalled()
  })

  it('clears a show thumbnail/graphic that pointed at one of its files, and invalidates that show', async () => {
    const fake = usePartDb({ thumbnailUrl: 'https://cdn.example/a.mp3', graphicUrl: 'https://cdn.example/a.mp3' })
    expect(await deleteArrangement({ id: 3 })).toEqual({ ok: true, data: { id: 3 } })
    const [showUpdate] = opsOn(fake.ops, 'shows', 'update')
    expect(showUpdate.set).toMatchObject({ thumbnailUrl: null, graphicUrl: null })
    expect(invalidateFileOwner).toHaveBeenCalledWith({ showId: 7 })
  })
})

describe('deleteShow removes its files first', () => {
  const SHOW_FILES = [
    { id: 31, storagePath: 'shows/7/image/a.png', url: 'https://cdn.example/a.png', fileType: 'image', showId: 7, arrangementId: null },
    { id: 32, storagePath: 'shows/7/score/b.pdf', url: '/api/files/32/download', fileType: 'score', showId: 7, arrangementId: null },
  ]
  const useShowDb = () =>
    use(filesDb({
      'select:files': () => SHOW_FILES,
      'select:shows': () => [{ id: 7, slug: 'my-show', thumbnailUrl: null, graphicUrl: null }],
      'delete:shows': () => [{ id: 7, slug: 'my-show' }],
    }))

  it('each object, then its row, then the show', async () => {
    const fake = useShowDb()
    expect(await deleteShow(7)).toEqual({ ok: true, data: { id: 7 } })
    expect(state.removed).toEqual([['files/shows/7/image/a.png'], ['files/shows/7/score/b.pdf']])
    expect(state.buckets).toEqual(['Bright Designs', 'private'])
    expect(opsOn(fake.ops, 'files', 'delete')).toHaveLength(2)
    expect(fake.events.lastIndexOf('delete:files')).toBeLessThan(fake.events.indexOf('delete:shows'))
    expect(invalidateShow).toHaveBeenCalledWith(7, 'my-show')
  })

  it('a Storage failure aborts: failed, show kept, removed rows invalidated', async () => {
    state.failRemoveFor = 'files/shows/7/score/b.pdf'
    const fake = useShowDb()
    expect(await deleteShow(7)).toEqual({ ok: false, error: 'failed' })
    expect(opsOn(fake.ops, 'files', 'delete')).toHaveLength(1)
    expect(opsOn(fake.ops, 'shows', 'delete')).toHaveLength(0)
    expect(invalidateShow).toHaveBeenCalledWith(7, 'my-show')
  })

  it('not_found for an unknown show, before any Storage call', async () => {
    use(filesDb({ 'select:shows': () => [] }))
    expect(await deleteShow(8)).toEqual({ ok: false, error: 'not_found' })
    expect(state.removed).toEqual([])
  })
})
