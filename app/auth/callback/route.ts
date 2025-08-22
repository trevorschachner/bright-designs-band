import { createClient } from '@/lib/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getUserRole } from '@/lib/auth/roles'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const userRole = getUserRole(data.user.email || '')

      // Redirect based on user role
      if (userRole === 'staff' || userRole === 'admin') {
        return NextResponse.redirect(`${origin}/admin`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // If there's an error or no code, redirect to login
  return NextResponse.redirect(`${origin}/login?error=Authentication failed`)
} 