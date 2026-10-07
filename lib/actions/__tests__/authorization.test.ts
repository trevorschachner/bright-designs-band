import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * Every exported Server Action refuses a caller without a session, a signed-in
 * caller with no admin role, and a cookie session the auth server rejects:
 * `forbidden`, before any database access.
 *
 * A Server Action is a public POST endpoint, so this replaces
 * app/api/__tests__/write-route-authorization.test.ts for the writes that
 * moved here. The actions are enumerated from the modules' exports, so a new
 * action is covered the moment it is exported.
 */

const state = vi.hoisted(() => ({
  user: null as { email: string } | null,
  authServerRejects: false,
  dbTouched: [] as string[],
}))

vi.mock('@/lib/utils/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getUser: async () =>
        state.authServerRejects
          ? { data: { user: null }, error: { message: 'invalid JWT' } }
          : { data: { user: state.user }, error: null },
      getSession: async () => ({ data: { session: state.user ? { user: state.user } : null }, error: null }),
    },
  }),
}))
// Only admin@brightdesigns.band has an admin_users row.
vi.mock('@/lib/auth/roles', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/auth/roles')>()),
  getUserRole: async (email?: string | null) => (email === 'admin@brightdesigns.band' ? 'owner' : null),
}))
vi.mock('@/lib/database', () => ({
  db: new Proxy(
    {},
    {
      get: (_t, prop) => {
        state.dbTouched.push(String(prop))
        throw new Error(`database touched before the permission check (${String(prop)})`)
      },
    }
  ),
}))
vi.mock('@/lib/observability/report-error', () => ({ reportError: vi.fn(async () => {}) }))

const MODULES = {
  shows: () => import('@/lib/actions/shows'),
  tags: () => import('@/lib/actions/tags'),
  resources: () => import('@/lib/actions/resources'),
  arrangements: () => import('@/lib/actions/arrangements'),
  pieces: () => import('@/lib/actions/pieces'),
  files: () => import('@/lib/actions/files'),
  'admin-users': () => import('@/lib/actions/admin-users'),
}

type Action = (...args: unknown[]) => Promise<unknown>

async function allActions(): Promise<[string, Action][]> {
  const entries: [string, Action][] = []
  for (const [file, load] of Object.entries(MODULES)) {
    for (const [name, value] of Object.entries(await load())) {
      if (typeof value === 'function') entries.push([`${file}.${name}`, value as Action])
    }
  }
  return entries
}

// Whatever the signature, guard() runs before the input is parsed.
const call = (action: Action) => action({ id: 1, showId: 1, arrangementId: 1, title: 'x', name: 'x' }, true)

beforeEach(() => {
  state.user = null
  state.authServerRejects = false
  state.dbTouched = []
})

describe('every Server Action is gated on permission', () => {
  it('finds the actions (guards against an empty enumeration)', async () => {
    const names = (await allActions()).map(([name]) => name)
    expect(names).toEqual(
      expect.arrayContaining([
        'shows.updateShow',
        'arrangements.reorderArrangements',
        'arrangements.setArrangementPieces',
        'files.deleteFile',
        'files.attachYouTube',
        'pieces.createPiece',
        'tags.deleteTag',
        'resources.updateResource',
      ])
    )
    expect(names.length).toBeGreaterThanOrEqual(25)
  })

  it('without a session: forbidden, no database access', async () => {
    for (const [name, action] of await allActions()) {
      expect([name, await call(action)]).toEqual([name, { ok: false, error: 'forbidden' }])
    }
    expect(state.dbTouched).toEqual([])
  })

  it('signed in with no admin role (including a company address not on the list): forbidden', async () => {
    for (const email of ['nobody@example.com', 'former-staff@brightdesigns.band']) {
      state.user = { email }
      for (const [name, action] of await allActions()) {
        expect([name, await call(action)]).toEqual([name, { ok: false, error: 'forbidden' }])
      }
    }
    expect(state.dbTouched).toEqual([])
  })

  it('a cookie session the auth server rejects is not a session', async () => {
    state.user = { email: 'admin@brightdesigns.band' }
    state.authServerRejects = true
    for (const [name, action] of await allActions()) {
      expect([name, await call(action)]).toEqual([name, { ok: false, error: 'forbidden' }])
    }
    expect(state.dbTouched).toEqual([])
  })
})
