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
