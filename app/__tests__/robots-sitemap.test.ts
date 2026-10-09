import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/services/sitemap', () => ({
  getSitemapEntries: vi.fn(async () => ({
    shows: [{ slug: 'true-north', updatedAt: '2026-09-01T00:00:00.000Z' }],
    arrangements: [{ slug: 'pipeline', updatedAt: '2026-09-02T00:00:00.000Z' }],
  })),
}))

import robots from '../robots'
import sitemap from '../sitemap'
import { AI_CRAWLERS } from '@/lib/seo/crawlers'
import { collections } from '@/lib/collections'

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://brightdesigns.band')
})

describe('robots', () => {
  it('keeps every crawler out of /api/ and /admin', () => {
    const { rules } = robots()
    const list = Array.isArray(rules) ? rules : [rules]
    for (const rule of list.filter((r) => r.allow === '/')) {
      expect(rule.disallow).toEqual(['/api/', '/admin'])
    }
    expect(list.find((r) => r.userAgent === '*')?.disallow).toEqual(['/api/', '/admin'])
  })

  it('allows every AI crawler explicitly', () => {
    const { rules } = robots()
    const list = Array.isArray(rules) ? rules : [rules]
    const allowed = list.filter((r) => r.allow === '/').flatMap((r) => (Array.isArray(r.userAgent) ? r.userAgent : [r.userAgent]))
    for (const agent of ['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'Claude-Web', 'PerplexityBot', 'Google-Extended', 'Bingbot', 'Applebot']) {
      expect(allowed).toContain(agent)
    }
    expect(AI_CRAWLERS).toHaveLength(8)
    expect(allowed).toContain('*')
  })

  it('blocks the SEO scrapers, sets the apex sitemap and no crawl delay', () => {
    const result = robots()
    const list = Array.isArray(result.rules) ? result.rules : [result.rules]
    expect(list.find((r) => r.disallow === '/')?.userAgent).toEqual(['AhrefsBot', 'MJ12bot'])
    expect(list.some((r) => 'crawlDelay' in r)).toBe(false)
    expect(result.sitemap).toBe('https://brightdesigns.band/sitemap.xml')
  })
})

describe('sitemap', () => {
  it('lists static pages, collections, shows, arrangements and blog posts', async () => {
    const entries = await sitemap()
    const urls = entries.map((e) => e.url)
    expect(urls).toContain('https://brightdesigns.band')
    expect(urls).toContain('https://brightdesigns.band/faqs')
    expect(urls).toContain(`https://brightdesigns.band/collections/${collections[0].slug}`)
    expect(urls.filter((u) => u.includes('/collections/'))).toHaveLength(collections.length)
    expect(urls).toContain('https://brightdesigns.band/shows/true-north')
    expect(urls).toContain('https://brightdesigns.band/arrangements/pipeline')
    expect(urls).toContain('https://brightdesigns.band/blog/how-to-choose-a-designer')
    expect(urls).toContain('https://brightdesigns.band/blog/case-studies/dorman')
    expect(new Set(urls).size).toBe(urls.length)
  })

  it('carries lastModified where known', async () => {
    const entries = await sitemap()
    expect(entries.find((e) => e.url.endsWith('/shows/true-north'))?.lastModified).toBe('2026-09-01T00:00:00.000Z')
    expect(entries.find((e) => e.url.endsWith('/blog/how-to-choose-a-designer'))?.lastModified).toBe('2025-01-15')
  })
})
