import { z, ZodObject, type ZodTypeAny } from 'zod'
import { guard } from '@/lib/auth/guard'
import type { Permission } from '@/lib/auth/permissions'
import { db, type Database } from '@/lib/database'
import { reportError } from '@/lib/observability/report-error'
import { fail, invalid, ok, type ActionIssue, type ActionResult } from './result'

/**
 * The shape every content Server Action shares. See ./README.md.
 *
 *   const run = guarded('canManageTags', createTagSchema, async (data, { db }) => { ... })
 *   export async function createTag(input: CreateTagInput) { return run(input) }
 *
 * 1. guard(permission): a Server Action is a public POST endpoint, so the page
 *    being admin-only protects nothing. No session or no permission is
 *    `forbidden`; an auth outage is `failed`.
 * 2. schema.safeParse(input): failures are `invalid` with field issues. The
 *    schema must be strict (unknown keys rejected); a non-strict object
 *    schema is refused when the action is defined.
 * 3. fn(data, { email, db }). `fn` opens its own transaction when it needs
 *    one, so read-only actions do not pay for it, and calls its invalidate
 *    helper after the transaction resolves (after commit).
 * 4. Anything thrown is mapped to the fixed ActionError vocabulary. The thrown
 *    message never reaches the browser: database messages carry SQL,
 *    constraint names and row values.
 */

export type ActionContext = { email: string; db: Database }

/** The row the action targets does not exist (or no longer does). */
export class NotFoundError extends Error {
  constructor(what = 'row') {
    super(`${what} not found`)
    this.name = 'NotFoundError'
  }
}

/** The row changed since the caller loaded it (optimistic concurrency). */
export class StaleError extends Error {
  constructor(what = 'row') {
    super(`${what} changed since it was loaded`)
    this.name = 'StaleError'
  }
}

/**
 * Input that passed the schema but is still unusable (e.g. a title with no
 * characters a slug can be built from). Its issues are author-written, so
 * they are returned; nothing else about the error is.
 */
export class InvalidError extends Error {
  constructor(readonly issues: ActionIssue[]) {
    super('invalid input')
    this.name = 'InvalidError'
  }
}

/**
 * The Postgres SQLSTATE of an error, if any. drizzle-orm 0.44 wraps driver
 * errors in DrizzleQueryError, with the postgres-js error as `cause`, so the
 * code is looked for down the cause chain, not only on the error itself.
 */
export function postgresCode(error: unknown): string | null {
  let current: unknown = error
  for (let depth = 0; depth < 5 && current && typeof current === 'object'; depth++) {
    const code = (current as { code?: unknown }).code
    if (typeof code === 'string' && /^[0-9A-Z]{5}$/.test(code)) return code
    current = (current as { cause?: unknown }).cause
  }
  return null
}

const UNIQUE_VIOLATION = '23505'

/** Thrown error → ActionResult. Exported for tests. */
export async function toActionFailure(error: unknown, operation: string): Promise<ActionResult<never>> {
  if (error instanceof NotFoundError) return fail('not_found')
  if (error instanceof StaleError) return fail('stale')
  if (error instanceof InvalidError) return fail('invalid', error.issues)
  if (postgresCode(error) === UNIQUE_VIOLATION) return fail('conflict')
  await reportError(error, { operation, degradedTo: "ActionResult 'failed'" })
  return fail('failed')
}

/**
 * Optimistic concurrency: throws StaleError unless the stored `updated_at`
 * equals the one the caller submitted. Compared as instants, to the
 * millisecond (a JS Date's precision; Postgres keeps microseconds, but every
 * value the browser holds came through a Date).
 */
export function assertFresh(stored: Date | string | null, submitted: string, what?: string): void {
  const storedMs = stored === null ? NaN : new Date(stored).getTime()
  const submittedMs = new Date(submitted).getTime()
  if (Number.isNaN(storedMs) || storedMs !== submittedMs) throw new StaleError(what)
}

export function guarded<S extends ZodTypeAny, T>(
  permission: Permission,
  schema: S,
  fn: (data: z.output<S>, ctx: ActionContext) => Promise<T>,
  operation: string = fn.name || 'action'
): (input: unknown) => Promise<ActionResult<T>> {
  if (schema instanceof ZodObject && schema._def.unknownKeys !== 'strict') {
    throw new Error(`guarded(${operation}): the schema must be .strict()`)
  }

  return async (input: unknown) => {
    const gate = await guard(permission)
    if (gate.denied) return fail(gate.denied.status >= 500 ? 'failed' : 'forbidden')

    const parsed = schema.safeParse(input)
    if (!parsed.success) return invalid(parsed.error)

    try {
      return ok(await fn(parsed.data, { email: gate.email, db }))
    } catch (error) {
      return toActionFailure(error, operation)
    }
  }
}
