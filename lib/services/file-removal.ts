import { eq } from 'drizzle-orm'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database'
import { files, shows } from '@/lib/database/schema'
import { toIso } from '@/lib/services/cache'
import { fileStorage } from '@/lib/storage'
import { invalidateFileOwner } from '@/lib/services/files'
import { createClient } from '@/lib/utils/supabase/server'

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
class FileRemovalError extends Error {
  constructor(readonly fileId: number, readonly detail: string, readonly removed: number) {
    super(`Storage refused to remove file ${fileId}: ${detail}`)
    this.name = 'FileRemovalError'
  }
}

export type FileOwner = { showId: number } | { arrangementId: number }

/**
 * Removes every file a show or part owns, before the owner itself is deleted.
 * One file at a time, each committed on its own, so a retry after a failure
 * resumes with the files left. (Rolling back rows whose objects were already
 * removed would leave rows a later delete could never confirm.) Stops at the
 * first failure and throws FileRemovalError.
 *
 * Invalidation is handled here, because the caller cannot do it right: on a
 * partial failure the action throws, so guarded() never runs its invalidate,
 * yet the rows already removed are a public change. So before rethrowing,
 * this invalidates the owner and everything else the removed files touched.
 * Failing on the first file changed nothing and invalidates nothing.
 *
 * On success, the caller invalidates the owner it deleted (it knows the
 * slugs) and calls `invalidateRemoved` from its own `invalidate`: the other
 * pages the removal touched (a show whose thumbnail/graphic pointed at a
 * removed file and was cleared; the other owner of a file that had both).
 */
export async function removeOwnerFiles(
  db: Database,
  owner: FileOwner
): Promise<{ removed: number; invalidateRemoved: () => Promise<void> }> {
  const list = await db
    .select(REMOVABLE_FILE_COLUMNS)
    .from(files)
    .where('showId' in owner ? eq(files.showId, owner.showId) : eq(files.arrangementId, owner.arrangementId))

  const ownShowId = 'showId' in owner ? owner.showId : null
  const ownArrangementId = 'arrangementId' in owner ? owner.arrangementId : null
  const touchedShows = new Set<number>()
  const touchedArrangements = new Set<number>()
  const invalidateRemoved = async () => {
    for (const showId of touchedShows) await invalidateFileOwner({ showId })
    for (const arrangementId of touchedArrangements) await invalidateFileOwner({ arrangementId })
  }

  if (list.length === 0) return { removed: 0, invalidateRemoved }
  const supabase = await createClient()
  let removed = 0
  for (const file of list) {
    const result = await removeFile(db, file, supabase)
    if (!result.ok) {
      if (removed > 0) {
        try {
          await invalidateFileOwner(owner)
          await invalidateRemoved()
        } catch (error) {
          // Never mask the removal failure with an invalidation one.
          console.error('Invalidation after a partial file removal failed:', error)
        }
      }
      throw new FileRemovalError(file.id, result.error, removed)
    }
    removed++
    if (result.clearedShow && result.clearedShow.id !== ownShowId) touchedShows.add(result.clearedShow.id)
    if (file.showId && file.showId !== ownShowId) touchedShows.add(file.showId)
    if (file.arrangementId && file.arrangementId !== ownArrangementId) touchedArrangements.add(file.arrangementId)
  }
  return { removed, invalidateRemoved }
}
