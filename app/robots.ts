import type { MetadataRoute } from 'next'
import { getPublicSiteUrl } from '@/lib/env'
import { AI_CRAWLERS, BLOCKED_CRAWLERS } from '@/lib/seo/crawlers'

/**
 * /robots.txt: everyone may crawl the public site except SEO-tool scrapers.
 * No Crawl-delay. `/api/` and `/admin` are not pages: a crawler gains nothing
 * there. (`/api/export/*` is fetched by Google Sheets IMPORTDATA, which does
 * not read robots.txt, so it is unaffected.) A named group replaces `*` for
 * that agent, so the AI group repeats the disallows.
 */
const NOT_PAGES = ['/api/', '/admin']

export default function robots(): MetadataRoute.Robots {
  const base = getPublicSiteUrl().replace(/\/+$/, '')
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: NOT_PAGES },
      { userAgent: AI_CRAWLERS, allow: '/', disallow: NOT_PAGES },
      { userAgent: BLOCKED_CRAWLERS, disallow: '/' },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
