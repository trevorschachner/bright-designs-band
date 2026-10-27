import { getSupabaseConfig } from '@/lib/env'

/**
 * Public Supabase Storage URL for an object. Needs no client: public buckets
 * are served from a fixed path. Bucket and each path segment are
 * percent-encoded; leading/trailing/duplicate slashes are dropped.
 * `baseUrl` optionally overrides the env (pure callers such as the sheet export).
 * Throws when NEXT_PUBLIC_SUPABASE_URL is unset or masked (Netlify `****`);
 * build-time callers must guard with shouldSkipSupabase().
 */
export function publicStorageUrl(bucket: string, path: string, baseUrl?: string | null): string {
  const url = baseUrl?.trim() || getSupabaseConfig().url
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  const base = url.replace(/\/+$/, '')
  const encodedPath = path
    .split('/')
    .filter((segment) => segment.length > 0)
    .map(encodeURIComponent)
    .join('/')
  return `${base}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodedPath}`
}

/**
 * Same-origin path for a public Storage URL, served through the `/media`
 * rewrite in next.config.mjs. School content filters often block supabase.co
 * while allowing our own domain, which broke audio playback for directors.
 * Any other URL (or a missing/masked env) passes through unchanged.
 */
export function mediaProxyUrl(url: string): string {
  const base = getSupabaseConfig().url
  if (!base) return url
  const prefix = `${base.replace(/\/+$/, '')}/storage/v1/object/public/`
  return url.startsWith(prefix) ? `/media/${url.slice(prefix.length)}` : url
}
