import type React from 'react'
import { redirect } from 'next/navigation'
import { resolveAuthorization } from '@/lib/auth/authorization'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const fetchCache = 'force-no-store'

/**
 * Server-side gate for the whole admin area.
 *
 * proxy.ts only checks that *some* Supabase auth cookie is present, so any
 * signed-up account could previously load every admin screen. The API routes
 * now refuse their writes, but the interface itself should not render at all
 * for someone without admin access.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let email: string | undefined
  try {
    const { createClient } = await import('@/lib/utils/supabase/server')
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    // Distinguish "not signed in" from "auth server unreachable": treating the
    // latter as unauthenticated would bounce signed-in staff to /login.
    if (error) throw error
    email = data?.user?.email
  } catch (error) {
    console.error('Admin auth lookup failed.', error)
    redirect('/login')
  }

  const result = resolveAuthorization(email, 'canAccessAdmin')
  if (result.status === 'unauthenticated') redirect('/login')
  if (result.status === 'forbidden') redirect('/')

  return children
}
