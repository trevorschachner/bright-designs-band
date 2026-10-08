import { z, ZodObject, type ZodTypeAny } from 'zod'
import { guard } from '@/lib/auth/guard'
import type { Permission } from '@/lib/auth/permissions'
import { db, type Database } from '@/lib/database'
import { PG_UNIQUE_VIOLATION, postgresCode } from '@/lib/database/errors'
import { reportError } from '@/lib/observability/report-error'
import { fail, invalid, ok, type ActionIssue, type ActionResult } from './result'

/**
 * The shape every content Server Action shares. See ./README.md.
 *
 *   const run = guarded('canManageTags', createTagSchema, async (data, { db }) => {
 *     const row = ...write...
 *     return { data: row, invalidate: invalidateTags }
 *   })
 *   export async function createTag(input: CreateTagInput) { return run(input) }
 *
 * 1. guard(permission): a Server Action is a public POST endpoint, so the page
 *    being admin-only protects nothing. No session or no permission is
 *    `forbidden`; an auth outage is `failed`.
 * 2. schema.safeParse(input): failures are `invalid` with field issues. The
 *    schema must be strict (unknown keys rejected); a non-strict object
 *    schema is refused when the action is defined.
 * 3. fn(data, { email, db }) → { data, invalidate? }. `fn` opens its own
 *    transaction when it needs one, so read-only actions do not pay for it.
 *    It does not call the invalidate helper itself: it returns it, and
 *    guarded runs it after fn resolves (after commit), outside the mapping.
 * 4. Anything thrown is mapped to the fixed ActionError vocabulary. The thrown
 *    message never reaches the browser: database messages carry SQL,
 *    constraint names and row values.
 */

export type ActionContext = { email: string; db: Database }

/**
 * What an action's `fn` returns: the data for the caller, and the cache
 * invalidation to run once the write has committed. `guarded` runs
 * `invalidate` after `fn` resolves and outside the error mapping: a failure
 * there is reported but the result is still `ok`, because the write happened.
 */
export type ActionOutcome<T> = { data: T; invalidate?: () => Promise<void> | void }

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

export { postgresCode }

/** Thrown error → ActionResult. Exported for tests. */
export async function toActionFailure(error: unknown, operation: string): Promise<ActionResult<never>> {
  if (error instanceof NotFoundError) return fail('not_found')
  if (error instanceof StaleError) return fail('stale')
  if (error instanceof InvalidError) return fail('invalid', error.issues)
  if (postgresCode(error) === PG_UNIQUE_VIOLATION) return fail('conflict')
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
  fn: (data: z.output<S>, ctx: ActionContext) => Promise<ActionOutcome<T>>,
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

    let outcome: ActionOutcome<T>
    try {
      outcome = await fn(parsed.data, { email: gate.email, db })
    } catch (error) {
      return toActionFailure(error, operation)
    }

    if (outcome.invalidate) {
      try {
        await outcome.invalidate()
      } catch (error) {
        // The write committed; a stale cache is reported, not turned into
        // a failure the caller would retry.
        console.error(`[${operation}] invalidation failed after commit.`)
        await reportError(error, { operation: `${operation}:invalidate`, degradedTo: 'ok with a stale cache' })
      }
    }
    return ok(outcome.data)
  }
}
