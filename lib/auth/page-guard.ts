import { redirect } from 'next/navigation'
import { authorize } from './guard'
import type { AdminRole, UserPermissions } from './roles'

/**
 * The gate for an admin page (and the admin layout): call it first, before any
 * read. Not signed in → /login; signed in without the permission → /;
 * an auth or role-lookup outage throws to the error boundary (it is not a
 * denial, and bouncing staff to /login during one would be wrong).
 *
 *   const { role } = await requireAdminPage('canManageTags')
 */
export async function requireAdminPage(
  permission: keyof UserPermissions,
  deniedTo: '/' | '/admin' = '/'
): Promise<{ email: string; role: AdminRole }> {
  const result = await authorize(permission)
  if (result.status === 'authorized') return { email: result.email, role: result.role }
  if (result.status === 'unauthenticated') redirect('/login')
  if (result.status === 'forbidden') redirect(deniedTo)
  throw new Error('Authorization unavailable')
}
