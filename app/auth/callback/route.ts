import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth/roles'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'
  const error = searchParams.get('error')

  // Handle errors from OAuth providers
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}`)
  }

  // Handle email confirmation links
  if (token_hash && type) {
    return NextResponse.redirect(`${origin}/auth/confirm?token_hash=${token_hash}&type=${type}`)
  }

  // Handle OAuth callback
  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      const userRole = getUserRole(data.user.email || '')
      
      // Redirect based on user role
      if (userRole === 'staff' || userRole === 'admin') {
        // Staff and admin users go to admin dashboard
        return NextResponse.redirect(`${origin}/admin`)
      } else {
        // Regular users go to their intended destination or home
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // If there's an error or no code/token, redirect to login
  return NextResponse.redirect(`${origin}/login?error=Authentication failed`)
} 