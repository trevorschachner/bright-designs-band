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

export const getGaMeasurementId = (): string | null =>
  sanitizeSecretString(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID)

export const getStorageBucket = (fallback = 'Bright Designs'): string =>
  sanitizeSecretString(process.env.NEXT_PUBLIC_STORAGE_BUCKET) ?? fallback

export const getStorageRootPrefix = (fallback = 'files'): string => {
  const raw = sanitizeSecretString(process.env.NEXT_PUBLIC_STORAGE_ROOT_PREFIX) ?? fallback
  return raw.replace(/^\/+|\/+$/g, '')
}

const isNetlifyBuild =
  process.env.NETLIFY === 'true' &&
  process.env.NETLIFY_LOCAL !== 'true'

const isSupabaseEnvMasked =
  isMaskedValue(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
  isMaskedValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export const shouldSkipSupabase = (): boolean =>
  Boolean(isNetlifyBuild && isSupabaseEnvMasked)

