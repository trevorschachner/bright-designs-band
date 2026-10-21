import type { ZodError } from 'zod'

/**
 * The one return shape for server actions.
 *
 * Errors are a fixed vocabulary, never a database or exception message: those
 * can carry SQL, constraint names or row data, and an action's return value is
 * serialised straight to the browser. Log the real error server-side.
 */
export type ActionError = 'forbidden' | 'invalid' | 'not_found' | 'conflict' | 'stale' | 'failed'

export type ActionIssue = { path: string; message: string }

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError; issues?: ActionIssue[] }

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data }
}

export function fail(error: ActionError, issues?: ActionIssue[]): { ok: false; error: ActionError; issues?: ActionIssue[] } {
  return issues ? { ok: false, error, issues } : { ok: false, error }
}

/** zod issues → `invalid`, with field paths and zod's (schema-authored) messages only. */
export function invalid(error: ZodError): { ok: false; error: 'invalid'; issues: ActionIssue[] } {
  return {
    ok: false,
    error: 'invalid',
    issues: error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
  }
}

const DEFAULT_TEXT: Record<ActionError, string> = {
  forbidden: 'You do not have permission to make this change. Try signing in again.',
  invalid: 'Check the highlighted fields.',
  not_found: 'This was deleted by someone else. Reload the page.',
  conflict: 'That value is already used.',
  stale: 'Someone else changed this. Reload to see their changes.',
  failed: 'Something went wrong. Try again.',
}

/**
 * A failed action in words for the person using the admin. Author-written
 * issues win (all of them, joined); otherwise the screen's own wording for
 * the error, else the default. Client-safe.
 */
export function actionMessage(
  result: { ok: false; error: ActionError; issues?: ActionIssue[] },
  overrides: Partial<Record<ActionError, string>> = {}
): string {
  if (result.issues?.length) return result.issues.map((issue) => issue.message).join('; ')
  return overrides[result.error] ?? DEFAULT_TEXT[result.error]
}
