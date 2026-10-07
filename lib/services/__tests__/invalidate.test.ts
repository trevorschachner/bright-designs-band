import { describe, it, expect, beforeEach, vi } from 'vitest'

import {
  invalidateShow,
  invalidateArrangement,
  invalidateTags,
  invalidatePieces,
  invalidateResources,
  invalidateCatalog,
} from '@/lib/services/invalidate'

const { revalidateTag, revalidatePath } = vi.hoisted(() => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}))
vi.mock('next/cache', () => ({ revalidateTag, revalidatePath }))

const tags = () => revalidateTag.mock.calls.map(([tag]) => tag)
const paths = () => revalidatePath.mock.calls.map(([path, type]) => (type ? `${path} (${type})` : path))

beforeEach(() => {
  revalidateTag.mockClear()
  revalidatePath.mockClear()
})

describe('every tag is expired immediately', () => {
  it('passes { expire: 0 }, never the single-argument form', () => {
    invalidateCatalog()
    expect(revalidateTag.mock.calls.length).toBeGreaterThan(0)
    for (const call of revalidateTag.mock.calls) expect(call[1]).toEqual({ expire: 0 })
  })
})

describe('invalidateShow', () => {
  it('expires the show and the list, its page, home, the catalog and the sitemap', () => {
    invalidateShow(7, 'apex')
    expect(tags()).toEqual(['show:7', 'shows'])
    expect(paths()).toEqual(['/shows/apex', '/', '/shows', '/sitemap.xml'])
  })

  it('drops the old URL too when the slug changed', () => {
    invalidateShow(7, 'apex-2', 'apex')
    expect(paths()).toEqual(['/shows/apex-2', '/shows/apex', '/', '/shows', '/sitemap.xml'])
  })

  it('does not repeat a slug that did not change, and copes with no slug', () => {
    invalidateShow(7, 'apex', 'apex')
    expect(paths()).toEqual(['/shows/apex', '/', '/shows', '/sitemap.xml'])
    revalidatePath.mockClear()
    invalidateShow(7, null)
    expect(paths()).toEqual(['/', '/shows', '/sitemap.xml'])
  })
})

describe('invalidateArrangement', () => {
  it('expires the arrangement and the list, its page, the parent show page, home, the list and the sitemap', () => {
    invalidateArrangement(12, 'apex')
    expect(tags()).toEqual(['arrangement:12', 'arrangements'])
    expect(paths()).toEqual(['/arrangements/12', '/shows/apex', '/', '/arrangements', '/sitemap.xml'])
  })

  it('works without a parent show', () => {
    invalidateArrangement(12)
    expect(paths()).toEqual(['/arrangements/12', '/', '/arrangements', '/sitemap.xml'])
  })
})

describe('invalidateTags and invalidatePieces', () => {
  it('tags: expire the tag list and every show and part page', () => {
    invalidateTags()
    expect(tags()).toEqual(['tags'])
    expect(paths()).toEqual([
      '/shows/[slug] (page)',
      '/arrangements/[id] (page)',
      '/',
      '/shows',
      '/arrangements',
      '/sitemap.xml',
    ])
  })

  it('pieces: expire the pieces tag and every show and part page', () => {
    invalidatePieces()
    expect(tags()).toEqual(['pieces'])
    expect(paths()).toContain('/shows/[slug] (page)')
    expect(paths()).toContain('/arrangements/[id] (page)')
  })
})

describe('invalidateResources', () => {
  it('expires resources, the resources page, home and the sitemap', () => {
    invalidateResources()
    expect(tags()).toEqual(['resources'])
    expect(paths()).toEqual(['/resources', '/', '/sitemap.xml'])
  })
})

describe('invalidateCatalog', () => {
  it('expires every list tag and the whole layout', () => {
    invalidateCatalog()
    expect(tags()).toEqual(['shows', 'arrangements', 'tags', 'pieces', 'resources'])
    expect(paths()).toEqual(['/ (layout)'])
  })
})
