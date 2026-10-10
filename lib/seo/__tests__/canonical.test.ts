// lib/seo/__tests__/canonical.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

// next/font only works under the Next compiler; the root layout calls it at module scope.
vi.mock('next/font/google', () => ({
  Poppins: () => ({ variable: '', className: '' }),
}))

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://brightdesigns.band')
})

describe('generateMetadata canonical', () => {
  it('derives the canonical from path on the apex origin', async () => {
    const { generateMetadata } = await import('@/lib/seo/metadata')
    expect(generateMetadata({ title: 't', description: 'd', path: '/faqs' }).alternates?.canonical).toBe('https://brightdesigns.band/faqs')
    expect(generateMetadata({ title: 't', description: 'd', path: '/' }).alternates?.canonical).toBe('https://brightdesigns.band')
  })

  it('leaves canonical undefined when neither path nor canonical is given', async () => {
    const { generateMetadata } = await import('@/lib/seo/metadata')
    expect(generateMetadata({ title: 't', description: 'd' }).alternates?.canonical).toBeUndefined()
  })
})

describe('static routes', () => {
  // Every public route that exports a static `metadata`. Dynamic routes are
  // covered by their own page tests (shows, arrangements, collections, blog).
  const routes: Array<[string, string]> = [
    ['../../../app/layout', ''], // root layout must NOT set one (it would leak into every page)
    ['../../../app/page', '/'],
    ['../../../app/shows/layout', '/shows'],
    ['../../../app/arrangements/layout', '/arrangements'],
    ['../../../app/collections/page', '/collections'],
    ['../../../app/services/page', '/services'],
    ['../../../app/about/layout', '/about'],
    ['../../../app/process/page', '/process'],
    ['../../../app/faqs/page', '/faqs'],
    ['../../../app/contact/layout', '/contact'],
    ['../../../app/resources/page', '/resources'],
    ['../../../app/blog/page', '/blog'],
    ['../../../app/blog/how-to-choose-a-designer/page', '/blog/how-to-choose-a-designer'],
    ['../../../app/blog/case-studies/page', '/blog/case-studies'],
    ['../../../app/privacy/page', '/privacy'],
    ['../../../app/terms/page', '/terms'],
  ]
  for (const [mod, path] of routes) {
    it(`${path || 'root layout'} canonical`, async () => {
      const m = await import(mod)
      const canonical = m.metadata?.alternates?.canonical
      if (path === '') expect(canonical).toBeUndefined()
      else expect(canonical).toBe(path === '/' ? 'https://brightdesigns.band' : `https://brightdesigns.band${path}`)
    })
  }
})
