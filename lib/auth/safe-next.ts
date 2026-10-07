const DEFAULT_NEXT = '/admin'

/**
 * Returns a same-origin relative path safe to redirect to, else '/admin'.
 * Rejects protocol-relative ('//host'), backslash, scheme ('x:') and
 * whitespace-containing values to prevent open redirects.
 */
export function safeNext(value: string | null): string {
  if (!value) return DEFAULT_NEXT
  if (!value.startsWith('/') || value.startsWith('//')) return DEFAULT_NEXT
  if (/[\\:\s]/.test(value)) return DEFAULT_NEXT
  return value
}
