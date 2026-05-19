// Dynamic sitemap generation for better SEO crawling
export interface SitemapURL {
  loc: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

export function generateSitemapXML(urls: SitemapURL[], baseUrl: string): string {
  const urlset = urls.map(url => `
  <url>
    <loc>${baseUrl}${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>`
}

export function generateRobotsTxt(baseUrl: string): string {
  return `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml

# Specific instructions for search engines
User-agent: Googlebot
Allow: /

User-agent: Bingbot  
Allow: /

# Block unwanted bots
User-agent: AhrefsBot
Disallow: /

User-agent: MJ12bot
Disallow: /

# General rules
Crawl-delay: 1

# Important pages to prioritize
Allow: /arrangements
Allow: /shows
Allow: /about
Allow: /contact`
}

export const staticRoutes: SitemapURL[] = [
  { loc: '/', changefreq: 'weekly', priority: 1.0 },
  { loc: '/shows', changefreq: 'weekly', priority: 0.9 },
  { loc: '/arrangements', changefreq: 'weekly', priority: 0.9 },
  { loc: '/services', changefreq: 'monthly', priority: 0.8 },
  { loc: '/about', changefreq: 'monthly', priority: 0.7 },
  { loc: '/contact', changefreq: 'monthly', priority: 0.7 },
  { loc: '/process', changefreq: 'monthly', priority: 0.6 },
  { loc: '/resources', changefreq: 'weekly', priority: 0.6 },
  { loc: '/faqs', changefreq: 'monthly', priority: 0.6 },
  { loc: '/collections', changefreq: 'weekly', priority: 0.6 },
]

export async function getDynamicRoutes(): Promise<SitemapURL[]> {
  const routes: SitemapURL[] = []

  try {
    const { db } = await import('@/lib/database')
    const { shows, arrangements } = await import('@/lib/database/schema')
    const { desc } = await import('drizzle-orm')

    const [showRows, arrRows] = await Promise.all([
      db.select({ slug: shows.slug, updatedAt: shows.updatedAt }).from(shows).orderBy(desc(shows.updatedAt)),
      db.select({ id: arrangements.id }).from(arrangements),
    ])

    showRows.forEach(row => {
      if (row.slug) routes.push({
        loc: `/shows/${row.slug}`,
        lastmod: row.updatedAt ? String(row.updatedAt).split('T')[0] : undefined,
        changefreq: 'monthly',
        priority: 0.8,
      })
    })

    arrRows.forEach(row => {
      routes.push({ loc: `/arrangements/${row.id}`, changefreq: 'monthly', priority: 0.8 })
    })
  } catch (error) {
    console.error('Error fetching dynamic routes for sitemap:', error)
  }

  return routes
}