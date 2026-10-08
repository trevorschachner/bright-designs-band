import type { ActionResult } from '@/lib/actions/result';

/** A failed resource action, in words for the editor. */
export function resourceErrorMessage(result: Extract<ActionResult<unknown>, { ok: false }>): string {
  if (result.issues?.length) return result.issues.map((issue) => issue.message).join('; ');
  switch (result.error) {
    case 'conflict':
      return 'That slug is already used by another resource.';
    case 'stale':
      return 'Someone else changed this resource. Reload to see their changes.';
    case 'not_found':
      return 'This resource was deleted.';
    case 'forbidden':
      return 'You do not have permission to manage resources.';
    default:
      return 'Something went wrong. Try again.';
  }
}
