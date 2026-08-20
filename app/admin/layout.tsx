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
  const { createClient } = await import('@/lib/utils/supabase/server')
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  const result = resolveAuthorization(data?.user?.email, 'canAccessAdmin')
  if (result.status === 'unauthenticated') redirect('/login')
  if (result.status === 'forbidden') redirect('/')

  return children
}
