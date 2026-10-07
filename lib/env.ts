/**
 * Environment access for the whole app.
 *
 * Two halves:
 *
 * - Public (`NEXT_PUBLIC_*`): the helpers below and `getPublicEnv()`. Each one
 *   reads a literal `process.env.NEXT_PUBLIC_X` expression so Next inlines the
 *   value into client and edge bundles at build time. They read live on every
 *   call, do no schema validation, and are safe to import from client components and
 *   from `proxy.ts` (edge).
 * - Server: `getEnv()` in lib/env.server.ts (schema-validated, server-only).
 *   Kept in its own module so the schema library and the server key names never reach the
 *   client or edge bundles. Never import lib/env.server from a client
 *   component, proxy.ts or instrumentation-client.ts.
 *
 * Netlify masks secret values as `****` during the build step. Everywhere in
 * these modules a `****` (or blank) value is treated as "not set".
 */

export const MASKED_VALUE = '****'

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
  fallback = 'https://brightdesigns.band'
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
