/**
 * Shared plumbing for the maintenance scripts in scripts/ and scripts/seo/:
 * env loading, the database connection, the service-role Storage client, and
 * the Storage path rules (re-exported from lib/storage, never re-implemented).
 *
 * Import this module FIRST in a script: ./_env loads .env.local, and
 * lib/storage reads the bucket and root prefix when it is first imported.
 *
 * Scripts, not app code: they read .env.local and may use the service-role
 * key, which bypasses RLS on storage.objects. That is what makes their
 * listings trustworthy (an admin JWT's list() can be hidden by RLS).
 *
 * Nothing here connects on import (scripts/seo tests import a script that
 * imports this); connect() and serviceClient() are the only entry points.
 */
import './_env'
import postgres from 'postgres'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import * as schema from '../lib/database/schema'
import { getEnv } from '../lib/env.server'
import { getStorageBucket, getStorageRootPrefix, getSupabaseConfig } from '../lib/env'
import { findObject, STORAGE_BUCKET, STORAGE_ROOT_PREFIX, privateStorageBucket } from '../lib/storage'

// Storage path rules: lib/storage is the one definition.
export { downloadRoute, isDownloadRoute, privateStorageBucket, storageBucketFor, withRootPrefix } from '../lib/storage'
/** The public bucket (lib/storage STORAGE_BUCKET). */
export const PUBLIC_BUCKET = STORAGE_BUCKET
/** Root prefix every object key starts with (lib/storage STORAGE_ROOT_PREFIX). */
export const ROOT_PREFIX = STORAGE_ROOT_PREFIX

// lib/storage captured the bucket and prefix when first imported. If something imported it
// before ./_env ran, they hold the defaults instead of .env.local's values.
if (STORAGE_ROOT_PREFIX !== getStorageRootPrefix() || STORAGE_BUCKET !== getStorageBucket()) {
  throw new Error('lib/storage was imported before .env.local was loaded; import scripts/_common first')
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

export type Sql = postgres.Sql

/** Thin query wrapper over one `postgres` connection (max: 1 keeps begin/commit on the same session). */
export type Db = {
  query: (text: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[]; rowCount: number }>
  /** The postgres.js client, for tagged-template queries and sql.begin(). */
  sql: Sql
  /** Drizzle over the same connection, with the app schema (lib/database/schema). */
  drizzle: PostgresJsDatabase<typeof schema>
  end: () => Promise<void>
}

/** DATABASE_URL, validated by the app's env schema (lib/env.server); null when unset. */
export const databaseUrl = (): string | null => getEnv().DATABASE_URL ?? null

/**
 * Opens one connection (max: 1). Same ssl/prepare settings as lib/database's
 * getDb(); that pool (max 5, cached on globalThis, no close handle) does not
 * suit a script that runs begin/commit as plain queries and must exit.
 * Close it with `end()`.
 */
export function connect(): Db {
  const url = databaseUrl()
  if (!url) throw new Error('DATABASE_URL not found in .env.local')
  const sql = postgres(url, { max: 1, prepare: false, ssl: process.env.NODE_ENV === 'production' ? 'require' : 'prefer' })
  let orm: PostgresJsDatabase<typeof schema> | null = null
  return {
    query: async (text, params) => {
      const result = params
        ? await sql.unsafe(text, params as postgres.ParameterOrJSON<never>[])
        : await sql.unsafe(text)
      return { rows: [...result] as Record<string, unknown>[], rowCount: result.count }
    },
    sql,
    get drizzle() {
      orm ??= drizzle(sql, { schema })
      return orm
    },
    end: () => sql.end(),
  }
}

/** connect(), run `fn`, always close. */
export async function withDb<T>(fn: (db: Db) => Promise<T>): Promise<T> {
  const db = connect()
  try {
    return await fn(db)
  } finally {
    await db.end()
  }
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

/** Service-role client. Required for anything that writes to Storage, and for trustworthy listings. */
export function serviceClient(): SupabaseClient {
  const url = getSupabaseConfig().url
  const key = getEnv().SUPABASE_SERVICE_ROLE_KEY
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL not found in .env.local')
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required in .env.local (Supabase → Settings → API).')
  return createClient(url, key, { auth: { persistSession: false } })
}

/** The private bucket name (lib/storage privateStorageBucket()). Read lazily: it validates the server env. */
export const privateBucket = (): string => privateStorageBucket()

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

/**
 * Exact-key lookup (lib/storage findObject). true = present, false = absent
 * (service role: not hidden by RLS). Throws when the listing fails.
 */
export async function objectExists(client: SupabaseClient, bucket: string, fullPath: string): Promise<{ present: boolean; size: number | null }> {
  const found = await findObject(client, bucket, fullPath)
  if (found.status === 'error') throw new Error(`lookup of ${bucket}/${fullPath} failed`)
  if (found.status === 'absent') return { present: false, size: null }
  return { present: true, size: found.object.size }
}

// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------

export const hasFlag = (flag: string): boolean => process.argv.slice(2).includes(flag)

export function flagValue(flag: string): string | null {
  const args = process.argv.slice(2)
  const i = args.indexOf(flag)
  if (i === -1) return null
  const value = args[i + 1]
  if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value`)
  return value
}
