'use server'

import { eq } from 'drizzle-orm'
import { arrangements, files, shows } from '@/lib/database/schema'
import { invalidateFileOwner } from '@/lib/services/files'
import { invalidateShow } from '@/lib/services/invalidate'
import { toIso } from '@/lib/services/cache'
import { REMOVABLE_FILE_COLUMNS, removeFile } from '@/lib/services/file-removal'
import { isDownloadRoute } from '@/lib/storage'
import { createClient } from '@/lib/utils/supabase/server'
import {
  attachYouTubeSchema,
  fileIdSchema,
  PERUSAL_SCORE_MIME,
  setPerusalScoreSchema,
  setShowThumbnailSchema,
  type AttachYouTubeInput,
  type SetPerusalScoreInput,
  type SetShowThumbnailInput,
} from '@/lib/validation/files'
import { youTubeVideoId, isValidYouTubeUrl } from '@/lib/youtube'
import { guarded, InvalidError, NotFoundError } from './_guarded'
import type { ActionResult } from './result'

/**
 * File writes other than uploading (uploads: ./uploads.ts). See ./README.md.
 */

export type ShowThumbnailResult = {
  showId: number
  thumbnailUrl: string | null
  /** The show's new `updated_at`: the editor's next `updateShow` must send it. */
  updatedAt: string
}

const runSetShowThumbnail = guarded(
  'canManageShows',
  setShowThumbnailSchema,
  async ({ showId, fileId, url }, { db }) => {
    if ((fileId === undefined) === (url === undefined)) {
      throw new InvalidError([{ path: 'fileId', message: 'Send either a file or a URL' }])
    }

    const row = await db.transaction(async (tx) => {
      let thumbnailUrl: string | null = url ?? null
      if (fileId !== undefined) {
        const [file] = await tx
          .select({ url: files.url, showId: files.showId, fileType: files.fileType })
          .from(files)
          .where(eq(files.id, fileId))
          .limit(1)
        if (!file || file.showId !== showId) throw new NotFoundError('file')
        if (file.fileType !== 'image') throw new InvalidError([{ path: 'fileId', message: 'Only an image can be the thumbnail' }])
        thumbnailUrl = file.url
      }
      const [updated] = await tx
        .update(shows)
        .set({ thumbnailUrl: thumbnailUrl || null, updatedAt: new Date() })
        .where(eq(shows.id, showId))
        .returning({ id: shows.id, slug: shows.slug, thumbnailUrl: shows.thumbnailUrl, updatedAt: shows.updatedAt })
      if (!updated) throw new NotFoundError('show')
      return updated
    })

    return {
      data: { showId: row.id, thumbnailUrl: row.thumbnailUrl, updatedAt: toIso(row.updatedAt) ?? '' },
      invalidate: () => invalidateShow(row.id, row.slug),
    }
  },
  'setShowThumbnail'
)

/** Sets (or clears, with `url: null`) a show's thumbnail. Last-writer-wins; bumps `updated_at`. */
export async function setShowThumbnail(input: SetShowThumbnailInput): Promise<ActionResult<ShowThumbnailResult>> {
  return runSetShowThumbnail(input)
}

// ---------------------------------------------------------------------------

export type AttachedFile = { id: number; url: string; showId: number | null; arrangementId: number | null }

const runAttachYouTube = guarded(
  // What /api/files/youtube required; changing the gate is a product decision.
  'canCreateArrangements',
  attachYouTubeSchema,
  async ({ showId, arrangementId, url, description, isPublic, displayOrder }, { db }) => {
    if (!isValidYouTubeUrl(url)) throw new InvalidError([{ path: 'url', message: 'Enter a valid YouTube URL' }])
    const videoId = youTubeVideoId(url)
    if (!videoId) throw new InvalidError([{ path: 'url', message: 'Could not find the video id in that URL' }])
    if (!showId && !arrangementId) throw new InvalidError([{ path: 'showId', message: 'Attach the link to a show or a part' }])

    const fileName = `youtube_${videoId}.url`
    const storagePath = showId && arrangementId
      ? `shows/${showId}/arrangements/${arrangementId}/youtube/${fileName}`
      : showId
        ? `shows/${showId}/youtube/${fileName}`
        : `arrangements/${arrangementId}/youtube/${fileName}`

    // An unknown show or part id is a foreign-key error: `failed`, nothing written.
    const [row] = await db
      .insert(files)
      .values({
        fileName,
        originalName: description || `YouTube Video ${videoId}`,
        fileType: 'youtube',
        fileSize: 0,
        mimeType: 'text/url',
        url,
        storagePath,
        showId: showId ?? null,
        arrangementId: arrangementId ?? null,
        isPublic: isPublic ?? true,
        description: description || null,
        displayOrder: displayOrder ?? 0,
      })
      .returning({ id: files.id, url: files.url, showId: files.showId, arrangementId: files.arrangementId })

    return { data: row, invalidate: () => invalidateFileOwner(row) }
  },
  'attachYouTube'
)

/** Adds a YouTube link to a show's (or a part's) files. Replaces POST /api/files/youtube. */
export async function attachYouTube(input: AttachYouTubeInput): Promise<ActionResult<AttachedFile>> {
  return runAttachYouTube(input)
}

// ---------------------------------------------------------------------------

export type DeletedFile = {
  id: number
  /** Set when the show's thumbnail or graphic pointed at this file and was cleared. */
  show: { id: number; thumbnailUrl: string | null; updatedAt: string } | null
}

/** Thrown when Storage refuses the delete: the row is kept so the object is not orphaned. */
class StorageRemoveError extends Error {
  constructor(readonly detail?: string) {
    super('storage remove failed')
    this.name = 'StorageRemoveError'
  }
}

const runDeleteFile = guarded(
  'canDeleteFiles',
  fileIdSchema,
  async ({ id }, { db }) => {
    const [file] = await db.select(REMOVABLE_FILE_COLUMNS).from(files).where(eq(files.id, id)).limit(1)
    if (!file) throw new NotFoundError('file')

    // Remove the object first (none for a YouTube link); keep the row if
    // Storage refuses, so a retry can finish.
    const removed = await removeFile(db, file, await createClient())
    if (!removed.ok) throw new StorageRemoveError(removed.error)
    const show = removed.clearedShow

    return { data: { id, show }, invalidate: () => invalidateFileOwner(file) }
  },
  'deleteFile'
)

/**
 * Deletes a file: the Storage object, then the row. If Storage refuses, the
 * result is `failed` and the row stays. A show thumbnail or graphic that
 * pointed at the file is cleared in the same transaction as the row delete.
 */
export async function deleteFile(input: { id: number }): Promise<ActionResult<DeletedFile>> {
  return runDeleteFile(input)
}

// ---------------------------------------------------------------------------

export type PerusalScoreResult = {
  arrangementId: number
  file: { id: number; originalName: string; createdAt: string }
  /** False when the previous slot file could not be removed: it stays in the part's files for staff to delete. */
  previousRemoved: boolean
}

const runSetPerusalScore = guarded(
  'canUploadFiles',
  setPerusalScoreSchema,
  async ({ arrangementId, fileId }, { db }) => {
    const outcome = await db.transaction(async (tx) => {
      const [file] = await tx
        .select({
          id: files.id,
          arrangementId: files.arrangementId,
          fileType: files.fileType,
          mimeType: files.mimeType,
          isPublic: files.isPublic,
          url: files.url,
          originalName: files.originalName,
          createdAt: files.createdAt,
        })
        .from(files)
        .where(eq(files.id, fileId))
        .limit(1)
      if (!file || file.arrangementId !== arrangementId) throw new NotFoundError('file')
      // Private bucket only: a private row is in the private bucket exactly when its url is the download route.
      if (file.fileType !== 'score' || file.mimeType !== PERUSAL_SCORE_MIME || file.isPublic || !isDownloadRoute(file.url)) {
        throw new InvalidError([{ path: 'fileId', message: 'A perusal score must be a private PDF score' }])
      }

      // Locked so two replacements in a row each see the other's file as the previous one.
      const [current] = await tx
        .select({ perusalScoreFileId: arrangements.perusalScoreFileId })
        .from(arrangements)
        .where(eq(arrangements.id, arrangementId))
        .limit(1)
        .for('update')
      if (!current) throw new NotFoundError('arrangement')

      // updated_at is left alone: the slot is not a form field, so setting it
      // must not make an open part form stale.
      await tx.update(arrangements).set({ perusalScoreFileId: fileId }).where(eq(arrangements.id, arrangementId))
      const previousId = current.perusalScoreFileId !== fileId ? current.perusalScoreFileId : null
      return { file, previousId }
    })

    // The slot already points at the new file; removing the old one is cleanup.
    // If Storage refuses, the old row stays as an ordinary part file.
    let previousRemoved = true
    if (outcome.previousId !== null) {
      const [previous] = await db.select(REMOVABLE_FILE_COLUMNS).from(files).where(eq(files.id, outcome.previousId)).limit(1)
      if (previous && previous.arrangementId === arrangementId) {
        const removed = await removeFile(db, previous, await createClient())
        if (!removed.ok) {
          previousRemoved = false
          console.error(`Removing the previous perusal score (file ${previous.id}) failed: ${removed.error}`)
        }
      }
    }

    const { file } = outcome
    return {
      data: {
        arrangementId,
        file: { id: file.id, originalName: file.originalName, createdAt: toIso(file.createdAt) ?? '' },
        previousRemoved,
      },
      invalidate: () => invalidateFileOwner({ arrangementId }),
    }
  },
  'setPerusalScore'
)

/**
 * Points a part's Perusal score slot at `fileId`, a private PDF score on that
 * part (upload it first with kind `score`, isPublic false), then removes the
 * file the slot held before. Does not bump the part's `updated_at`.
 */
export async function setPerusalScore(input: SetPerusalScoreInput): Promise<ActionResult<PerusalScoreResult>> {
  return runSetPerusalScore(input)
}
