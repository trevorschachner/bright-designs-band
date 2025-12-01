import { createClient } from '@/lib/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth/roles'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/'
  const nextPath = rawNext.startsWith('/') ? rawNext : '/'
  const isAdminPath = nextPath.startsWith('/admin')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const userRole = getUserRole(data.user.email || '')

      // Redirect based on user role and requested next path
      const isPrivileged = userRole === 'staff' || userRole === 'admin'
      const targetPath = isPrivileged
        ? (isAdminPath ? nextPath : '/admin')
        : (isAdminPath ? '/' : nextPath)

      return NextResponse.redirect(`${origin}${targetPath}`)
    } else if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message || 'Authentication failed')}`)
    }
  }

  // If there's no code, redirect to login
  return NextResponse.redirect(`${origin}/login?error=Authentication failed`)
} 