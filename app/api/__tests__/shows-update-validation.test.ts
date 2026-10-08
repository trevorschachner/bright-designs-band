import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * PUT /api/shows/[id] used to spread the request body into `.set()`, recompute
 * the slug from the title on every save, wipe the show's tags on every save and
 * fall back to a `slug LIKE` match that could hit the wrong show. DELETE
 * returned 200 for an id that matched nothing.
 *
 * The fake database below records what the route asks it to do and answers
 * lookups by honouring the `eq` predicates the route builds, so assertions are
 * about the writes the route issues, not about how it is written.
 */

let currentUser: { email: string } | null = { email: 'admin@brightdesigns.band' }

vi.mock('@/lib/utils/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: currentUser }, error: null }) },
  }),
}))

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: <T extends (...a: never[]) => unknown>(fn: T) => fn,
}))

type Pred = { col: string; val: unknown }
vi.mock('drizzle-orm', async (orig) => {
  const actual = await orig<typeof import('drizzle-orm')>()
  return { ...actual, eq: (col: { name: string }, val: unknown): Pred => ({ col: col.name, val }) }
})

type ShowRow = { id: number; slug: string; title: string }
let rows: ShowRow[] = []
let setPayloads: Record<string, unknown>[] = []
let tagDeletes: Pred[] = []
let tagInserts: { showId: number; tagId: number }[][] = []

const matches = (row: ShowRow, p: Pred) =>
  p.col === 'id' ? row.id === p.val : p.col === 'slug' ? row.slug === p.val : false

const tableName = (t: unknown) =>
  (t as Record<symbol, string>)[Symbol.for('drizzle:Name')]

const fakeDb = {
  select: () => ({
    from: () => ({
      where: (p: Pred) => ({ limit: async () => rows.filter((r) => matches(r, p)).map((r) => ({ id: r.id, slug: r.slug })) }),
    }),
  }),
  update: () => ({
    set: (payload: Record<string, unknown>) => {
      setPayloads.push(payload)
      return {
        where: (p: Pred) => ({
          returning: async () => {
            const row = rows.find((r) => matches(r, p))
            if (!row) return []
            Object.assign(row, payload)
            return [{ ...row }]
          },
        }),
      }
    },
  }),
  delete: (table: unknown) => ({
    where: (p: Pred) => {
      if (tableName(table) === 'shows_to_tags') {
        tagDeletes.push(p)
        return Promise.resolve()
      }
      return {
        returning: async () => {
          const gone = rows.filter((r) => matches(r, p))
          rows = rows.filter((r) => !matches(r, p))
          return gone
        },
      }
    },
  }),
  insert: () => ({
    values: async (v: { showId: number; tagId: number }[]) => {
      tagInserts.push(v)
    },
  }),
  transaction: async <T>(cb: (tx: unknown) => Promise<T>) => cb(fakeDb),
}

vi.mock('@/lib/database', () => ({ db: fakeDb }))

beforeEach(() => {
  currentUser = { email: 'admin@brightdesigns.band' }
  rows = [
    { id: 7, slug: 'the-show', title: 'The Show' },
    { id: 8, slug: 'other-show', title: 'Other Show' },
  ]
  setPayloads = []
  tagDeletes = []
  tagInserts = []
})

const put = async (id: string, body: unknown) => {
  const { PUT } = await import('@/app/api/shows/[id]/route')
  const req = new Request(`http://localhost/api/shows/${id}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  return PUT(req, { params: Promise.resolve({ id }) })
}

const del = async (id: string) => {
  const { DELETE } = await import('@/app/api/shows/[id]/route')
  return DELETE(new Request(`http://localhost/api/shows/${id}`, { method: 'DELETE' }), {
    params: Promise.resolve({ id }),
  })
}

/**
 * What the admin editor sends on auto-save, copied from `buildPayload()` and
 * `autoSave()` in app/admin/shows/[id]/page.tsx: every field normalised, plus
 * `tags` as the selected tag ids. `difficulty` is `''` when the select is on
 * "Select difficulty...", which is the common case for a show being drafted.
 */
const EDITOR_PAYLOAD = {
  title: 'The Show',
  description: null,
  difficulty: '',
  duration: '6:30',
  year: 2026,
  thumbnailUrl: null,
  featured: false,
  displayOrder: 0,
  youtubeUrl: null,
  commissioned: null,
  programCoordinator: 'Trevor Schachner',
  percussionArranger: null,
  soundDesigner: null,
  windArranger: 'Ryan Wilhite',
  drillWriter: null,
  tags: [3, 5],
}

describe('PUT /api/shows/[id] validation', () => {
  it('rejects an unknown key with 400 and a sanitized issue list', async () => {
    const res = await put('7', { title: 'X', internalNotes: 'nope' })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(Array.isArray(body.details)).toBe(true)
    for (const issue of body.details) expect(Object.keys(issue).sort()).toEqual(['message', 'path'])
    expect(setPayloads).toEqual([])
  })

  it('rejects id in the body', async () => {
    const res = await put('7', { id: 8, title: 'X' })
    expect(res.status).toBe(400)
    expect(setPayloads).toEqual([])
  })

  it('rejects createdAt in the body', async () => {
    const res = await put('7', { createdAt: '2020-01-01T00:00:00Z' })
    expect(res.status).toBe(400)
    expect(setPayloads).toEqual([])
  })

  it('rejects price in the body', async () => {
    const res = await put('7', { price: 1 })
    expect(res.status).toBe(400)
  })

  it('rejects a malformed slug', async () => {
    const res = await put('7', { slug: 'Bad Slug!' })
    expect(res.status).toBe(400)
    expect(setPayloads).toEqual([])
  })
})

describe('PUT /api/shows/[id] writes', () => {
  it('a title-only update leaves the slug untouched', async () => {
    const res = await put('7', { title: 'Renamed Show' })
    expect(res.status).toBe(200)
    expect(setPayloads).toHaveLength(1)
    expect(setPayloads[0]).not.toHaveProperty('slug')
    expect(setPayloads[0].title).toBe('Renamed Show')
    expect(rows.find((r) => r.id === 7)?.slug).toBe('the-show')
  })

  it('does not touch tags when tags is absent', async () => {
    const res = await put('7', { featured: true })
    expect(res.status).toBe(200)
    expect(tagDeletes).toEqual([])
    expect(tagInserts).toEqual([])
  })

  it('replaces tags when tags is present', async () => {
    const res = await put('7', { tags: [1, 2] })
    expect(res.status).toBe(200)
    expect(tagDeletes).toEqual([{ col: 'show_id', val: 7 }])
    expect(tagInserts).toEqual([[{ showId: 7, tagId: 1 }, { showId: 7, tagId: 2 }]])
  })

  it('clears tags when tags is an empty array', async () => {
    const res = await put('7', { tags: [] })
    expect(res.status).toBe(200)
    expect(tagDeletes).toHaveLength(1)
    expect(tagInserts).toEqual([])
  })

  it('applies a valid slug change', async () => {
    const res = await put('7', { slug: 'new-slug' })
    expect(res.status).toBe(200)
    expect(setPayloads[0].slug).toBe('new-slug')
    expect(rows.find((r) => r.id === 7)?.slug).toBe('new-slug')
  })

  it('returns 409 when the slug belongs to another show', async () => {
    const res = await put('7', { slug: 'other-show' })
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toBe('Slug is already in use')
    expect(setPayloads).toEqual([])
  })

  it('looks up by exact slug only, with no prefix fallback', async () => {
    expect((await put('the-show', { featured: true })).status).toBe(200)
    expect((await put('the', { featured: true })).status).toBe(404)
  })

  it('accepts the exact payload the admin editor auto-saves', async () => {
    const res = await put('7', EDITOR_PAYLOAD)
    expect(res.status).toBe(200)
    const { tags, difficulty, ...columns } = EDITOR_PAYLOAD
    void tags
    void difficulty
    expect(setPayloads[0]).toMatchObject({ ...columns, difficulty: null })
    expect(setPayloads[0]).not.toHaveProperty('slug')
    expect(tagInserts).toEqual([[{ showId: 7, tagId: 3 }, { showId: 7, tagId: 5 }]])
  })
})

describe('DELETE /api/shows/[id]', () => {
  it('returns 404 when nothing matched', async () => {
    const res = await del('999')
    expect(res.status).toBe(404)
    expect(rows).toHaveLength(2)
  })

  it('deletes by id', async () => {
    const res = await del('7')
    expect(res.status).toBe(200)
    expect(rows.map((r) => r.id)).toEqual([8])
  })
})
