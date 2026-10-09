import { beforeEach, describe, expect, it, vi } from 'vitest'

const redirect = vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`) })
vi.mock('next/navigation', () => ({ permanentRedirect: redirect, notFound: () => { throw new Error('NOT_FOUND') } }))
vi.mock('@/lib/services/arrangements', () => ({
  getArrangementBySlug: vi.fn(async (slug: string) => (slug === 'pipeline' ? { id: 2, slug: 'pipeline', title: 'Pipeline', composer: 'The Chantays', description: null, files: [], pieces: [], show: null, grade: null, ensembleSize: null, durationSeconds: null, year: null, arranger: null, percussionArranger: null, scene: null, youtubeUrl: null, sampleScoreUrl: null } : null)),
  getArrangementSlugById: vi.fn(async (id: number) => (id === 2 ? 'pipeline' : null)),
}))

beforeEach(() => vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://brightdesigns.band'))

describe('/arrangements/[slug]', () => {
  it('308s a numeric id to its slug', async () => {
    const { default: Page } = await import('../[slug]/page')
    await expect(Page({ params: Promise.resolve({ slug: '2' }) })).rejects.toThrow('REDIRECT:/arrangements/pipeline')
  })
  it('404s an unknown numeric id without redirecting', async () => {
    const { default: Page } = await import('../[slug]/page')
    await expect(Page({ params: Promise.resolve({ slug: '999' }) })).rejects.toThrow('NOT_FOUND')
  })
  it('404s an unknown slug', async () => {
    const { default: Page } = await import('../[slug]/page')
    await expect(Page({ params: Promise.resolve({ slug: 'nope' }) })).rejects.toThrow('NOT_FOUND')
  })
  it('canonicalises to the slug URL', async () => {
    const { generateMetadata } = await import('../[slug]/page')
    const m = await generateMetadata({ params: Promise.resolve({ slug: 'pipeline' }) })
    expect(m.alternates?.canonical).toBe('https://brightdesigns.band/arrangements/pipeline')
  })
})
