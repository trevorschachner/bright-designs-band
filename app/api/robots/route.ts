import { NextResponse } from 'next/server'
import { generateRobotsTxt } from '@/lib/seo/sitemap'

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.brightdesigns.band'
    const robotsTxt = generateRobotsTxt(baseUrl)
    
    return new NextResponse(robotsTxt, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=86400' // Cache for 1 day
      }
    })
  } catch (error) {
    console.error('Error generating robots.txt:', error)
    return new NextResponse('Error generating robots.txt', { status: 500 })
  }
}