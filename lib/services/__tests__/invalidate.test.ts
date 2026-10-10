import { describe, it, expect, beforeEach, vi } from 'vitest'

import { collections } from '@/lib/collections'
import {
  invalidateShow,
  invalidateArrangement,
  invalidateTags,
  invalidatePieces,
  invalidateResources,
} from '@/lib/services/invalidate'

const { revalidateTag, revalidatePath } = vi.hoisted(() => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}))
vi.mock('next/cache', () => ({ revalidateTag, revalidatePath }))

// Prerendered collection landing pages, named because one built without a
// database holds no tagged read to expire.
const COLLECTIONS = collections.map((c) => `/collections/${c.slug}`)

const tags = () => revalidateTag.mock.calls.map(([tag]) => tag)
const paths = () => revalidatePath.mock.calls.map(([path, type]) => (type ? `${path} (${type})` : path))

beforeEach(() => {
  revalidateTag.mockClear()
  revalidatePath.mockClear()
})

describe('every tag is expired immediately', () => {
  it('passes { expire: 0 }, never the single-argument form', () => {
    invalidateShow(1, 'a')
    invalidateArrangement(2, 'pipeline', 'a')
    invalidateTags()
    invalidatePieces()
    invalidateResources()
    expect(revalidateTag.mock.calls.length).toBeGreaterThan(0)
    for (const call of revalidateTag.mock.calls) expect(call[1]).toEqual({ expire: 0 })
  })
})

describe('invalidateShow', () => {
  it('expires the show and the list, its page, home, the catalog and the sitemap', () => {
    invalidateShow(7, 'apex')
    expect(tags()).toEqual(['show:7', 'shows'])
    expect(paths()).toEqual(['/shows/apex', '/', '/shows', '/sitemap.xml', '/llms.txt', '/llms-full.txt', '/collections', ...COLLECTIONS])
  })

  it('drops the old URL too when the slug changed', () => {
    invalidateShow(7, 'apex-2', 'apex')
    expect(paths()).toEqual(['/shows/apex-2', '/shows/apex', '/', '/shows', '/sitemap.xml', '/llms.txt', '/llms-full.txt', '/collections', ...COLLECTIONS])
  })

  it('does not repeat a slug that did not change, and copes with no slug', () => {
    invalidateShow(7, 'apex', 'apex')
    expect(paths()).toEqual(['/shows/apex', '/', '/shows', '/sitemap.xml', '/llms.txt', '/llms-full.txt', '/collections', ...COLLECTIONS])
    revalidatePath.mockClear()
    invalidateShow(7, null)
    expect(paths()).toEqual(['/', '/shows', '/sitemap.xml', '/llms.txt', '/llms-full.txt', '/collections', ...COLLECTIONS])
  })
})

describe('invalidateArrangement', () => {
  it('expires the arrangement and the list, its page, the parent show page, home, the list and the sitemap', () => {
    invalidateArrangement(12, 'pipeline', 'apex')
    expect(tags()).toEqual(['arrangement:12', 'arrangements'])
    expect(paths()).toEqual(['/arrangements/pipeline', '/shows/apex', '/', '/arrangements', '/sitemap.xml'])
  })

  it('works without a parent show', () => {
    invalidateArrangement(12, 'pipeline')
    expect(paths()).toEqual(['/arrangements/pipeline', '/', '/arrangements', '/sitemap.xml'])
  })

  it('drops the old URL too when the slug changed', () => {
    invalidateArrangement(12, 'pipeline-2', 'apex', 'pipeline')
    expect(paths()).toEqual(['/arrangements/pipeline-2', '/arrangements/pipeline', '/shows/apex', '/', '/arrangements', '/sitemap.xml'])
  })
})

describe('invalidateTags and invalidatePieces', () => {
  it('tags: expire the tag list and every show and part page', () => {
    invalidateTags()
    expect(tags()).toEqual(['tags'])
    expect(paths()).toEqual([
      '/shows/[slug] (page)',
      '/arrangements/[slug] (page)',
      '/',
      '/shows',
      '/arrangements',
      '/sitemap.xml',
      '/collections',
      ...COLLECTIONS,
    ])
  })

  it('pieces: expire the pieces tag and every show and part page', () => {
    invalidatePieces()
    expect(tags()).toEqual(['pieces'])
    expect(paths()).toContain('/shows/[slug] (page)')
    expect(paths()).toContain('/arrangements/[slug] (page)')
  })
})

describe('invalidateResources', () => {
  it('expires resources, the resources page, home and the sitemap', () => {
    invalidateResources()
    expect(tags()).toEqual(['resources'])
    expect(paths()).toEqual(['/resources', '/', '/sitemap.xml'])
  })
})
