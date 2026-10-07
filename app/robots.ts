import type { MetadataRoute } from 'next'
import { getPublicSiteUrl } from '@/lib/env'
import { AI_CRAWLERS, BLOCKED_CRAWLERS } from '@/lib/seo/crawlers'

/** /robots.txt: everyone may crawl everything except SEO-tool scrapers. No Crawl-delay. */
export default function robots(): MetadataRoute.Robots {
  const base = getPublicSiteUrl().replace(/\/+$/, '')
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      { userAgent: AI_CRAWLERS, allow: '/' },
      { userAgent: BLOCKED_CRAWLERS, disallow: '/' },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
