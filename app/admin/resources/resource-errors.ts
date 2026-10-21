import { actionMessage, type ActionResult } from '@/lib/actions/result';

const MESSAGES = {
  conflict: 'That slug is already used by another resource.',
  stale: 'Someone else changed this resource. Reload to see their changes.',
  not_found: 'This resource was deleted.',
  forbidden: 'You do not have permission to manage resources.',
};

/** A failed resource action, in words for the editor. */
export function resourceErrorMessage(result: Extract<ActionResult<unknown>, { ok: false }>): string {
  return actionMessage(result, MESSAGES);
}
