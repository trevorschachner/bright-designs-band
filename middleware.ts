import { createClient } from '@/lib/utils/supabase/middleware'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // If Supabase sends users to the site root (or any non-callback path) with a ?code= param,
  // normalize the request to our callback route so session exchange always works.
  const incomingUrl = new URL(request.url)
  if (incomingUrl.searchParams.get('code') && !request.nextUrl.pathname.startsWith('/auth/callback')) {
    const target = new URL('/auth/callback', request.url)
    target.search = incomingUrl.search
    return NextResponse.redirect(target)
  }

  const { supabase, response } = createClient(request)

  // Legacy redirect: /shows/:id -> /shows/:slug
  const showsMatch = request.nextUrl.pathname.match(/^\/shows\/(\d+)(?:\/)?$/)
  if (showsMatch) {
    const id = parseInt(showsMatch[1], 10)
    if (Number.isFinite(id)) {
      try {
        const { data, error } = await supabase
          .from('shows')
          .select('slug')
          .eq('id', id)
          .single()
        if (data?.slug) {
          const target = new URL(`/shows/${data.slug}`, request.url)
          return NextResponse.redirect(target, 308)
        }
      } catch (e) {
        // fall through to default response on error
      }
    }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session && request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', request.url))
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
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 