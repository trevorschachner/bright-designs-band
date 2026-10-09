import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

const SHOW = {
  show: { id: 1, slug: 'apex', title: 'Apex', description: 'Card blurb.', year: 2025, difficulty: 'Intermediate', duration: '7:30', programNotes: 'A wolf-pack show for Ola High School (2025).\n\nWho it suits\nBands of 40 to 90 winds.', ensembleSize: 'medium', includes: 'winds, percussion', commissioned: 'Ola High School', youtubeUrl: null, graphicUrl: null, thumbnailUrl: null, createdAt: '2026-01-01T00:00:00.000Z' },
  showsToTags: [{ tag: { id: 1, name: 'Theme: Nature' } }],
}

vi.mock('@/lib/services/shows', () => ({
  getShowBySlug: vi.fn(async () => SHOW),
  getShowArrangements: vi.fn(async () => [{ id: 10, title: 'Hungry Like the Wolf', scene: 'Opener', audioUrl: null, slug: 'hungry-like-the-wolf' }]),
  getPublicShowFiles: vi.fn(async () => []),
  getAllShowSlugs: vi.fn(async () => ['apex']),
  getSlugRedirect: vi.fn(async () => null),
  getRelatedShows: vi.fn(async () => []),
}))
vi.mock('@/lib/services/pieces', () => ({ getPublicPiecesByArrangementIds: vi.fn(async () => ({ 10: [{ title: 'Hungry Like the Wolf', composer: 'Duran Duran' }] })) }))

beforeEach(() => vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://brightdesigns.band'))

describe('show page with program notes', () => {
  it('renders the question headings, the notes and a FAQPage schema', async () => {
    const { default: Page } = await import('../[slug]/page')
    const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ slug: 'apex' }) }))
    expect(html).toContain('What is Apex about?')
    expect(html).toContain('What music is in Apex?')
    expect(html).toContain('Who is Apex for?')
    expect(html).toContain('Bands of 40 to 90 winds.')
    expect(html).toContain('"@type":"FAQPage"')
    expect(html).toContain('"duration":"PT7M30S"')
    expect(html).toContain('/collections/grade-3-marching-band-shows')
  })
  it('renders no question headings or FAQPage when notes are empty', async () => {
    SHOW.show.programNotes = ''
    const { default: Page } = await import('../[slug]/page')
    const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ slug: 'apex' }) }))
    expect(html).not.toContain('What is Apex about?')
    expect(html).not.toContain('"@type":"FAQPage"')
  })
})
