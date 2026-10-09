import type { MetadataRoute } from 'next'
import { getSitemapEntries } from '@/lib/services/sitemap'
import { collections } from '@/lib/collections'
import { BLOG_POSTS, CASE_STUDIES } from '@/lib/blog/posts'
import { getPublicSiteUrl } from '@/lib/env'

/**
 * /sitemap.xml. Shows and arrangements come from the cached sitemap read
 * (tags `shows` + `arrangements`, expired by every show/arrangement write via
 * lib/services/invalidate.ts); collections and blog posts are static config.
 */
export const revalidate = 3600

const STATIC_PAGES: { path: string; changeFrequency: 'weekly' | 'monthly' | 'yearly'; priority: number }[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1.0 },
  { path: '/shows', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/arrangements', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/collections', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/services', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/process', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/faqs', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/resources', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/blog', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.2 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getPublicSiteUrl().replace(/\/+$/, '')
  const url = (path: string) => (path === '/' ? base : `${base}${path}`)
  const { shows, arrangements } = await getSitemapEntries()

  const posts = [...BLOG_POSTS, ...CASE_STUDIES]

  return [
    ...STATIC_PAGES.map(({ path, changeFrequency, priority }) => ({ url: url(path), changeFrequency, priority })),
    ...collections.map((c) => ({
      url: url(`/collections/${c.slug}`),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...shows.map((s) => ({
      url: url(`/shows/${s.slug}`),
      ...(s.updatedAt ? { lastModified: s.updatedAt } : {}),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...arrangements.map((a) => ({
      url: url(`/arrangements/${a.slug}`),
      ...(a.updatedAt ? { lastModified: a.updatedAt } : {}),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...posts.map((p) => ({
      url: url(p.href),
      lastModified: p.dateModified ?? p.datePublished,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]
}
