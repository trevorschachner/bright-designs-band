import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import type { ActionError, ActionIssue } from '@/lib/actions/result'

/** What each action error means to the person editing. */
export const ERROR_TEXT: Record<ActionError, string> = {
  forbidden: 'You do not have permission to make this change. Try signing in again.',
  invalid: 'Check the highlighted fields.',
  not_found: 'This was deleted by someone else. Reload the page.',
  conflict: 'That value is already used.',
  stale: 'This show was changed by someone else. Reload to see their changes.',
  failed: 'Something went wrong. Try again.',
}

/**
 * Puts each issue on its form field (renaming via `rename` where the action's
 * key differs from the form's). Returns the messages that matched no field.
 */
export function applyIssues<T extends FieldValues>(
  issues: ActionIssue[] | undefined,
  fields: readonly string[],
  setError: UseFormSetError<T>,
  rename: Record<string, string> = {}
): string[] {
  const unplaced: string[] = []
  for (const issue of issues ?? []) {
    const key = rename[issue.path] ?? issue.path.split('.')[0]
    if (fields.includes(key)) setError(key as Path<T>, { type: 'server', message: issue.message })
    else unplaced.push(issue.message)
  }
  return unplaced
}
