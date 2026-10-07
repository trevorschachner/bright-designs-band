import { completeUpload, signUpload } from '@/lib/actions/uploads'
import type { ActionResult } from '@/lib/actions/result'
import type { UploadKind } from '@/lib/validation/files'

/**
 * Browser-side direct upload: signUpload → PUT to Storage → completeUpload.
 *
 * The one place uploads start, so the show editor, the new-show page, the
 * resources admin and `useFileUpload` share it. The browser sends only the
 * file's name (display), type and size; the server builds the path, picks the
 * bucket, and records the row after checking the stored object.
 */

export type UploadFileType = 'image' | 'audio' | 'youtube' | 'pdf' | 'score' | 'other'

/** The recorded file row (id and url are what callers use). */
export type UploadedFile = { id: number; url: string; showId: number | null; arrangementId: number | null }

export type DirectUploadOptions = {
  file: File
  fileType: UploadFileType
  showId?: number
  arrangementId?: number
  isPublic?: boolean
  description?: string
  displayOrder?: number
  /** 0–100, reported between steps. */
  onProgress?: (percent: number) => void
}

/** Upload kinds the server knows. A PDF is stored as a score (same limits and types). */
export function uploadKindFor(fileType: UploadFileType): UploadKind {
  switch (fileType) {
    case 'image':
    case 'audio':
    case 'score':
    case 'other':
      return fileType
    case 'pdf':
      return 'score'
    case 'youtube':
      throw new Error('A YouTube link is not a file upload')
  }
}

/** The upload type for a resource attachment, from its MIME type. */
export function resourceFileType(file: File): UploadFileType {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('audio/')) return 'audio'
  return 'other'
}

const MESSAGES: Record<string, string> = {
  forbidden: 'You do not have permission to upload files',
  not_found: 'The upload expired or was not found. Try again.',
  failed: 'The upload failed. Try again.',
}

function unwrap<T>(result: ActionResult<T>, fallback: string): T {
  if (result.ok) return result.data
  throw new Error(result.issues?.[0]?.message ?? MESSAGES[result.error] ?? fallback)
}

export async function uploadFileDirect({
  file,
  fileType,
  showId,
  arrangementId,
  isPublic = true,
  description,
  displayOrder = 0,
  onProgress,
}: DirectUploadOptions): Promise<UploadedFile> {
  onProgress?.(10)
  const signed = unwrap(
    await signUpload({
      showId,
      arrangementId,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      kind: uploadKindFor(fileType),
      isPublic,
      description: description || null,
      displayOrder,
    }),
    'Failed to get upload URL'
  )

  onProgress?.(20)
  // The signed URL carries its token. Content-Type becomes the object's
  // mimetype, which completeUpload checks against what was signed.
  const put = await fetch(signed.signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type, 'Cache-Control': 'max-age=2592000', 'x-upsert': 'false' },
    body: file,
  })
  if (!put.ok) throw new Error(`Storage upload failed: ${put.statusText} ${await put.text()}`)

  onProgress?.(80)
  const recorded = unwrap(await completeUpload({ pendingId: signed.pendingId }), 'Failed to record file upload')
  onProgress?.(100)
  return recorded
}
