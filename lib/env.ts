const MASKED_VALUE = '****'

const sanitizeEnvString = (value?: string | null): string | null => {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed || trimmed === MASKED_VALUE) return null
  return trimmed
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
  const sanitized = sanitizeEnvString(value)
  if (!sanitized) return null
  return isValidUrl(sanitized) ? sanitized : null
}

export const getOptionalPublicSiteUrl = (): string | null =>
  sanitizePublicUrl(process.env.NEXT_PUBLIC_SITE_URL)

export const getPublicSiteUrl = (
  fallback = 'https://www.brightdesigns.band'
): string => getOptionalPublicSiteUrl() ?? fallback

export const getSupabaseUrl = (): string | null =>
  sanitizePublicUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)

export const getSupabaseAnonKey = (): string | null =>
  sanitizeEnvString(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export const getSupabaseConfig = () => ({
  url: getSupabaseUrl(),
  key: getSupabaseAnonKey(),
})

export const getPosthogKey = (): string | null =>
  sanitizeEnvString(process.env.NEXT_PUBLIC_POSTHOG_KEY)

export const getPosthogHost = (fallback = 'https://app.posthog.com'): string =>
  sanitizePublicUrl(process.env.NEXT_PUBLIC_POSTHOG_HOST) ?? fallback

export const getGaMeasurementId = (): string | null =>
  sanitizeEnvString(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID)

export const getStorageBucket = (fallback = 'Bright Designs'): string =>
  sanitizeEnvString(process.env.NEXT_PUBLIC_STORAGE_BUCKET) ?? fallback

export const getStorageRootPrefix = (fallback = 'files'): string => {
  const raw = sanitizeEnvString(process.env.NEXT_PUBLIC_STORAGE_ROOT_PREFIX) ?? fallback
  return raw.replace(/^\/+|\/+$/g, '')
}

