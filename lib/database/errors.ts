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

export const PG_UNIQUE_VIOLATION = '23505'
export const PG_UNDEFINED_TABLE = '42P01'
