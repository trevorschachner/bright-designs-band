'use server'

import { listAdminUsersForAdmin, mutateAdminUsers, type AdminUserRow } from '@/lib/services/admin-users'
import {
  addAdminUserSchema,
  checkRemoveAdminUser,
  checkSetAdminUserRole,
  removeAdminUserSchema,
  setAdminUserRoleSchema,
  type AdminUserRuleViolation,
} from '@/lib/validation/admin-users'
import { z } from 'zod'
import { ConflictError, guarded, NotFoundError } from './_guarded'
import type { ActionResult } from './result'

/**
 * Owner-only management of the admin allowlist (/admin/users).
 *
 * Every action runs through guarded('canManageUsers'): a server action is a
 * public POST endpoint, so the page being owner-only protects nothing here.
 * Rules: you cannot remove yourself, and the last owner can be neither
 * removed nor demoted. Each action returns the whole list after the write.
 * Nothing is invalidated: the allowlist is never on a public page.
 */

function throwViolation(violation: AdminUserRuleViolation): never {
  if (violation === 'not_found') throw new NotFoundError('admin user')
  const message =
    violation === 'self' ? 'You cannot remove yourself.' : 'There must always be at least one owner.'
  throw new ConflictError([{ path: 'email', message }])
}

const runListAdminUsers = guarded(
  'canManageUsers',
  z.object({}).strict(),
  async () => ({ data: await listAdminUsersForAdmin() }),
  'listAdminUsers'
)

export async function listAdminUsers(): Promise<ActionResult<AdminUserRow[]>> {
  return runListAdminUsers({})
}

const runAddAdminUser = guarded(
  'canManageUsers',
  addAdminUserSchema,
  async ({ email, role }, ctx) => {
    const inserted = await mutateAdminUsers((_current, writer) =>
      writer.insert({ email, role, addedBy: ctx.email.toLowerCase() })
    )
    if (!inserted) throw new ConflictError([{ path: 'email', message: 'That address already has access.' }])
    return { data: await listAdminUsersForAdmin() }
  },
  'addAdminUser'
)

export async function addAdminUser(input: { email: string; role: string }): Promise<ActionResult<AdminUserRow[]>> {
  return runAddAdminUser(input)
}

const runSetAdminUserRole = guarded(
  'canManageUsers',
  setAdminUserRoleSchema,
  async ({ email, role }) => {
    const violation = await mutateAdminUsers(async (current, writer) => {
      const problem = checkSetAdminUserRole(current, email, role)
      if (!problem) await writer.setRole(email, role)
      return problem
    })
    if (violation) throwViolation(violation)
    return { data: await listAdminUsersForAdmin() }
  },
  'setAdminUserRole'
)

export async function setAdminUserRole(input: { email: string; role: string }): Promise<ActionResult<AdminUserRow[]>> {
  return runSetAdminUserRole(input)
}

const runRemoveAdminUser = guarded(
  'canManageUsers',
  removeAdminUserSchema,
  async ({ email }, ctx) => {
    const violation = await mutateAdminUsers(async (current, writer) => {
      const problem = checkRemoveAdminUser(current, email, ctx.email)
      if (!problem) await writer.remove(email)
      return problem
    })
    if (violation) throwViolation(violation)
    return { data: await listAdminUsersForAdmin() }
  },
  'removeAdminUser'
)

export async function removeAdminUser(input: { email: string }): Promise<ActionResult<AdminUserRow[]>> {
  return runRemoveAdminUser(input)
}
