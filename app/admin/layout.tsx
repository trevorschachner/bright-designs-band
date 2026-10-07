import type React from 'react'
import { redirect } from 'next/navigation'
import { resolveAuthorization } from '@/lib/auth/authorization'
import { getUserRole } from '@/lib/auth/roles'
import { AdminNav } from '@/components/features/admin/AdminNav'

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
 *
 * Admin access is a row in `admin_users`, read on every request (no cross-
 * request cache), so a removed user is denied on their next request. A failed
 * lookup throws to the error boundary rather than redirecting: it is an
 * outage, not a denial.
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

  if (!email) redirect('/login')
  const role = await getUserRole(email)
  const result = resolveAuthorization(email, role, 'canAccessAdmin')
  if (result.status === 'unauthenticated') redirect('/login')
  if (result.status === 'forbidden') redirect('/')

  return (
    <>
      <AdminNav role={result.role} />
      {children}
    </>
  )
}
