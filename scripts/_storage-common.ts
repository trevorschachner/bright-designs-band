/**
 * Shared plumbing for the Storage maintenance scripts
 * (migrate-private-files, find-orphan-files, cleanup-pending-uploads).
 *
 * Scripts, not app code: they read .env.local and may use the service-role
 * key, which bypasses RLS on storage.objects. That is what makes their
 * listings trustworthy (an admin JWT's list() can be hidden by RLS).
 */
import { config } from 'dotenv'
import { resolve } from 'path'
import postgres from 'postgres'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

config({ path: resolve(process.cwd(), '.env.local') })

/** Thin query wrapper over one `postgres` connection (max: 1 keeps begin/commit on the same session). */
export type Db = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[]; rowCount: number }>
  end: () => Promise<void>
}

export function connect(): Db {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL not found in .env.local')
  const sql = postgres(url, { max: 1, prepare: false, ssl: process.env.NODE_ENV === 'production' ? 'require' : 'prefer' })
  return {
    query: async (text, params) => {
      const result = params
        ? await sql.unsafe(text, params as postgres.ParameterOrJSON<never>[])
        : await sql.unsafe(text)
      return { rows: [...result] as Record<string, unknown>[], rowCount: result.count }
    },
    end: () => sql.end(),
  }
}

// Same defaults as lib/env.ts / lib/env.server.ts.
export const PUBLIC_BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET?.trim() || 'Bright Designs'
export const PRIVATE_BUCKET = process.env.STORAGE_PRIVATE_BUCKET?.trim() || 'private'
export const ROOT_PREFIX = (process.env.NEXT_PUBLIC_STORAGE_ROOT_PREFIX?.trim() || 'files').replace(/^\/+|\/+$/g, '')

export const withRootPrefix = (path: string): string => `${ROOT_PREFIX}/${String(path || '').replace(/^\/+/, '')}`

const DOWNLOAD_ROUTE_RE = /^\/api\/files\/\d+\/download$/
export const isDownloadRoute = (url: unknown): boolean => DOWNLOAD_ROUTE_RE.test(String(url ?? ''))
export const downloadRoute = (id: number): string => `/api/files/${id}/download`

/** Bucket a files row's object is in (same rule as lib/storage.ts storageBucketFor). */
export const bucketForRow = (url: unknown): string => (isDownloadRoute(url) ? PRIVATE_BUCKET : PUBLIC_BUCKET)

/** Service-role client. Required for anything that writes to Storage, and for trustworthy listings. */
export function serviceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL not found in .env.local')
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required in .env.local (Supabase → Settings → API).')
  return createClient(url, key, { auth: { persistSession: false } })
}

export type ListedObject = { path: string; size: number | null }

/** Every object under `prefix` in `bucket`, recursively. */
export async function listAll(client: SupabaseClient, bucket: string, prefix: string): Promise<ListedObject[]> {
  const out: ListedObject[] = []
  const pageSize = 1000
  const walk = async (dir: string): Promise<void> => {
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await client.storage.from(bucket).list(dir, { limit: pageSize, offset, sortBy: { column: 'name', order: 'asc' } })
      if (error) throw new Error(`list ${bucket}/${dir} failed: ${error.message}`)
      for (const entry of data ?? []) {
        const path = dir ? `${dir}/${entry.name}` : entry.name
        if (entry.id === null) await walk(path) // a folder
        else out.push({ path, size: typeof entry.metadata?.size === 'number' ? entry.metadata.size : null })
      }
      if (!data || data.length < pageSize) break
    }
  }
  await walk(prefix)
  return out
}

/** Exact-key lookup. true = present, false = absent (service role: not hidden by RLS). */
export async function objectExists(client: SupabaseClient, bucket: string, fullPath: string): Promise<{ present: boolean; size: number | null }> {
  const slash = fullPath.lastIndexOf('/')
  const dir = slash === -1 ? '' : fullPath.slice(0, slash)
  const name = slash === -1 ? fullPath : fullPath.slice(slash + 1)
  const { data, error } = await client.storage.from(bucket).list(dir, { search: name, limit: 100 })
  if (error) throw new Error(`list ${bucket}/${dir} failed: ${error.message}`)
  const hit = (data ?? []).find((o) => o.name === name && o.id !== null)
  return { present: Boolean(hit), size: typeof hit?.metadata?.size === 'number' ? hit.metadata.size : null }
}

export const hasFlag = (flag: string): boolean => process.argv.slice(2).includes(flag)

export function flagValue(flag: string): string | null {
  const args = process.argv.slice(2)
  const i = args.indexOf(flag)
  if (i === -1) return null
  const value = args[i + 1]
  if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value`)
  return value
}
