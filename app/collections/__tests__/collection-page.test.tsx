import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

const show = (id: number, title: string) => ({ id, title, slug: title.toLowerCase().replace(/\s+/g, '-'), description: 'd', year: 2025, difficulty: 'Beginner', duration: '7:00', thumbnailUrl: null, graphicUrl: null, featured: false, createdAt: null, showsToTags: [], arrangements: [] })
vi.mock('@/lib/services/shows', () => ({
  getShowsByFilter: vi.fn(async (f: { difficulty?: string }) => (f.difficulty === 'Beginner' ? [show(1, 'Ride the Wave'), show(2, 'Excalibur')] : [])),
  getCollectionCounts: vi.fn(async () => ({ 'easy-marching-band-shows': 2 })),
}))
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('NOT_FOUND') } }))
beforeEach(() => vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://brightdesigns.band'))

describe('/collections/[slug]', () => {
  it('renders intro, shows, FAQ schema, ItemList and self-canonical', async () => {
    const { default: Page, generateMetadata } = await import('../[slug]/page')
    const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ slug: 'easy-marching-band-shows' }) }))
    expect(html).toContain('Ride the Wave')
    expect(html).toContain('"@type":"FAQPage"')
    expect(html).toContain('"@type":"ItemList"')
    expect(html).toContain('"@type":"CollectionPage"')
    expect(html).toContain('Questions directors ask')
    expect(html).toContain('quoted per program')
    expect(html).not.toContain('no extra cost')
    const m = await generateMetadata({ params: Promise.resolve({ slug: 'easy-marching-band-shows' }) })
    expect(m.alternates?.canonical).toBe('https://brightdesigns.band/collections/easy-marching-band-shows')
  })
  it('404s a collection under the publish threshold', async () => {
    const { default: Page } = await import('../[slug]/page')
    await expect(Page({ params: Promise.resolve({ slug: 'indoor-winds-shows' }) })).rejects.toThrow('NOT_FOUND')
  })
})
