import { eq } from 'drizzle-orm'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database'
import { files, shows } from '@/lib/database/schema'
import { toIso } from '@/lib/services/cache'
import { fileStorage } from '@/lib/storage'
import { invalidateFileOwner } from '@/lib/services/files'

/**
 * The one confirmed path for deleting `files` rows, shared by deleteFile,
 * deleteArrangement and deleteShow (lib/actions). Server-only.
 *
 * Per file: remove the Storage object (lib/storage.ts deleteFile confirms it
 * is gone; YouTube rows have none), then, in one transaction, clear a show
 * thumbnail/graphic that pointed at the file and delete the row. Storage
 * refusing (or an unclear result) keeps the row.
 */

export type RemovableFile = {
  id: number
  storagePath: string
  url: string
  fileType: string
  showId: number | null
  arrangementId: number | null
}

export const REMOVABLE_FILE_COLUMNS = {
  id: files.id,
  storagePath: files.storagePath,
  url: files.url,
  fileType: files.fileType,
  showId: files.showId,
  arrangementId: files.arrangementId,
}

/** The show whose art pointed at the file and was cleared (its new updated_at). */
export type ClearedShow = { id: number; thumbnailUrl: string | null; updatedAt: string }

export type RemoveResult = { ok: true; clearedShow: ClearedShow | null } | { ok: false; error: string }

export async function removeFile(db: Database, file: RemovableFile, supabase: SupabaseClient): Promise<RemoveResult> {
  if (file.fileType !== 'youtube') {
    const removed = await fileStorage.deleteFile(file, supabase)
    if (!removed.success) return { ok: false, error: removed.error ?? 'storage remove failed' }
  }

  const clearedShow = await db.transaction(async (tx) => {
    let cleared: ClearedShow | null = null
    if (file.showId) {
      const [current] = await tx
        .select({ id: shows.id, thumbnailUrl: shows.thumbnailUrl, graphicUrl: shows.graphicUrl })
        .from(shows)
        .where(eq(shows.id, file.showId))
        .limit(1)
        .for('update')
      const updates: { thumbnailUrl?: null; graphicUrl?: null } = {}
      if (current?.thumbnailUrl === file.url) updates.thumbnailUrl = null
      if (current?.graphicUrl === file.url) updates.graphicUrl = null
      if (current && Object.keys(updates).length > 0) {
        const [updated] = await tx
          .update(shows)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(shows.id, current.id))
          .returning({ id: shows.id, thumbnailUrl: shows.thumbnailUrl, updatedAt: shows.updatedAt })
        cleared = { id: updated.id, thumbnailUrl: updated.thumbnailUrl, updatedAt: toIso(updated.updatedAt) ?? '' }
      }
    }
    await tx.delete(files).where(eq(files.id, file.id))
    return cleared
  })
  return { ok: true, clearedShow }
}

/** Thrown when one of an owner's files could not be removed; `removed` were. */
export class FileRemovalError extends Error {
  constructor(readonly fileId: number, readonly detail: string, readonly removed: number) {
    super(`Storage refused to remove file ${fileId}: ${detail}`)
    this.name = 'FileRemovalError'
  }
}

/**
 * Removes every file in `list`, one at a time, each committed on its own, so
 * a retry after a failure resumes with the files left. (Rolling back rows
 * whose objects were already removed would leave rows a later delete could
 * never confirm.) Stops at the first failure.
 *
 * `clearedShowIds`: shows whose thumbnail/graphic pointed at a removed file
 * and was cleared (their cache must be invalidated too).
 *
 * `onPartialFailure` runs before the error is rethrown when at least one file
 * was removed, so the caller can invalidate what already changed: the action
 * result will be `failed` and guarded() will not run its invalidate.
 */
export async function removeFilesInOrder(
  db: Database,
  list: RemovableFile[],
  createSupabase: () => Promise<SupabaseClient>,
  onPartialFailure: (clearedShowIds: number[]) => Promise<void> | void
): Promise<{ removed: number; clearedShowIds: number[] }> {
  const clearedShowIds: number[] = []
  if (list.length === 0) return { removed: 0, clearedShowIds }
  const supabase = await createSupabase()
  let removed = 0
  for (const file of list) {
    const result = await removeFile(db, file, supabase)
    if (!result.ok) {
      if (removed > 0) {
        try {
          await onPartialFailure(clearedShowIds)
        } catch (error) {
          console.error('Invalidation after a partial file removal failed:', error)
        }
      }
      throw new FileRemovalError(file.id, result.error, removed)
    }
    removed++
    if (result.clearedShow && !clearedShowIds.includes(result.clearedShow.id)) clearedShowIds.push(result.clearedShow.id)
  }
  return { removed, clearedShowIds }
}

/** Invalidates each show (slug looked up; a failed lookup still expires its tags). */
export async function invalidateShowsById(showIds: number[]): Promise<void> {
  for (const showId of showIds) await invalidateFileOwner({ showId })
}
