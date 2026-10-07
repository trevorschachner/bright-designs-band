import { asc, sql } from 'drizzle-orm'
import { db } from '@/lib/database'
import { adminUsers } from '@/lib/database/schema'
import { toIso } from './cache'
import type { AdminRole } from '@/lib/auth/permissions'

/**
 * The admin allowlist (`admin_users`). Admin-only and uncached, like every
 * `...ForAdmin` read: callers have passed guard('canManageUsers').
 *
 * Writes go through `mutateAdminUsers`, which locks every row first so two
 * owners demoting each other at once cannot leave the table with no owner:
 * the second transaction waits, then sees the first one's result.
 */
export type AdminUserRow = {
  email: string
  role: AdminRole
  addedBy: string | null
  createdAt: string | null
}

const columns = {
  email: adminUsers.email,
  role: adminUsers.role,
  addedBy: adminUsers.addedBy,
  createdAt: adminUsers.createdAt,
}

type RawRow = { email: string; role: AdminRole; addedBy: string | null; createdAt: Date | string | null }

function toRow(row: RawRow): AdminUserRow {
  return { email: row.email.toLowerCase(), role: row.role, addedBy: row.addedBy, createdAt: toIso(row.createdAt) }
}

export async function listAdminUsersForAdmin(): Promise<AdminUserRow[]> {
  const rows = await db.select(columns).from(adminUsers).orderBy(asc(adminUsers.createdAt), asc(adminUsers.email))
  return rows.map(toRow)
}

export interface AdminUsersWriter {
  /** Inserts; returns false when the address is already present. */
  insert(row: { email: string; role: AdminRole; addedBy: string }): Promise<boolean>
  setRole(email: string, role: AdminRole): Promise<void>
  remove(email: string): Promise<void>
}

export async function mutateAdminUsers<T>(
  fn: (current: AdminUserRow[], writer: AdminUsersWriter) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    const current = (await tx.select(columns).from(adminUsers).for('update')).map(toRow)
    const byEmail = sql`lower(${adminUsers.email})`
    const writer: AdminUsersWriter = {
      async insert(row) {
        const inserted = await tx
          .insert(adminUsers)
          .values(row)
          .onConflictDoNothing()
          .returning({ email: adminUsers.email })
        return inserted.length > 0
      },
      async setRole(email, role) {
        await tx.update(adminUsers).set({ role }).where(sql`${byEmail} = ${email}`)
      },
      async remove(email) {
        await tx.delete(adminUsers).where(sql`${byEmail} = ${email}`)
      },
    }
    return fn(current, writer)
  })
}
