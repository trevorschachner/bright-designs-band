import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseConfig, shouldSkipSupabase } from '@/lib/env'

export async function proxy(request: NextRequest) {
  const response = NextResponse.next()
  
  // 1. Handle Code Exchange Redirect
  // If Supabase sends users to the site root (or any non-callback path) with a ?code= param,
  // normalize the request to our callback route so session exchange always works.
  const incomingUrl = new URL(request.url)
  if (incomingUrl.searchParams.get('code') && !request.nextUrl.pathname.startsWith('/auth/callback')) {
    const target = new URL('/auth/callback', request.url)
    target.search = incomingUrl.search
    return NextResponse.redirect(target)
  }

  if (shouldSkipSupabase()) {
    return response
  }

  // 2. Legacy Redirect: /shows/:id -> /shows/:slug
  // Only attempt if env vars are present and valid (not placeholders)
  const { url: supabaseUrl, key: supabaseKey } = getSupabaseConfig()
  const isValidConfig = Boolean(supabaseUrl && supabaseKey)

  const showsMatch = request.nextUrl.pathname.match(/^\/shows\/(\d+)(?:\/)?$/)
  if (showsMatch && isValidConfig) {
    const id = parseInt(showsMatch[1], 10)
    if (Number.isFinite(id)) {
      try {
        // Use direct fetch to avoid importing @supabase/ssr in Edge Middleware
        const queryUrl = `${supabaseUrl}/rest/v1/shows?id=eq.${id}&select=slug`
        const res = await fetch(queryUrl, {
          headers: {
            'apikey': supabaseKey!,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          // Cache this lookup briefly to improve performance
          next: { revalidate: 60 }
        })
        
        if (res.ok) {
          const data = await res.json()
          if (data && data.length > 0 && data[0]?.slug) {
            return NextResponse.redirect(new URL(`/shows/${data[0].slug}`, request.url), 308)
          }
        }
      } catch (error) {
        console.error('Middleware redirect error:', error)
      }
    }
  }

  // 3. Auth Protection for /admin
  // Simple check for auth cookie presence to avoid importing Supabase client in Edge Middleware.
  // The standard Supabase auth cookie format is `sb-<project-ref>-auth-token`.
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const allCookies = request.cookies.getAll()
    const hasAuthCookie = allCookies.some(cookie => 
      cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
    )

    if (!hasAuthCookie) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
