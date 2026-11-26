import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createFakeDb, opsOn, type Op, type Respond } from './fake-db'

/**
 * setPerusalScore against the recording fake of the Drizzle client and a
 * mocked server Supabase client (auth for guard(), storage for removing the
 * previous slot file).
 */

const state = vi.hoisted(() => ({
  email: 'editor@example.com' as string | null,
  fake: null as unknown as ReturnType<typeof import('./fake-db').createFakeDb>,
  removed: [] as { bucket: string; paths: string[] }[],
  removeError: null as { message: string } | null,
}))

vi.mock('@/lib/utils/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.email ? { email: state.email } : null }, error: null }) },
    storage: {
      from: (bucket: string) => ({
        remove: async (paths: string[]) => {
          state.removed.push({ bucket, paths })
          if (state.removeError) return { data: null, error: state.removeError }
          return { data: paths.map((name) => ({ name })), error: null }
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
vi.mock('@/lib/observability/report-error', () => ({ reportError: vi.fn(async () => {}) }))

import { setPerusalScore } from '@/lib/actions/files'

const UPLOADED = new Date('2026-11-26T10:00:00.000Z')
const NEW_SCORE = {
  id: 41,
  arrangementId: 9,
  fileType: 'score',
  mimeType: 'application/pdf',
  isPublic: false,
  url: '/api/files/41/download',
  originalName: 'Opener full score.pdf',
  createdAt: UPLOADED,
}
const OLD_SCORE = {
  id: 40,
  storagePath: 'shows/7/arrangements/9/score/old.pdf',
  url: '/api/files/40/download',
  fileType: 'score',
  showId: 7,
  arrangementId: 9,
}

/** The slot currently holds `current`; the new file is `file`. */
function slotDb(file: Record<string, unknown> | null, current: number | null = OLD_SCORE.id): Respond {
  return (op: Op) => {
    if (op.kind === 'select' && op.table === 'files') {
      // First lookup (in the transaction) is the new file; the second (after) is the previous one.
      return op.inTransaction ? (file ? [file] : []) : [OLD_SCORE]
    }
    if (op.kind === 'select' && op.table === 'arrangements') return [{ perusalScoreFileId: current }]
    return []
  }
}

const use = (respond: Respond) => (state.fake = createFakeDb(respond))

let consoleError: ReturnType<typeof vi.spyOn>
beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  state.email = 'editor@example.com'
  state.removed = []
  state.removeError = null
  invalidateFileOwner.mockClear()
})
afterEach(() => consoleError.mockRestore())

describe('setPerusalScore', () => {
  it('points the slot at the new file, then removes the previous file from the private bucket', async () => {
    const fake = use(slotDb(NEW_SCORE))
    const result = await setPerusalScore({ arrangementId: 9, fileId: 41 })
    expect(result).toEqual({
      ok: true,
      data: { arrangementId: 9, file: { id: 41, originalName: 'Opener full score.pdf', createdAt: UPLOADED.toISOString() }, previousRemoved: true },
    })

    const [lock] = opsOn(fake.ops, 'arrangements', 'select')
    expect(lock.lock).toBe('update')
    const [update] = opsOn(fake.ops, 'arrangements', 'update')
    expect(update.set).toEqual({ perusalScoreFileId: 41 })
    expect(update.inTransaction).toBe(true)

    expect(state.removed).toEqual([{ bucket: 'private', paths: ['files/shows/7/arrangements/9/score/old.pdf'] }])
    expect(opsOn(fake.ops, 'files', 'delete')).toHaveLength(1)
    expect(invalidateFileOwner).toHaveBeenCalledWith({ arrangementId: 9 })
    // The slot commits before the old file goes, and invalidation comes last.
    expect(fake.events.indexOf('commit')).toBeLessThan(fake.events.indexOf('delete:files'))
    expect(fake.events.at(-1)).toBe('invalidate')
  })

  it('does not bump the part updated_at (an open part form must not go stale)', async () => {
    const fake = use(slotDb(NEW_SCORE))
    await setPerusalScore({ arrangementId: 9, fileId: 41 })
    expect(opsOn(fake.ops, 'arrangements', 'update')[0].set).not.toHaveProperty('updatedAt')
  })

  it('fills an empty slot without removing anything', async () => {
    const fake = use(slotDb(NEW_SCORE, null))
    const result = await setPerusalScore({ arrangementId: 9, fileId: 41 })
    expect(result.ok && result.data.previousRemoved).toBe(true)
    expect(state.removed).toEqual([])
    expect(opsOn(fake.ops, 'files', 'delete')).toHaveLength(0)
  })

  it('setting the file the slot already holds removes nothing', async () => {
    use(slotDb(NEW_SCORE, 41))
    expect((await setPerusalScore({ arrangementId: 9, fileId: 41 })).ok).toBe(true)
    expect(state.removed).toEqual([])
  })

  it('keeps the new slot and reports it when Storage refuses to remove the previous file', async () => {
    state.removeError = { message: 'denied' }
    const fake = use(slotDb(NEW_SCORE))
    const result = await setPerusalScore({ arrangementId: 9, fileId: 41 })
    expect(result.ok && result.data.previousRemoved).toBe(false)
    expect(opsOn(fake.ops, 'arrangements', 'update')).toHaveLength(1)
    expect(opsOn(fake.ops, 'files', 'delete')).toHaveLength(0)
  })

  it.each([
    ['a public file', { isPublic: true }],
    ['a private row still in the public bucket', { url: 'https://cdn.example/files/a.pdf' }],
    ['an image score', { mimeType: 'image/png' }],
    ['an audio file', { fileType: 'audio', mimeType: 'audio/mpeg' }],
  ])('refuses %s: invalid, nothing written', async (_label, override) => {
    const fake = use(slotDb({ ...NEW_SCORE, ...override }))
    const result = await setPerusalScore({ arrangementId: 9, fileId: 41 })
    expect(result).toMatchObject({ ok: false, error: 'invalid' })
    expect(opsOn(fake.ops, 'arrangements', 'update')).toHaveLength(0)
    expect(state.removed).toEqual([])
    expect(invalidateFileOwner).not.toHaveBeenCalled()
  })

  it('refuses a file on another part, or no file: not_found', async () => {
    use(slotDb({ ...NEW_SCORE, arrangementId: 10 }))
    expect(await setPerusalScore({ arrangementId: 9, fileId: 41 })).toEqual({ ok: false, error: 'not_found' })
    use(slotDb(null))
    expect(await setPerusalScore({ arrangementId: 9, fileId: 41 })).toEqual({ ok: false, error: 'not_found' })
  })

  it('rejects unknown keys', async () => {
    use(slotDb(NEW_SCORE))
    expect(await setPerusalScore({ arrangementId: 9, fileId: 41, isPublic: true } as never)).toMatchObject({ ok: false, error: 'invalid' })
  })
})
