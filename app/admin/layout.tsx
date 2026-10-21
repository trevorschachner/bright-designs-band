import type React from 'react'
import { requireAdminPage } from '@/lib/auth/page-guard'
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
  const { role } = await requireAdminPage('canAccessAdmin')

  return (
    <>
      <AdminNav role={role} />
      {children}
    </>
  )
}
