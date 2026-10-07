'use server'

import { guard } from '@/lib/auth/guard'
import { listAdminUsersForAdmin, mutateAdminUsers, type AdminUserRow } from '@/lib/services/admin-users'
import {
  addAdminUserSchema,
  checkRemoveAdminUser,
  checkSetAdminUserRole,
  removeAdminUserSchema,
  setAdminUserRoleSchema,
  type AdminUserRuleViolation,
} from '@/lib/validation/admin-users'
import { fail, invalid, ok, type ActionResult } from './result'

/**
 * Owner-only management of the admin allowlist (/admin/users).
 *
 * Every action starts with guard('canManageUsers'): a server action is a
 * public POST endpoint, so the page being owner-only protects nothing here.
 * Rules: you cannot remove yourself, and the last owner can be neither
 * removed nor demoted. Errors are the fixed ActionResult vocabulary; the real
 * error is logged, never returned.
 */

async function gate(): Promise<{ email: string } | { denied: ActionResult<never> }> {
  const result = await guard('canManageUsers')
  if (result.denied) {
    return { denied: fail(result.denied.status >= 500 ? 'failed' : 'forbidden') }
  }
  return { email: result.email }
}

function ruleIssue(violation: Exclude<AdminUserRuleViolation, 'not_found'>): ActionResult<never> {
  const message =
    violation === 'self'
      ? 'You cannot remove yourself.'
      : 'There must always be at least one owner.'
  return fail('conflict', [{ path: 'email', message }])
}

function fromViolation(violation: AdminUserRuleViolation): ActionResult<never> {
  return violation === 'not_found' ? fail('not_found') : ruleIssue(violation)
}

export async function listAdminUsers(): Promise<ActionResult<AdminUserRow[]>> {
  const g = await gate()
  if ('denied' in g) return g.denied
  try {
    return ok(await listAdminUsersForAdmin())
  } catch (error) {
    console.error('listAdminUsers failed.', error)
    return fail('failed')
  }
}

export async function addAdminUser(input: { email: string; role: string }): Promise<ActionResult<AdminUserRow[]>> {
  const g = await gate()
  if ('denied' in g) return g.denied
  const parsed = addAdminUserSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)
  const { email, role } = parsed.data
  try {
    const inserted = await mutateAdminUsers((_current, writer) =>
      writer.insert({ email, role, addedBy: g.email.toLowerCase() })
    )
    if (!inserted) return fail('conflict', [{ path: 'email', message: 'That address already has access.' }])
    return ok(await listAdminUsersForAdmin())
  } catch (error) {
    console.error('addAdminUser failed.', error)
    return fail('failed')
  }
}

export async function setAdminUserRole(input: { email: string; role: string }): Promise<ActionResult<AdminUserRow[]>> {
  const g = await gate()
  if ('denied' in g) return g.denied
  const parsed = setAdminUserRoleSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)
  const { email, role } = parsed.data
  try {
    const violation = await mutateAdminUsers(async (current, writer) => {
      const problem = checkSetAdminUserRole(current, email, role)
      if (!problem) await writer.setRole(email, role)
      return problem
    })
    if (violation) return fromViolation(violation)
    return ok(await listAdminUsersForAdmin())
  } catch (error) {
    console.error('setAdminUserRole failed.', error)
    return fail('failed')
  }
}

export async function removeAdminUser(input: { email: string }): Promise<ActionResult<AdminUserRow[]>> {
  const g = await gate()
  if ('denied' in g) return g.denied
  const parsed = removeAdminUserSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)
  const { email } = parsed.data
  try {
    const violation = await mutateAdminUsers(async (current, writer) => {
      const problem = checkRemoveAdminUser(current, email, g.email)
      if (!problem) await writer.remove(email)
      return problem
    })
    if (violation) return fromViolation(violation)
    return ok(await listAdminUsersForAdmin())
  } catch (error) {
    console.error('removeAdminUser failed.', error)
    return fail('failed')
  }
}
