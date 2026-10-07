import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createFakeDb, opsOn, type Op, type Respond } from './fake-db'

/**
 * signUpload / completeUpload against the recording fake of the Drizzle
 * client and a mocked server Supabase client (auth for guard(); storage for
 * createSignedUploadUrl, list and remove).
 */

const state = vi.hoisted(() => ({
  email: 'editor@example.com' as string | null,
  fake: null as unknown as ReturnType<typeof import('./fake-db').createFakeDb>,
  signed: [] as { bucket: string; path: string }[],
  signError: null as { message: string } | null,
  /** What list() answers: the object's metadata, nothing, or an error. */
  listed: { size: 1000, mimetype: 'audio/mpeg' } as { size: number; mimetype: string } | null | 'error',
  listCalls: [] as { bucket: string; dir: string; search?: string }[],
  removed: [] as { bucket: string; paths: string[] }[],
}))

vi.mock('@/lib/utils/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.email ? { email: state.email } : null }, error: null }) },
    storage: {
      from: (bucket: string) => ({
        createSignedUploadUrl: async (path: string) => {
          state.signed.push({ bucket, path })
          if (state.signError) return { data: null, error: state.signError }
          return { data: { signedUrl: `https://project.supabase.co/storage/v1/object/upload/sign/${bucket}/${path}?token=t`, token: 't', path }, error: null }
        },
        list: async (dir: string, opts?: { search?: string }) => {
          state.listCalls.push({ bucket, dir, search: opts?.search })
          if (state.listed === 'error') return { data: null, error: { message: 'boom' } }
          if (!state.listed) return { data: [], error: null }
          return { data: [{ name: opts?.search, id: 'obj', metadata: state.listed }], error: null }
        },
        remove: async (paths: string[]) => {
          state.removed.push({ bucket, paths })
          return { data: paths.map((name) => ({ name })), error: null }
        },
      }),
    },
  }),
}))
vi.mock('@/lib/auth/roles', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/auth/roles')>()),
  getUserRole: async (email: string | null | undefined) => (email === 'editor@example.com' || email === 'other@example.com' ? 'editor' : null),
}))
vi.mock('@/lib/database', () => ({
  db: new Proxy({}, { get: (_t, prop) => (state.fake.db as Record<string | symbol, unknown>)[prop] }),
}))
const invalidateFileOwner = vi.hoisted(() => vi.fn(async (..._args: unknown[]) => { state.fake.events.push('invalidate') }))
vi.mock('@/lib/services/files', () => ({ invalidateFileOwner }))
const reportError = vi.hoisted(() => vi.fn(async (..._args: unknown[]) => {}))
vi.mock('@/lib/observability/report-error', () => ({ reportError }))

import { completeUpload, signUpload } from '@/lib/actions/uploads'

const PENDING_ID = '0b7c6f0e-3c2a-4b8e-9d4f-1a2b3c4d5e6f'
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'

const SIGN = { showId: 7, fileName: 'Opener.mp3', mimeType: 'audio/mpeg', size: 1000, kind: 'audio' as const, isPublic: true }

const pendingRow = (overrides: Record<string, unknown> = {}) => ({
  id: PENDING_ID,
  bucket: 'Bright Designs',
  path: 'files/shows/7/audio/1d2c3b4a-0000-4000-8000-000000000001.mp3',
  expectedMime: 'audio/mpeg',
  expectedSize: 1000,
  showId: 7,
  arrangementId: null,
  kind: 'audio',
  isPublic: true,
  originalName: 'Opener.mp3',
  description: null,
  displayOrder: 0,
  createdBy: 'editor@example.com',
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 60_000),
  ...overrides,
})

function uploadsDb(overrides: Partial<Record<string, (op: Op) => unknown[]>> = {}): Respond {
  return (op) => {
    const custom = overrides[`${op.kind}:${op.table}`]
    if (custom) return custom(op)
    if (op.kind === 'select' && op.table === 'shows') return [{ id: 7 }]
    if (op.kind === 'select' && op.table === 'show_arrangements') return [{ arrangementId: 3 }]
    if (op.kind === 'insert' && op.table === 'pending_uploads') return [{ id: PENDING_ID }]
    if (op.kind === 'select' && op.table === 'pending_uploads') return [pendingRow()]
    if (op.kind === 'insert' && op.table === 'files') {
      const v = op.values as { url: string; showId: number | null; arrangementId: number | null }
      return [{ id: 12, url: v.url, showId: v.showId, arrangementId: v.arrangementId }]
    }
    if (op.kind === 'update' && op.table === 'files') return [{ id: 12, url: op.set?.url, showId: 7, arrangementId: null }]
    return []
  }
}

function use(respond: Respond) {
  state.fake = createFakeDb(respond)
  return state.fake
}

beforeEach(() => {
  state.email = 'editor@example.com'
  state.signed = []
  state.signError = null
  state.listed = { size: 1000, mimetype: 'audio/mpeg' }
  state.listCalls = []
  state.removed = []
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co')
  invalidateFileOwner.mockClear()
  reportError.mockClear()
  use(uploadsDb())
})

describe('signUpload', () => {
  it('records the pending upload and signs a server-built path in the public bucket', async () => {
    const fake = state.fake
    const result = await signUpload(SIGN)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.pendingId).toBe(PENDING_ID)
    expect(result.data.bucket).toBe('Bright Designs')
    expect(result.data.path).toMatch(new RegExp(`^files/shows/7/audio/${UUID}\\.mp3$`))
    expect(result.data.token).toBe('t')
    expect(state.signed).toEqual([{ bucket: 'Bright Designs', path: result.data.path }])

    const [insert] = opsOn(fake.ops, 'pending_uploads', 'insert')
    expect(insert.values).toMatchObject({
      bucket: 'Bright Designs',
      path: result.data.path,
      expectedMime: 'audio/mpeg',
      expectedSize: 1000,
      showId: 7,
      arrangementId: null,
      kind: 'audio',
      isPublic: true,
      originalName: 'Opener.mp3',
      createdBy: 'editor@example.com',
    })
    // The pending row exists before the URL is signed.
    expect(fake.events.indexOf('insert:pending_uploads')).toBeGreaterThan(-1)
  })

  it('a private part upload goes to the private bucket under the part', async () => {
    const result = await signUpload({ ...SIGN, arrangementId: 3, isPublic: false, kind: 'score', mimeType: 'application/pdf' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.bucket).toBe('private')
    expect(result.data.path).toMatch(new RegExp(`^files/shows/7/arrangements/3/score/${UUID}\\.pdf$`))
  })

  it('never takes the extension or any path from the file name', async () => {
    const result = await signUpload({ ...SIGN, fileName: '../../x/evil.html' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.path).not.toContain('..')
    expect(result.data.path).toMatch(/\.mp3$/)
    expect(opsOn(state.fake.ops, 'pending_uploads', 'insert')[0].values).toMatchObject({ originalName: 'evil.html' })
  })

  it('rejects an oversize file and an unknown MIME type before touching anything', async () => {
    const fake = state.fake
    expect(await signUpload({ ...SIGN, size: 100 * 1024 * 1024 + 1 })).toMatchObject({ ok: false, error: 'invalid' })
    expect(await signUpload({ ...SIGN, kind: 'image', mimeType: 'image/png', size: 10 * 1024 * 1024 + 1 })).toMatchObject({ ok: false, error: 'invalid' })
    expect(await signUpload({ ...SIGN, mimeType: 'text/html' })).toMatchObject({ ok: false, error: 'invalid' })
    expect(await signUpload({ ...SIGN, kind: 'other', mimeType: 'application/octet-stream' })).toMatchObject({ ok: false, error: 'invalid' })
    expect(fake.ops).toHaveLength(0)
    expect(state.signed).toEqual([])
  })

  it('rejects client-supplied storage fields (strict schema)', async () => {
    expect(await signUpload({ ...SIGN, storagePath: 'shows/1/x.mp3' } as never)).toMatchObject({ ok: false, error: 'invalid' })
    expect(await signUpload({ ...SIGN, bucket: 'private' } as never)).toMatchObject({ ok: false, error: 'invalid' })
  })

  it('rejects an unknown show and a part that is not on the show', async () => {
    use(uploadsDb({ 'select:shows': () => [] }))
    expect(await signUpload(SIGN)).toMatchObject({ ok: false, error: 'invalid', issues: [{ path: 'showId' }] })
    const fake = use(uploadsDb({ 'select:show_arrangements': () => [] }))
    expect(await signUpload({ ...SIGN, arrangementId: 99 })).toMatchObject({ ok: false, error: 'invalid', issues: [{ path: 'arrangementId' }] })
    expect(opsOn(fake.ops, 'pending_uploads', 'insert')).toHaveLength(0)
    expect(state.signed).toEqual([])
  })

  it('a signing failure deletes the pending row: failed', async () => {
    state.signError = { message: 'nope' }
    const fake = state.fake
    expect(await signUpload(SIGN)).toEqual({ ok: false, error: 'failed' })
    expect(opsOn(fake.ops, 'pending_uploads', 'delete')).toHaveLength(1)
  })

  it('forbidden without a session', async () => {
    state.email = null
    expect(await signUpload(SIGN)).toEqual({ ok: false, error: 'forbidden' })
  })
})

describe('completeUpload', () => {
  it('missing, expired or someone else’s pending upload: not_found, nothing written', async () => {
    let fake = use(uploadsDb({ 'select:pending_uploads': () => [] }))
    expect(await completeUpload({ pendingId: PENDING_ID })).toEqual({ ok: false, error: 'not_found' })
    expect(opsOn(fake.ops, 'files', 'insert')).toHaveLength(0)

    fake = use(uploadsDb({ 'select:pending_uploads': () => [pendingRow({ expiresAt: new Date(Date.now() - 1) })] }))
    expect(await completeUpload({ pendingId: PENDING_ID })).toEqual({ ok: false, error: 'not_found' })
    expect(opsOn(fake.ops, 'files', 'insert')).toHaveLength(0)

    fake = use(uploadsDb({ 'select:pending_uploads': () => [pendingRow({ createdBy: 'other@example.com' })] }))
    expect(await completeUpload({ pendingId: PENDING_ID })).toEqual({ ok: false, error: 'not_found' })
    expect(state.listCalls).toEqual([])
  })

  it('a size mismatch removes the object and the pending row: invalid, no files row', async () => {
    state.listed = { size: 999_999, mimetype: 'audio/mpeg' }
    const fake = state.fake
    const result = await completeUpload({ pendingId: PENDING_ID })
    expect(result).toMatchObject({ ok: false, error: 'invalid', issues: [{ path: 'size' }] })
    expect(state.removed).toEqual([{ bucket: 'Bright Designs', paths: [pendingRow().path] }])
    expect(opsOn(fake.ops, 'pending_uploads', 'delete')).toHaveLength(1)
    expect(opsOn(fake.ops, 'files', 'insert')).toHaveLength(0)
    expect(invalidateFileOwner).not.toHaveBeenCalled()
  })

  it('a MIME mismatch is rejected the same way', async () => {
    state.listed = { size: 1000, mimetype: 'text/html' }
    expect(await completeUpload({ pendingId: PENDING_ID })).toMatchObject({ ok: false, error: 'invalid', issues: [{ path: 'mimeType' }] })
    expect(state.removed).toHaveLength(1)
  })

  it('no object yet: invalid, pending row kept for a retry', async () => {
    state.listed = null
    const fake = state.fake
    expect(await completeUpload({ pendingId: PENDING_ID })).toMatchObject({ ok: false, error: 'invalid' })
    expect(opsOn(fake.ops, 'pending_uploads', 'delete')).toHaveLength(0)
    expect(state.removed).toEqual([])
  })

  it('looks the object up by its exact key in its bucket', async () => {
    await completeUpload({ pendingId: PENDING_ID })
    expect(state.listCalls).toEqual([
      { bucket: 'Bright Designs', dir: 'files/shows/7/audio', search: '1d2c3b4a-0000-4000-8000-000000000001.mp3' },
    ])
  })

  it('public: inserts the row from the pending record with the public URL, deletes pending, invalidates after commit', async () => {
    const fake = state.fake
    const result = await completeUpload({ pendingId: PENDING_ID })
    const url = 'https://project.supabase.co/storage/v1/object/public/Bright%20Designs/files/shows/7/audio/1d2c3b4a-0000-4000-8000-000000000001.mp3'
    expect(result).toEqual({ ok: true, data: { id: 12, url, showId: 7, arrangementId: null } })
    const [insert] = opsOn(fake.ops, 'files', 'insert')
    expect(insert.values).toMatchObject({
      fileName: '1d2c3b4a-0000-4000-8000-000000000001.mp3',
      originalName: 'Opener.mp3',
      fileType: 'audio',
      fileSize: 1000,
      mimeType: 'audio/mpeg',
      url,
      storagePath: 'shows/7/audio/1d2c3b4a-0000-4000-8000-000000000001.mp3',
      showId: 7,
      isPublic: true,
    })
    expect(opsOn(fake.ops, 'pending_uploads', 'delete')).toHaveLength(1)
    expect(opsOn(fake.ops, 'pending_uploads', 'select')[0].lock).toBe('update')
    expect(invalidateFileOwner).toHaveBeenCalledWith({ id: 12, url, showId: 7, arrangementId: null })
    expect(fake.events.slice(-2)).toEqual(['commit', 'invalidate'])
  })

  it('private: the row’s url is its download route', async () => {
    const fake = use(uploadsDb({
      'select:pending_uploads': () => [pendingRow({ bucket: 'private', isPublic: false, path: 'files/shows/7/audio/1d2c3b4a-0000-4000-8000-000000000001.mp3' })],
    }))
    const result = await completeUpload({ pendingId: PENDING_ID })
    expect(result).toEqual({ ok: true, data: { id: 12, url: '/api/files/12/download', showId: 7, arrangementId: null } })
    expect(state.listCalls[0].bucket).toBe('private')
    expect(opsOn(fake.ops, 'files', 'insert')[0].values).toMatchObject({ isPublic: false })
    expect(opsOn(fake.ops, 'files', 'update')[0].set).toEqual({ url: '/api/files/12/download' })
    expect(invalidateFileOwner).toHaveBeenCalled()
  })

  it('a Storage lookup failure is failed and keeps the pending row', async () => {
    state.listed = 'error'
    const fake = state.fake
    expect(await completeUpload({ pendingId: PENDING_ID })).toEqual({ ok: false, error: 'failed' })
    expect(opsOn(fake.ops, 'pending_uploads', 'delete')).toHaveLength(0)
    expect(opsOn(fake.ops, 'files', 'insert')).toHaveLength(0)
  })

  it('rejects a malformed id', async () => {
    expect(await completeUpload({ pendingId: '../x' })).toMatchObject({ ok: false, error: 'invalid' })
  })
})
