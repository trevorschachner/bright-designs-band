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

// Static routes for the marching band website
export const staticRoutes: SitemapURL[] = [
  {
    loc: '/',
    changefreq: 'weekly',
    priority: 1.0
  },
  {
    loc: '/arrangements',
    changefreq: 'weekly', 
    priority: 0.9
  },
  {
    loc: '/shows',
    changefreq: 'weekly',
    priority: 0.9
  },
  {
    loc: '/about',
    changefreq: 'monthly',
    priority: 0.7
  },
  {
    loc: '/contact',
    changefreq: 'monthly',
    priority: 0.7
  },
  {
    loc: '/process',
    changefreq: 'monthly',
    priority: 0.6
  },
  {
    loc: '/guide',
    changefreq: 'monthly',
    priority: 0.6
  },
  {
    loc: '/faqs',
    changefreq: 'monthly',
    priority: 0.6
  }
]

// Function to get dynamic routes (arrangements, shows, etc.)
export async function getDynamicRoutes(): Promise<SitemapURL[]> {
  const routes: SitemapURL[] = []
  
  try {
    // Prefer Supabase to avoid bundling DB client in edge contexts
    const { createClient } = await import('@/lib/utils/supabase/server')
    const supabase = await createClient()

    // Shows (use slug)
    const { data: showRows } = await supabase
      .from('shows')
      .select('slug,updated_at')
      .order('updated_at', { ascending: false })
    if (Array.isArray(showRows)) {
      showRows.forEach((row: any) => {
        if (row?.slug) {
          routes.push({
            loc: `/shows/${row.slug}`,
            lastmod: row?.updated_at ? String(row.updated_at).split('T')[0] : undefined,
            changefreq: 'monthly',
            priority: 0.8,
          })
        }
      })
    }

    // Arrangements (keep id URLs for now)
    const { data: arrRows } = await supabase
      .from('arrangements')
      .select('id,updated_at')
      .order('updated_at', { ascending: false })
    if (Array.isArray(arrRows)) {
      arrRows.forEach((row: any) => {
        if (typeof row?.id === 'number') {
          routes.push({
            loc: `/arrangements/${row.id}`,
            lastmod: row?.updated_at ? String(row.updated_at).split('T')[0] : undefined,
            changefreq: 'monthly',
            priority: 0.8,
          })
        }
      })
    }
  } catch (error) {
    console.error('Error fetching dynamic routes for sitemap:', error)
  }
  
  return routes
}