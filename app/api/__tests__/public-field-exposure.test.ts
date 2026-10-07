import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * Public read endpoints must not leak internal fields. The fake database
 * below honours the `columns` projection the routes ask for, as Drizzle does,
 * so a route that selects everything fails here. The stored rows still carry
 * `copyrightAmountUsd` (as the table did before the column was dropped).
 */

let currentUser: { email: string } | null = null

vi.mock('@/lib/utils/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: currentUser }, error: null }) },
  }),
}))

type Row = Record<string, unknown>

const project = (row: Row, columns?: Record<string, boolean>): Row =>
  columns
    ? Object.fromEntries(Object.entries(row).filter(([k]) => columns[k] === true))
    : row

const SHOW: Row = {
  id: 7,
  title: 'Show',
  slug: 'show',
  thumbnailUrl: 't.png',
  graphicUrl: 'g.png',
  internalNotes: 'secret',
  price: '900.00',
}

const ARRANGEMENT: Row = {
  id: 1,
  title: 'Arr',
  composer: 'C',
  copyrightAmountUsd: '250.00',
  showArrangements: [{ orderIndex: 0, show: SHOW }],
  files: [],
  arrangementsToTags: [],
}

const applyOpts = (opts: { columns?: Record<string, boolean>; with?: Record<string, unknown> }) => {
  const out = project(ARRANGEMENT, opts.columns)
  const withShow = (opts.with as { showArrangements?: { with?: { show?: unknown } } })?.showArrangements?.with?.show
  out.showArrangements = [
    {
      orderIndex: 0,
      show: withShow === true ? SHOW : project(SHOW, (withShow as { columns?: Record<string, boolean> })?.columns),
    },
  ]
  out.files = []
  out.arrangementsToTags = []
  return out
}

const RESOURCES = [
  { id: 1, title: 'Live', isActive: true },
  { id: 2, title: 'Draft', isActive: false },
]
let requestedActiveOnly = false

vi.mock('drizzle-orm', async (orig) => {
  const actual = await orig<typeof import('drizzle-orm')>()
  return {
    ...actual,
    eq: (col: { name?: string }, val: unknown) =>
      col?.name === 'is_active' ? { activeFilter: val } : actual.eq(col as never, val as never),
  }
})

vi.mock('@/lib/database', () => ({
  db: {
    query: {
      arrangements: {
        findMany: async (opts: Parameters<typeof applyOpts>[0]) => [applyOpts(opts)],
        findFirst: async (opts: Parameters<typeof applyOpts>[0]) => applyOpts(opts),
      },
    },
    select: (fields?: unknown) => ({
      from: (table: { isActive?: unknown }) => {
        if (fields) return Promise.resolve([{ count: 1 }])
        const isResources = 'isActive' in table
        const run = (activeOnly: boolean) =>
          (isResources ? RESOURCES : []).filter((r) => !activeOnly || r.isActive)
        return {
          where: (cond: { activeFilter?: unknown }) => {
            requestedActiveOnly = cond?.activeFilter === true
            return { orderBy: async () => run(requestedActiveOnly) }
          },
          orderBy: async () => {
            requestedActiveOnly = false
            return run(false)
          },
        }
      },
    }),
  },
}))

beforeEach(() => {
  currentUser = null
  requestedActiveOnly = false
})

const hasKeyDeep = (value: unknown, key: string): boolean => {
  if (Array.isArray(value)) return value.some((v) => hasKeyDeep(v, key))
  if (value && typeof value === 'object') {
    return Object.entries(value).some(([k, v]) => k === key || hasKeyDeep(v, key))
  }
  return false
}

describe('GET /api/arrangements', () => {
  it('never returns copyrightAmountUsd on any row', async () => {
    const { GET } = await import('@/app/api/arrangements/route')
    const res = await GET(new Request('http://localhost/api/arrangements'))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(JSON.stringify(body)).toContain('"Arr"')
    expect(hasKeyDeep(body, 'copyrightAmountUsd')).toBe(false)
  })
})

describe('GET /api/arrangements/[id]', () => {
  it('never returns copyrightAmountUsd and projects the parent show', async () => {
    const { GET } = await import('@/app/api/arrangements/[id]/route')
    const res = await GET(new Request('http://localhost/api/arrangements/1'), {
      params: Promise.resolve({ id: '1' }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.title).toBe('Arr')
    expect(hasKeyDeep(body, 'copyrightAmountUsd')).toBe(false)
    const show = body.showArrangements[0].show
    expect(Object.keys(show).sort()).toEqual(['graphicUrl', 'id', 'thumbnailUrl', 'title'])
  })
})

describe('GET /api/resources', () => {
  const getResources = async (qs = '') => {
    const { GET } = await import('@/app/api/resources/route')
    return GET(new Request(`http://localhost/api/resources${qs}`) as never)
  }

  it('returns only active rows to an anonymous caller', async () => {
    const res = await getResources()
    const body = await res.json()
    expect(body.data.map((r: { id: number }) => r.id)).toEqual([1])
  })

  it('ignores ?all=true from an anonymous caller', async () => {
    const res = await getResources('?all=true')
    const body = await res.json()
    expect(body.data.map((r: { id: number }) => r.id)).toEqual([1])
  })

  it('ignores ?all=true from a signed-in non-staff caller', async () => {
    currentUser = { email: 'nobody@example.com' }
    const res = await getResources('?all=true')
    const body = await res.json()
    expect(body.data.map((r: { id: number }) => r.id)).toEqual([1])
  })

  it('returns inactive rows to staff with ?all=true, uncached', async () => {
    currentUser = { email: 'admin@brightdesigns.band' }
    const res = await getResources('?all=true')
    const body = await res.json()
    expect(body.data.map((r: { id: number }) => r.id)).toEqual([1, 2])
    expect(res.headers.get('cache-control')).toBe('private, no-store')
  })

  it('returns only active rows to staff without ?all=true', async () => {
    currentUser = { email: 'admin@brightdesigns.band' }
    const res = await getResources()
    const body = await res.json()
    expect(body.data.map((r: { id: number }) => r.id)).toEqual([1])
  })
})
