/**
 * Browser-side direct upload: sign → PUT to Storage → record the row.
 *
 * The two API routes (`POST /api/files/sign`, `POST /api/files`) stay until
 * SP3 Task 4 moves them to Server Actions; this is the one place that calls
 * them, so the show editor, the new-show page and `useFileUpload` share it.
 */

export type UploadFileType = 'image' | 'audio' | 'youtube' | 'pdf' | 'score' | 'other'

/** The recorded file row, as POST /api/files returns it (id and url are what callers use). */
export type UploadedFile = { id: number; url: string } & Record<string, unknown>

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

type Envelope<T> = { success?: boolean; data?: T; error?: string }

async function readEnvelope<T>(response: Response, fallback: string): Promise<T> {
  const text = await response.text()
  let body: Envelope<T> | null = null
  try {
    body = text ? (JSON.parse(text) as Envelope<T>) : null
  } catch {
    body = null
  }
  if (!response.ok || !body?.data) throw new Error(body?.error || text || fallback)
  return body.data
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
  const signed = await readEnvelope<{ signedUrl: string; storagePath: string }>(
    await fetch('/api/files/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, fileType, showId, arrangementId, isPublic }),
    }),
    'Failed to get upload URL'
  )

  onProgress?.(20)
  const put = await fetch(signed.signedUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file })
  if (!put.ok) throw new Error(`Storage upload failed: ${put.statusText} ${await put.text()}`)

  onProgress?.(80)
  const recorded = await readEnvelope<UploadedFile>(
    await fetch('/api/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storagePath: signed.storagePath,
        fileName: file.name,
        fileType,
        fileSize: file.size,
        mimeType: file.type,
        showId,
        arrangementId,
        isPublic,
        description,
        displayOrder,
      }),
    }),
    'Failed to record file upload'
  )
  onProgress?.(100)
  return recorded
}
