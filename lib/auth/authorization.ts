import { roleHasPermission, type AdminRole, type Permission } from './permissions'

/**
 * The authorization decision, separated from how we obtained the identity and
 * the role.
 *
 * Routes previously collapsed "is there a session" into "is this person
 * allowed", so any signed-in account could edit or delete the catalogue.
 * Keeping the decision pure means it is testable, and keeping the three
 * outcomes distinct means routes return 401 and 403 correctly. The role is
 * looked up by the caller (guard(), the admin layout) via getUserRole().
 */
export type AuthorizationResult =
  | { status: 'unauthenticated' }
  | { status: 'forbidden'; email: string }
  | { status: 'authorized'; email: string; role: AdminRole }

export function resolveAuthorization(
  email: string | undefined | null,
  role: AdminRole | null | undefined,
  permission: Permission
): AuthorizationResult {
  if (!email) return { status: 'unauthenticated' }
  if (!role || !roleHasPermission(role, permission)) return { status: 'forbidden', email }
  return { status: 'authorized', email, role }
}
