import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * GET /api/files/<id>/download: staff only, 302 to a 60 s signed URL in the
 * bucket the row lives in.
 */

const state = vi.hoisted(() => ({
  user: null as { email: string } | null,
  row: null as { storagePath: string; url: string; fileType: string } | null,
  signed: [] as { bucket: string; path: string; ttl: number }[],
  dbTouched: false,
}))

vi.mock('@/lib/utils/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user }, error: null }) },
    storage: {
      from: (bucket: string) => ({
        createSignedUrl: async (path: string, ttl: number) => {
          state.signed.push({ bucket, path, ttl })
          return { data: { signedUrl: `https://project.supabase.co/storage/v1/object/sign/${bucket}/${path}?token=s` }, error: null }
        },
      }),
    },
  }),
}))
vi.mock('@/lib/auth/roles', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/auth/roles')>()),
  getUserRole: async (email?: string | null) => (email === 'admin@brightdesigns.band' ? 'editor' : null),
}))
vi.mock('@/lib/database', () => ({
  db: {
    select: () => {
      state.dbTouched = true
      return { from: () => ({ where: () => ({ limit: async () => (state.row ? [state.row] : []) }) }) }
    },
  },
}))

import { GET } from '@/app/api/files/[id]/download/route'

const get = (id = '12') => GET(new Request(`http://localhost/api/files/${id}/download`) as never, { params: Promise.resolve({ id }) })

beforeEach(() => {
  state.user = null
  state.row = { storagePath: 'shows/7/score/a.pdf', url: '/api/files/12/download', fileType: 'score' }
  state.signed = []
  state.dbTouched = false
})

describe('GET /api/files/[id]/download', () => {
  it('anonymous: 401, no lookup, no signed URL', async () => {
    const res = await get()
    expect(res.status).toBe(401)
    expect(state.dbTouched).toBe(false)
    expect(state.signed).toEqual([])
  })

  it('signed in without a role: 403', async () => {
    state.user = { email: 'nobody@example.com' }
    expect((await get()).status).toBe(403)
    expect(state.signed).toEqual([])
  })

  it('staff: 302 to a 60 s signed URL in the private bucket, uncached', async () => {
    state.user = { email: 'admin@brightdesigns.band' }
    const res = await get()
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('https://project.supabase.co/storage/v1/object/sign/private/files/shows/7/score/a.pdf?token=s')
    expect(res.headers.get('cache-control')).toBe('private, no-store')
    expect(state.signed).toEqual([{ bucket: 'private', path: 'files/shows/7/score/a.pdf', ttl: 60 }])
  })

  it('a not-yet-migrated private row (public URL) is signed in the public bucket', async () => {
    state.user = { email: 'admin@brightdesigns.band' }
    state.row = { storagePath: 'shows/7/score/a.pdf', url: 'https://project.supabase.co/storage/v1/object/public/Bright%20Designs/files/shows/7/score/a.pdf', fileType: 'score' }
    expect((await get()).status).toBe(302)
    expect(state.signed[0].bucket).toBe('Bright Designs')
  })

  it('staff: 404 for a missing row or a YouTube link, 400 for a bad id', async () => {
    state.user = { email: 'admin@brightdesigns.band' }
    state.row = null
    expect((await get()).status).toBe(404)
    state.row = { storagePath: 'x', url: 'https://youtu.be/x', fileType: 'youtube' }
    expect((await get()).status).toBe(404)
    expect((await get('abc')).status).toBe(400)
  })
})
