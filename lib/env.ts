import { z } from 'zod'

/**
 * Environment access for the whole app.
 *
 * Two halves:
 *
 * - Public (`NEXT_PUBLIC_*`): the helpers below and `getPublicEnv()`. Each one
 *   reads a literal `process.env.NEXT_PUBLIC_X` expression so Next inlines the
 *   value into client and edge bundles at build time. They read live on every
 *   call, never run zod, and are safe to import from client components and
 *   from `proxy.ts` (edge).
 * - Server (`getEnv()`): every server-only variable, zod-validated once on
 *   first use and cached. It refuses to run in the browser. Invalid values
 *   produce one aggregated error naming the keys, never echoing the values.
 *
 * Netlify masks secret values as `****` during the build step. Everywhere in
 * this module a `****` (or blank) value is treated as "not set".
 */

const MASKED_VALUE = '****'

const isMaskedValue = (value?: string | null): boolean =>
  (value ?? '').trim() === MASKED_VALUE

const sanitizeEnvString = (value?: string | null): string | null => {
  if (value === undefined || value === null) return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

const sanitizeSecretString = (value?: string | null): string | null => {
  const sanitized = sanitizeEnvString(value)
  if (!sanitized || isMaskedValue(sanitized)) return null
  return sanitized
}

const isValidUrl = (value: string): boolean => {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Public (client-safe) values
// ---------------------------------------------------------------------------

export const sanitizePublicUrl = (value?: string | null): string | null => {
  const sanitized = sanitizeSecretString(value)
  if (!sanitized) return null
  return isValidUrl(sanitized) ? sanitized : null
}

export const getOptionalPublicSiteUrl = (): string | null =>
  sanitizePublicUrl(process.env.NEXT_PUBLIC_SITE_URL)

export const getPublicSiteUrl = (
  fallback = 'https://www.brightdesigns.band'
): string => getOptionalPublicSiteUrl() ?? fallback

export const getSupabaseConfig = () => ({
  url: sanitizeSecretString(process.env.NEXT_PUBLIC_SUPABASE_URL),
  key: sanitizeSecretString(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
})

export const getPosthogKey = (): string | null =>
  sanitizeSecretString(process.env.NEXT_PUBLIC_POSTHOG_KEY)

export const getPosthogHost = (fallback = '/ingest'): string => {
  const host = sanitizeSecretString(process.env.NEXT_PUBLIC_POSTHOG_HOST)
  if (host && (isValidUrl(host) || host.startsWith('/'))) {
    return host
  }
  return fallback
}

export const getStorageBucket = (fallback = 'Bright Designs'): string =>
  sanitizeSecretString(process.env.NEXT_PUBLIC_STORAGE_BUCKET) ?? fallback

export const getStorageRootPrefix = (fallback = 'files'): string => {
  const raw = sanitizeSecretString(process.env.NEXT_PUBLIC_STORAGE_ROOT_PREFIX) ?? fallback
  return raw.replace(/^\/+|\/+$/g, '')
}

// Cloudflare's documented always-pass test site key. Used only outside
// production so local dev works without a Cloudflare account; the matching
// server-side behaviour is in lib/turnstile.ts.
const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA'

export const getTurnstileSiteKey = (): string | null =>
  sanitizeSecretString(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) ??
  (process.env.NODE_ENV === 'production' ? null : TURNSTILE_TEST_SITE_KEY)

/** All public values, with defaults applied. Read live; safe on the client. */
export const getPublicEnv = () => {
  const supabase = getSupabaseConfig()
  return {
    NEXT_PUBLIC_SITE_URL: getOptionalPublicSiteUrl(),
    NEXT_PUBLIC_SUPABASE_URL: supabase.url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabase.key,
    NEXT_PUBLIC_POSTHOG_KEY: getPosthogKey(),
    NEXT_PUBLIC_POSTHOG_HOST: getPosthogHost(),
    NEXT_PUBLIC_STORAGE_BUCKET: getStorageBucket(),
    NEXT_PUBLIC_STORAGE_ROOT_PREFIX: getStorageRootPrefix(),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: getTurnstileSiteKey(),
  }
}

// Netlify sets NETLIFY=true for builds and functions; NETLIFY_LOCAL=true under
// `netlify dev`. Read directly (not via the server schema) because proxy.ts
// runs on the edge and calls this.
const isNetlifyBuild = (): boolean =>
  process.env.NETLIFY === 'true' && process.env.NETLIFY_LOCAL !== 'true'

const isSupabaseEnvMasked = (): boolean =>
  isMaskedValue(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
  isMaskedValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export const shouldSkipSupabase = (): boolean =>
  isNetlifyBuild() && isSupabaseEnvMasked()

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
  // Optional so the Netlify build and CI's dummy env still build;
  // lib/database throws a clear error when it is actually used without one.
  DATABASE_URL: z.preprocess(unset, postgresUrl.optional()),
  SUPABASE_SERVICE_ROLE_KEY: optionalString,

  EMAIL_SERVICE: z.preprocess(unset, z.enum(['resend', 'gmail', 'smtp']).default('resend')),
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
