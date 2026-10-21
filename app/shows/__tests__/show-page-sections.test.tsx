import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

const makeShow = (programNotes: string) => ({
  show: { id: 1, slug: 'apex', title: 'Apex', description: 'Card blurb.', year: 2025, difficulty: 'Intermediate', duration: '7:30', programNotes, ensembleSize: 'medium', includes: 'winds, percussion', commissioned: 'Ola High School', youtubeUrl: null, graphicUrl: null, thumbnailUrl: null, createdAt: '2026-01-01T00:00:00.000Z' },
  showsToTags: [{ tag: { id: 1, name: 'Theme: Nature' } }],
})
const NOTES = 'A wolf-pack show for Ola High School (2025).\n\nWho it suits\nBands of 40 to 90 winds.\n\nStaging\nThe pack forms a wedge.'
let current = makeShow(NOTES)

vi.mock('@/lib/services/shows', () => ({
  getShowBySlug: vi.fn(async () => current),
  getShowArrangements: vi.fn(async () => [{ id: 10, title: 'Hungry Like the Wolf', scene: 'Opener', audioUrl: null, slug: 'hungry-like-the-wolf' }]),
  getPublicShowFiles: vi.fn(async () => []),
  getAllShowSlugs: vi.fn(async () => ['apex']),
  getSlugRedirect: vi.fn(async () => null),
  getRelatedShows: vi.fn(async () => []),
  getCollectionCounts: vi.fn(async () => ({ 'grade-3-marching-band-shows': 2 })),
}))
vi.mock('@/lib/services/pieces', () => ({ getPublicPiecesByArrangementIds: vi.fn(async () => ({ 10: [{ title: 'Hungry Like the Wolf', composer: 'Duran Duran' }] })) }))

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://brightdesigns.band')
  current = makeShow(NOTES)
})

describe('show page', () => {
  it('does not render program notes, question headings or a FAQPage', async () => {
    const { default: Page } = await import('../[slug]/page')
    const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ slug: 'apex' }) }))
    expect(html).not.toContain('What is Apex about?')
    expect(html).not.toContain('Who is Apex for?')
    expect(html).not.toContain('The pack forms a wedge.')
    expect(html).not.toContain('"@type":"FAQPage"')
  })
  it('keeps the facts: school, composers, duration schema and collection links', async () => {
    const { default: Page } = await import('../[slug]/page')
    const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ slug: 'apex' }) }))
    expect(html).toContain('Written for Ola High School, 2025')
    expect(html).toContain('Duran Duran')
    expect(html).toContain('"duration":"PT7M30S"')
    expect(html).toContain('/collections/grade-3-marching-band-shows')
    expect(html).toContain('What&#x27;s Included')
  })
  it('renders What\'s Included once, after the arrangements (last on mobile)', async () => {
    const { default: Page } = await import('../[slug]/page')
    const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ slug: 'apex' }) }))
    const included = html.indexOf('What&#x27;s Included')
    expect(html.lastIndexOf('What&#x27;s Included')).toBe(included)
    expect(included).toBeGreaterThan(html.indexOf('Show Arrangements'))
  })
})
