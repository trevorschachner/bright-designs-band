import { NextResponse } from 'next/server'
import { generateSitemapXML, staticRoutes, getDynamicRoutes } from '@/lib/seo/sitemap'
import { getPublicSiteUrl } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const baseUrl = getPublicSiteUrl()
    
    // Combine static and dynamic routes
    const dynamicRoutes = await getDynamicRoutes()
    const allRoutes = [...staticRoutes, ...dynamicRoutes]
    
    // Add current date to routes that don't have lastmod
    const routesWithDates = allRoutes.map(route => ({
      ...route,
      lastmod: route.lastmod || new Date().toISOString().split('T')[0]
    }))
    
    const sitemapXML = generateSitemapXML(routesWithDates, baseUrl)
    
    return new NextResponse(sitemapXML, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600' // Cache for 1 day
      }
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return new NextResponse('Error generating sitemap', { status: 500 })
  }
}