import { cache } from 'react'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/database'
import { adminUsers } from '@/lib/database/schema'
import { isAdminRole, permissionsFor, type AdminRole, type Permission, type UserPermissions } from './permissions'

export {
  ADMIN_ROLES,
  ROLE_PERMISSIONS,
  NO_PERMISSIONS,
  permissionsFor,
  roleHasPermission,
  type AdminRole,
  type Permission,
  type UserPermissions,
} from './permissions'

/**
 * Who is an admin: a row in `admin_users` (owner or editor), nothing else.
 *
 * This replaced a rule that made every @brightdesigns.band address staff. The
 * lookup reads the database on every request; `React.cache` only dedupes it
 * within one render, so a role change or removal applies on the next request.
 * Never put this behind the Next data cache: a cached "yes" would outlive a
 * removal.
 *
 * Fails closed. If the table does not exist yet (the migration has not been
 * applied) the answer is "no role", logged once, never a fallback to the old
 * domain rule. Any other database error is thrown: callers treat it as a
 * failure (500), not as a denial a person could mistake for being removed.
 */

const UNDEFINED_TABLE = '42P01'
let reportedMissingTable = false

function isUndefinedTable(error: unknown): boolean {
  // drizzle wraps driver errors in DrizzleQueryError with the postgres error as `cause`.
  for (let e: unknown = error, depth = 0; e && depth < 4; depth++) {
    if ((e as { code?: unknown }).code === UNDEFINED_TABLE) return true
    e = (e as { cause?: unknown }).cause
  }
  return false
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

const lookupRole = cache(async (normalizedEmail: string): Promise<AdminRole | null> => {
  let rows: { role: string }[]
  try {
    rows = await db
      .select({ role: adminUsers.role })
      .from(adminUsers)
      .where(sql`lower(${adminUsers.email}::text) = ${normalizedEmail}`)
      .limit(1)
  } catch (error) {
    if (isUndefinedTable(error)) {
      if (!reportedMissingTable) {
        reportedMissingTable = true
        console.error(
          'admin_users table is missing (apply drizzle/migrations/2026-10-08_admin_users.sql). ' +
            'Denying all admin access until it exists.'
        )
      }
      return null
    }
    throw error
  }
  const role = rows[0]?.role
  return isAdminRole(role) ? role : null
})

export async function getUserRole(email: string | null | undefined): Promise<AdminRole | null> {
  if (!email) return null
  const normalized = normalizeEmail(email)
  if (!normalized) return null
  return lookupRole(normalized)
}

export async function getUserPermissions(email: string | null | undefined): Promise<UserPermissions> {
  return permissionsFor(await getUserRole(email))
}

export async function requirePermission(email: string | null | undefined, permission: Permission): Promise<boolean> {
  return (await getUserPermissions(email))[permission]
}
