'use server'

import { and, eq } from 'drizzle-orm'
import { files, pendingUploads, showArrangements, shows } from '@/lib/database/schema'
import { publicStorageUrl } from '@/lib/media/public-url'
import { invalidateFileOwner } from '@/lib/services/files'
import { trackServerEvent } from '@/lib/observability/events'
import { bucketForVisibility, downloadRoute, findObject, STORAGE_ROOT_PREFIX, withRootPrefix } from '@/lib/storage'
import { createClient } from '@/lib/utils/supabase/server'
import {
  baseMime,
  buildUploadPath,
  completeUploadSchema,
  displayFileName,
  signUploadSchema,
  type CompleteUploadInput,
  type SignUploadInput,
} from '@/lib/validation/files'
import { guarded, InvalidError, NotFoundError } from './_guarded'
import type { ActionResult } from './result'

/**
 * Direct-to-Storage uploads, in two calls around the browser's PUT:
 *
 *   signUpload   → checks kind / MIME / size against lib/validation/files.ts,
 *                  that the show exists and the part is on it; builds the path
 *                  (uuid name, extension from the MIME type); records
 *                  pending_uploads; returns a signed upload URL.
 *   (browser)    → PUT the file to the signed URL.
 *   completeUpload → looks the object up in Storage and checks its size and
 *                  MIME type against the pending row; writes the `files` row
 *                  from the pending row (never from the browser) and deletes
 *                  the pending row. A mismatched object is removed.
 *
 * Public files go to the public bucket, private ones to the private bucket
 * (lib/storage.ts). See ./README.md.
 */

export type SignedUpload = {
  pendingId: string
  signedUrl: string
  token: string
  /** Object key inside `bucket` (root prefix included). */
  path: string
  bucket: string
}

const runSignUpload = guarded(
  'canUploadFiles',
  signUploadSchema,
  async (input, { db, email }) => {
    const { showId, arrangementId, kind, mimeType, size, isPublic, fileName, description, displayOrder } = input

    if (showId !== undefined) {
      const [show] = await db.select({ id: shows.id }).from(shows).where(eq(shows.id, showId)).limit(1)
      if (!show) throw new InvalidError([{ path: 'showId', message: `Unknown show id ${showId}` }])
    }
    if (arrangementId !== undefined && showId !== undefined) {
      const [link] = await db
        .select({ arrangementId: showArrangements.arrangementId })
        .from(showArrangements)
        .where(and(eq(showArrangements.showId, showId), eq(showArrangements.arrangementId, arrangementId)))
        .limit(1)
      if (!link) throw new InvalidError([{ path: 'arrangementId', message: 'That part is not on this show' }])
    }

    const storagePath = buildUploadPath({ showId, arrangementId, kind, mimeType, id: crypto.randomUUID() })
    const path = withRootPrefix(storagePath)
    const bucket = bucketForVisibility(isPublic)

    // The pending row first: an object never exists without a record of it.
    const [pending] = await db
      .insert(pendingUploads)
      .values({
        bucket,
        path,
        expectedMime: baseMime(mimeType),
        expectedSize: size,
        showId: showId ?? null,
        arrangementId: arrangementId ?? null,
        kind,
        isPublic,
        originalName: displayFileName(fileName),
        description: description || null,
        displayOrder: displayOrder ?? 0,
        createdBy: email,
      })
      .returning({ id: pendingUploads.id })

    const supabase = await createClient()
    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path)
    if (error || !data) {
      await db.delete(pendingUploads).where(eq(pendingUploads.id, pending.id))
      throw new Error(`createSignedUploadUrl failed: ${error?.message ?? 'no data'}`)
    }

    return { data: { pendingId: pending.id, signedUrl: data.signedUrl, token: data.token, path, bucket } }
  },
  'signUpload'
)

/**
 * Step 1 of an upload: validates the file's kind, MIME type and size, and
 * returns a signed URL to PUT it to. Nothing the browser sends becomes a path.
 */
export async function signUpload(input: SignUploadInput): Promise<ActionResult<SignedUpload>> {
  return runSignUpload(input)
}

// ---------------------------------------------------------------------------

export type CompletedUpload = { id: number; url: string; showId: number | null; arrangementId: number | null }

const runCompleteUpload = guarded(
  'canUploadFiles',
  completeUploadSchema,
  async ({ pendingId }, { db, email }) => {
    const supabase = await createClient()

    const outcome = await db.transaction(async (tx) => {
      // Locked so a second completeUpload for the same id waits, then finds nothing.
      const [pending] = await tx.select().from(pendingUploads).where(eq(pendingUploads.id, pendingId)).limit(1).for('update')
      if (!pending || pending.createdBy !== email) throw new NotFoundError('upload')
      if (new Date(pending.expiresAt).getTime() <= Date.now()) throw new NotFoundError('upload')

      const found = await findObject(supabase, pending.bucket, pending.path)
      if (found.status === 'error') throw new Error('Storage lookup failed')
      if (found.status === 'absent') {
        // Not uploaded (yet): keep the pending row so the browser can retry.
        throw new InvalidError([{ path: 'pendingId', message: 'The file has not reached storage. Try the upload again.' }])
      }

      const issues: { path: string; message: string }[] = []
      if (found.object.size !== pending.expectedSize) {
        issues.push({ path: 'size', message: 'The stored file is not the size that was signed' })
      }
      if (baseMime(found.object.mimetype) !== pending.expectedMime) {
        issues.push({ path: 'mimeType', message: 'The stored file is not the type that was signed' })
      }
      // Nothing is written for a mismatch; the object is removed below, after this commits.
      if (issues.length > 0) return { rejected: { issues, bucket: pending.bucket, path: pending.path } } as const

      const storagePath = pending.path.slice(STORAGE_ROOT_PREFIX.length + 1)
      const fileName = pending.path.slice(pending.path.lastIndexOf('/') + 1)
      const [inserted] = await tx
        .insert(files)
        .values({
          fileName,
          originalName: pending.originalName,
          fileType: pending.kind as 'audio' | 'image' | 'score' | 'other',
          fileSize: pending.expectedSize,
          mimeType: pending.expectedMime,
          // Private: set to the download route once the id is known (below).
          url: pending.isPublic ? publicStorageUrl(pending.bucket, pending.path) : '',
          storagePath,
          showId: pending.showId,
          arrangementId: pending.arrangementId,
          isPublic: pending.isPublic,
          description: pending.description,
          displayOrder: pending.displayOrder,
        })
        .returning({ id: files.id, url: files.url, showId: files.showId, arrangementId: files.arrangementId })

      let result = inserted
      if (!pending.isPublic) {
        const [updated] = await tx
          .update(files)
          .set({ url: downloadRoute(inserted.id) })
          .where(eq(files.id, inserted.id))
          .returning({ id: files.id, url: files.url, showId: files.showId, arrangementId: files.arrangementId })
        result = updated
      }

      // A public show-level image becomes the show's graphic, as POST /api/files did.
      if (pending.isPublic && pending.kind === 'image' && pending.showId && !pending.arrangementId) {
        await tx.update(shows).set({ graphicUrl: result.url }).where(eq(shows.id, pending.showId))
      }

      await tx.delete(pendingUploads).where(eq(pendingUploads.id, pending.id))
      return { row: result, kind: pending.kind, isPublic: pending.isPublic, bucket: pending.bucket } as const
    })

    if (outcome.rejected) {
      const { issues, bucket, path } = outcome.rejected
      const { error } = await supabase.storage.from(bucket).remove([path])
      // If the remove fails the pending row stays, so cleanup-pending-uploads removes the object later.
      if (error) throw new Error(`Removing a rejected upload failed: ${error.message}`)
      await db.delete(pendingUploads).where(eq(pendingUploads.id, pendingId))
      throw new InvalidError(issues)
    }

    const row = outcome.row
    const { kind, isPublic, bucket } = outcome
    return {
      data: row,
      invalidate: async () => {
        try {
          await invalidateFileOwner(row)
        } finally {
          await trackServerEvent('upload.completed', { fileId: row.id, kind, isPublic, bucket }, email)
        }
      },
    }
  },
  'completeUpload'
)

/**
 * Step 2 of an upload, after the PUT: checks the stored object against what
 * was signed and records the `files` row. A mismatch is `invalid` and the
 * object is removed; an unknown or expired id is `not_found`.
 */
export async function completeUpload(input: CompleteUploadInput): Promise<ActionResult<CompletedUpload>> {
  return runCompleteUpload(input)
}
