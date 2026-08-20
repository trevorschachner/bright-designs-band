import { hasPermission, type UserPermissions } from './roles'

/**
 * The authorization decision, separated from how we obtained the identity.
 *
 * Routes previously collapsed "is there a session" into "is this person
 * allowed", so any signed-in account could edit or delete the catalogue.
 * Keeping the decision pure means it is testable, and keeping the three
 * outcomes distinct means routes return 401 and 403 correctly.
 */
export type AuthorizationResult =
  | { status: 'unauthenticated' }
  | { status: 'forbidden'; email: string }
  | { status: 'authorized'; email: string }

export function resolveAuthorization(
  email: string | undefined | null,
  permission: keyof UserPermissions
): AuthorizationResult {
  if (!email) return { status: 'unauthenticated' }
  if (!hasPermission(email, permission)) return { status: 'forbidden', email }
  return { status: 'authorized', email }
}
