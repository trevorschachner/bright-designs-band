import type { SupabaseClient } from '@supabase/supabase-js'
import { getStorageBucket, getStorageRootPrefix } from '@/lib/env'
import { getPrivateStorageBucket } from '@/lib/env.server'
import { publicStorageUrl } from '@/lib/media/public-url'

/**
 * Supabase Storage for `files` rows. Server-only (reads the private bucket
 * name from lib/env.server). Callers pass a server Supabase client; this
 * module never constructs one.
 *
 * Two buckets:
 * - the public bucket (`getStorageBucket()`, default "Bright Designs") holds
 *   isPublic = true objects, served from their public URL;
 * - the private bucket (`getPrivateStorageBucket()`, default "private") holds
 *   isPublic = false objects, served only through GET /api/files/<id>/download
 *   (staff, 60 s signed URL).
 *
 * A row is in the private bucket exactly when its `url` is its download route
 * (uploads write it that way; scripts/migrate-private-files.ts rewrites moved
 * rows to it). A private row whose url is still a public URL has not been
 * migrated yet and is still in the public bucket.
 *
 * Uploads are signed and verified by lib/actions/uploads.ts.
 */

// The public bucket.
export const STORAGE_BUCKET = getStorageBucket()

// We keep DB storagePath values WITHOUT this prefix, and only prepend it
// when interacting with Supabase Storage so we don't have to migrate DB rows.
export const STORAGE_ROOT_PREFIX = getStorageRootPrefix()

export function withRootPrefix(path: string): string {
  const trimmed = String(path || '').replace(/^\/+/, '')
  return `${STORAGE_ROOT_PREFIX}/${trimmed}`
}

export const privateStorageBucket = (): string => getPrivateStorageBucket()

/** The bucket an upload goes to. */
export const bucketForVisibility = (isPublic: boolean): string => (isPublic ? STORAGE_BUCKET : privateStorageBucket())

/** `files.url` of a private-bucket row. */
export const downloadRoute = (id: number): string => `/api/files/${id}/download`

const DOWNLOAD_ROUTE_RE = /^\/api\/files\/\d+\/download$/
export const isDownloadRoute = (url: string | null | undefined): boolean => DOWNLOAD_ROUTE_RE.test(String(url ?? ''))

/** The bucket a row's object lives in (see the module comment). */
export const storageBucketFor = (row: { url: string | null }): string =>
  isDownloadRoute(row.url) ? privateStorageBucket() : STORAGE_BUCKET

export type StoredObject = { size: number | null; mimetype: string | null }

/**
 * Looks one object up by its exact key with `list(parent, { search })`.
 * `object` = found, `absent` = the listing worked and has no such name,
 * `error` = the listing failed. RLS on storage.objects also hides objects
 * from `list`, so `absent` only means "not visible to this caller".
 */
export async function findObject(
  supabase: SupabaseClient,
  bucket: string,
  fullPath: string
): Promise<{ status: 'object'; object: StoredObject } | { status: 'absent' } | { status: 'error' }> {
  const slash = fullPath.lastIndexOf('/')
  const dir = slash === -1 ? '' : fullPath.slice(0, slash)
  const name = slash === -1 ? fullPath : fullPath.slice(slash + 1)
  try {
    const { data, error } = await supabase.storage.from(bucket).list(dir, { search: name, limit: 100 })
    if (error || !Array.isArray(data)) return { status: 'error' }
    const hit = data.find((o) => o?.name === name && o.id !== null)
    if (!hit) return { status: 'absent' }
    const meta = (hit.metadata ?? {}) as { size?: unknown; mimetype?: unknown }
    return {
      status: 'object',
      object: {
        size: typeof meta.size === 'number' ? meta.size : null,
        mimetype: typeof meta.mimetype === 'string' ? meta.mimetype : null,
      },
    }
  } catch {
    return { status: 'error' }
  }
}

export class FileStorageService {
  /**
   * Delete a row's Storage object. Success means the object is confirmed gone;
   * anything unclear is a failure, so the caller keeps the row.
   *
   * `remove()` answers `{ data: [], error: null }` both when the object was
   * already absent and when RLS on storage.objects hides it from this caller,
   * so an empty result is not trusted:
   *
   * - public bucket: authenticated `exists`, then an anonymous HEAD on the
   *   public URL (which the caller's RLS cannot hide);
   * - private bucket: there is no anonymous view (a public-URL HEAD 404s on
   *   every private object), so only `list` is used. A listing that works and
   *   has no object of that exact name = absent = success; the name present =
   *   not removed (permission?); a listing error = unclear = failure. This
   *   trusts the admin policies on the private bucket
   *   (drizzle/migrations/2026-10-08_storage_policies_admin.sql), which let
   *   every admin see every object there.
   *
   *   | bucket  | remove()      | lookup                          | result          |
   *   | any     | error         | -                               | failed, row kept |
   *   | any     | object listed | -                               | success         |
   *   | public  | []            | exists() or HEAD 200            | failed          |
   *   | public  | []            | exists() false + HEAD 400/404   | success         |
   *   | public  | []            | HEAD other / network error      | failed          |
   *   | private | []            | list ok, no exact match         | success         |
   *   | private | []            | list ok, exact match            | failed          |
   *   | private | []            | list error                      | failed          |
   */
  async deleteFile(
    file: { storagePath: string; url: string | null },
    supabase: SupabaseClient
  ): Promise<{ success: boolean; error?: string }> {
    const fullPath = withRootPrefix(file.storagePath)
    const isPrivate = isDownloadRoute(file.url)
    const bucket = storageBucketFor(file)
    try {
      const { data, error } = await supabase.storage.from(bucket).remove([fullPath])
      if (error) {
        console.error('Storage delete error:', error)
        return { success: false, error: 'Failed to delete file from storage' }
      }
      if (data && data.length > 0) return { success: true }

      if (isPrivate) {
        const after = await findObject(supabase, bucket, fullPath)
        if (after.status === 'absent') return { success: true }
        return {
          success: false,
          error: after.status === 'object' ? 'Storage did not remove the object (permission?)' : 'Could not confirm the object was removed',
        }
      }

      const present = await this.publicObjectPresent(fullPath, supabase)
      if (present === false) return { success: true }
      return {
        success: false,
        error: present ? 'Storage did not remove the object (permission?)' : 'Could not confirm the object was removed',
      }
    } catch (error) {
      console.error('File delete error:', error)
      return { success: false, error: 'An unexpected error occurred during deletion' }
    }
  }

  /** Public bucket only. true = still there, false = confirmed absent, null = could not tell. */
  private async publicObjectPresent(fullPath: string, supabase: SupabaseClient): Promise<boolean | null> {
    // exists() answers false for 400/404 and throws on anything else (caught by deleteFile).
    const { data: visible } = await supabase.storage.from(STORAGE_BUCKET).exists(fullPath)
    if (visible) return true
    try {
      const head = await fetch(publicStorageUrl(STORAGE_BUCKET, fullPath), { method: 'HEAD', cache: 'no-store' })
      if (head.ok) return true
      if (head.status === 400 || head.status === 404) return false
      return null
    } catch {
      return null
    }
  }

  /** URL to hand a caller: the public URL, or the staff-only download route for a private file. */
  getFileUrl(file: { id: number; storagePath: string; isPublic: boolean; fileType?: string; url?: string | null }): string {
    // A YouTube row's url is the link itself; there is no object.
    if (file.fileType === 'youtube' && file.url) return file.url
    if (file.isPublic) return publicStorageUrl(STORAGE_BUCKET, withRootPrefix(file.storagePath))
    return downloadRoute(file.id)
  }
}

export const fileStorage = new FileStorageService()
