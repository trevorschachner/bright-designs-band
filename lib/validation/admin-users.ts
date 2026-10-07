import { z } from 'zod'
import { ADMIN_ROLES, type AdminRole } from '@/lib/auth/permissions'

/**
 * Admin allowlist payloads and the rules that protect it.
 *
 * Emails are trimmed and lower-cased before validation, so the table never
 * holds two spellings of one address (the column is citext as well).
 */
const email = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
  z.string().email('Enter a valid email address').max(320, 'Email is too long')
)
const role = z.enum(ADMIN_ROLES, { errorMap: () => ({ message: 'Role must be owner or editor' }) })

export const addAdminUserSchema = z.object({ email, role })
export const setAdminUserRoleSchema = z.object({ email, role })
export const removeAdminUserSchema = z.object({ email })

export type AddAdminUserInput = z.infer<typeof addAdminUserSchema>
export type SetAdminUserRoleInput = z.infer<typeof setAdminUserRoleSchema>
export type RemoveAdminUserInput = z.infer<typeof removeAdminUserSchema>

export type AdminUserRef = { email: string; role: AdminRole }

export type AdminUserRuleViolation = 'not_found' | 'self' | 'last_owner'

/** Removing `target`: never yourself, never the last owner. */
export function checkRemoveAdminUser(
  current: AdminUserRef[],
  target: string,
  callerEmail: string
): AdminUserRuleViolation | null {
  const row = current.find((r) => r.email.toLowerCase() === target)
  if (!row) return 'not_found'
  if (target === callerEmail.toLowerCase()) return 'self'
  if (row.role === 'owner' && current.filter((r) => r.role === 'owner').length <= 1) return 'last_owner'
  return null
}

/** Changing `target`'s role: never demote the last owner. */
export function checkSetAdminUserRole(
  current: AdminUserRef[],
  target: string,
  nextRole: AdminRole
): AdminUserRuleViolation | null {
  const row = current.find((r) => r.email.toLowerCase() === target)
  if (!row) return 'not_found'
  if (row.role === 'owner' && nextRole !== 'owner' && current.filter((r) => r.role === 'owner').length <= 1) {
    return 'last_owner'
  }
  return null
}
