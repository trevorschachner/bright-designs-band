import { z } from 'zod'
import { MASKED_VALUE } from '@/lib/env'

/**
 * Server-only environment: every server-only variable, zod-validated once on
 * first use and cached. Invalid values produce one aggregated error naming the
 * keys, never echoing the values. Blank and Netlify-masked (`****`) values are
 * treated as unset.
 *
 * Never import this from a client component, proxy.ts (edge) or
 * instrumentation-client.ts; public values live in lib/env.ts. (`server-only`
 * is not resolvable from node_modules here, so the guard is the `typeof
 * window` check in getEnv().)
 */

// ---------------------------------------------------------------------------
// Server-only values
// ---------------------------------------------------------------------------

/** Blank and Netlify-masked (`****`) values become undefined; others are trimmed. */
const unset = (value: unknown): unknown => {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return trimmed === '' || trimmed === MASKED_VALUE ? undefined : trimmed
}

const optionalString = z.preprocess(unset, z.string().optional())

const optionalBoolean = z.preprocess(
  (value) => {
    const v = unset(value)
    if (typeof v !== 'string') return v
    const lower = v.toLowerCase()
    if (['true', '1', 'yes'].includes(lower)) return true
    if (['false', '0', 'no'].includes(lower)) return false
    return v
  },
  z.boolean().optional()
)

const postgresUrl = z.string().refine((value) => {
  try {
    const { protocol } = new URL(value)
    return protocol === 'postgres:' || protocol === 'postgresql:'
  } catch {
    return false
  }
})

const serverSchema = z.object({
  // Optional so the Netlify build and CI (which has none) still build;
  // lib/database throws a clear error when it is actually used without one.
  DATABASE_URL: z.preprocess(unset, postgresUrl.optional()),
  SUPABASE_SERVICE_ROLE_KEY: optionalString,

  EMAIL_SERVICE: z.preprocess((value) => {
    const v = unset(value)
    return typeof v === 'string' ? v.toLowerCase() : v
  }, z.enum(['resend', 'gmail', 'smtp']).default('resend')),
  RESEND_API_KEY: optionalString,
  EMAIL_FROM: optionalString,
  ADMIN_EMAIL: optionalString,
  ADMIN_EMAIL_ADDRESSES: z.preprocess((value) => {
    const v = unset(value)
    if (typeof v !== 'string') return v
    const list = v.split(',').map((s) => s.trim()).filter(Boolean)
    return list.length ? list : undefined
  }, z.array(z.string()).optional()),
  GMAIL_USER: optionalString,
  GMAIL_APP_PASSWORD: optionalString,
  SMTP_HOST: optionalString,
  SMTP_PORT: z.preprocess(
    (value) => {
      const v = unset(value)
      return typeof v === 'string' ? Number(v) : v
    },
    z.number().int().positive().max(65535).optional()
  ),
  SMTP_USER: optionalString,
  SMTP_PASS: optionalString,
  SMTP_SECURE: optionalBoolean,

  TURNSTILE_SECRET_KEY: optionalString,

  // Storage bucket for isPublic = false files (default "private"). Server-only:
  // the browser never needs it (private files are served by
  // /api/files/<id>/download, uploads are signed by lib/actions/uploads.ts).
  // The Storage policies hard-code the bucket id 'private'
  // (drizzle/migrations/2026-10-08_storage_policies_admin.sql): this must equal
  // 'private', or that SQL must be edited to match before it is applied.
  STORAGE_PRIVATE_BUCKET: optionalString,

  ALLOW_DB_MIGRATE: optionalBoolean,
  ALLOW_DB_PUSH: optionalBoolean,

  TZ: optionalString,
  NETLIFY: optionalBoolean,
  NETLIFY_LOCAL: optionalBoolean,
})

export type ServerEnv = z.infer<typeof serverSchema>

// Fixed per-key hints, so an error message can never echo a value (zod's own
// messages sometimes include the received value).
const ERROR_HINTS: Partial<Record<keyof ServerEnv, string>> = {
  DATABASE_URL: 'must be a postgres:// or postgresql:// URL',
  EMAIL_SERVICE: 'must be one of resend, gmail, smtp',
  SMTP_PORT: 'must be a port number',
  SMTP_SECURE: 'must be true or false',
  ALLOW_DB_MIGRATE: 'must be true or false',
  ALLOW_DB_PUSH: 'must be true or false',
  NETLIFY: 'must be true or false',
  NETLIFY_LOCAL: 'must be true or false',
}

export const parseServerEnv = (source: Record<string, string | undefined>): ServerEnv => {
  const result = serverSchema.safeParse(source)
  if (result.success) return result.data
  const keys = [...new Set(result.error.issues.map((issue) => String(issue.path[0])))]
  const details = keys
    .map((key) => `${key} (${ERROR_HINTS[key as keyof ServerEnv] ?? 'invalid value'})`)
    .join(', ')
  throw new Error(`Invalid environment variables: ${details}`)
}

let cachedEnv: ServerEnv | null = null

/** Server-only, validated environment. Parsed on first call and cached. */
export const getEnv = (): ServerEnv => {
  if (typeof window !== 'undefined') {
    throw new Error('getEnv() is server-only; use the public helpers in lib/env.ts on the client')
  }
  cachedEnv ??= parseServerEnv(process.env)
  return cachedEnv
}

export const getTurnstileSecret = (): string | null =>
  getEnv().TURNSTILE_SECRET_KEY ?? null

/**
 * The private Storage bucket (isPublic = false files). Created in the Supabase
 * dashboard; policies in drizzle/migrations/2026-10-08_storage_policies_admin.sql,
 * which hard-code the id 'private' (keep STORAGE_PRIVATE_BUCKET equal to it).
 * The public bucket is getStorageBucket() in lib/env.ts.
 */
export const getPrivateStorageBucket = (fallback = 'private'): string =>
  getEnv().STORAGE_PRIVATE_BUCKET ?? fallback
