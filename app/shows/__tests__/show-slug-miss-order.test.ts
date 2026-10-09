import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * /shows/[slug] on a miss: exact slug → slug_redirects (308 to the renamed
 * show) → normalised slug (308) → notFound(). The services are mocked; the
 * order of lookups and the redirect target are what is checked.
 */

const calls = vi.hoisted(() => [] as string[])
const data = vi.hoisted(() => ({
  shows: {} as Record<string, unknown>,
  redirects: {} as Record<string, string>,
}))

vi.mock('@/lib/services/shows', () => ({
  getShowBySlug: vi.fn(async (slug: string) => {
    calls.push(`exact:${slug}`)
    return data.shows[slug] ?? null
  }),
  getSlugRedirect: vi.fn(async (slug: string) => {
    calls.push(`redirect:${slug}`)
    return data.redirects[slug] ?? null
  }),
  getShowArrangements: vi.fn(async () => []),
  getRelatedShows: vi.fn(async () => []),
  getPublicShowFiles: vi.fn(async () => []),
  getAllShowSlugs: vi.fn(async () => []),
}))
vi.mock('@/lib/services/pieces', () => ({ getPublicPiecesByArrangementIds: vi.fn(async () => new Map()) }))

vi.mock('next/navigation', () => ({
  notFound: () => {
    calls.push('notFound')
    throw new Error('NEXT_NOT_FOUND')
  },
  permanentRedirect: (url: string) => {
    calls.push(`308:${url}`)
    throw new Error('NEXT_REDIRECT')
  },
}))

import Page from '@/app/shows/[slug]/page'

const visit = (slug: string) => Page({ params: Promise.resolve({ slug }) })

beforeEach(() => {
  calls.length = 0
  data.shows = {}
  data.redirects = {}
})

describe('/shows/[slug] miss order', () => {
  it('an exact hit renders without consulting redirects', async () => {
    data.shows['live'] = {
      show: { id: 1, slug: 'live', title: 'Live', description: null, year: 2025, difficulty: null, duration: null, thumbnailUrl: null, graphicUrl: null, youtubeUrl: null, createdAt: null, updatedAt: null },
      showsToTags: [],
    }
    await visit('live')
    expect(calls).toEqual(['exact:live'])
  })

  it('a renamed show 308s to its current slug', async () => {
    data.redirects['old-name'] = 'new-name'
    await expect(visit('old-name')).rejects.toThrow('NEXT_REDIRECT')
    expect(calls).toEqual(['exact:old-name', 'redirect:old-name', '308:/shows/new-name'])
  })

  it('the redirect table wins over the normalised form', async () => {
    data.redirects['Old_Name'] = 'new-name'
    await expect(visit('Old_Name')).rejects.toThrow('NEXT_REDIRECT')
    expect(calls).toEqual(['exact:Old_Name', 'redirect:Old_Name', '308:/shows/new-name'])
  })

  it('with no redirect row, a non-canonical slug 308s to its normalised form', async () => {
    await expect(visit('Some_Show')).rejects.toThrow('NEXT_REDIRECT')
    expect(calls).toEqual(['exact:Some_Show', 'redirect:Some_Show', '308:/shows/some-show'])
  })

  it('a canonical slug with no show and no redirect is notFound', async () => {
    await expect(visit('nothing-here')).rejects.toThrow('NEXT_NOT_FOUND')
    expect(calls).toEqual(['exact:nothing-here', 'redirect:nothing-here', 'notFound'])
  })
})
