/**
 * Create a show through the admin API and, when a poster was chosen, upload it
 * and save it as the show's thumbnail.
 *
 * Every admin route answers with the `{ success, data }` envelope from
 * `lib/utils/api-helpers.ts`. The new-show page used to read `result.id` off
 * `POST /api/shows`, which is always undefined under that envelope, so the
 * thumbnail step never ran and the page still reported success. The id is read
 * from the envelope here, and a thumbnail failure is returned rather than
 * swallowed.
 *
 * The flow is the same one the show editor and `useFileUpload` run:
 * sign → PUT the bytes to Storage → record the `files` row → save the URL on
 * the show. `fetchImpl` is injectable so the sequence is testable in Node.
 */

export type CreateShowInput = {
  /** Body for `POST /api/shows`, minus `tags`. */
  payload: Record<string, unknown>
  tags: number[]
  thumbnail: File | null
}

export type CreateShowResult =
  | { status: 'created'; showId: number; thumbnailUrl: string | null }
  | { status: 'created_without_thumbnail'; showId: number; error: string }

type Envelope = { success?: boolean; data?: unknown; error?: string; details?: unknown }

async function readJson(response: Response): Promise<{ json: Envelope | null; text: string }> {
  const text = await response.text()
  if (!text) return { json: null, text }
  try {
    return { json: JSON.parse(text) as Envelope, text }
  } catch {
    return { json: null, text }
  }
}

function errorMessage(json: Envelope | null, text: string, fallback: string): string {
  if (json?.error) {
    const details = json.details ? ` (${JSON.stringify(json.details)})` : ''
    return `${json.error}${details}`
  }
  return text || fallback
}

async function uploadThumbnail(showId: number, file: File, fetchImpl: typeof fetch): Promise<string> {
  const signResponse = await fetchImpl('/api/files/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName: file.name, fileType: 'image', showId, isPublic: true }),
  })
  const sign = await readJson(signResponse)
  if (!signResponse.ok || !sign.json?.data) {
    throw new Error(errorMessage(sign.json, sign.text, 'Failed to get upload URL'))
  }
  const { signedUrl, storagePath } = sign.json.data as { signedUrl: string; storagePath: string }

  const uploadResponse = await fetchImpl(signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })
  if (!uploadResponse.ok) {
    const text = await uploadResponse.text()
    throw new Error(`Storage upload failed: ${uploadResponse.statusText} ${text}`.trim())
  }

  const recordResponse = await fetchImpl('/api/files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      storagePath,
      fileName: file.name,
      fileType: 'image',
      fileSize: file.size,
      mimeType: file.type,
      showId,
      isPublic: true,
      description: 'Show thumbnail',
      displayOrder: 0,
    }),
  })
  const record = await readJson(recordResponse)
  if (!recordResponse.ok) {
    throw new Error(errorMessage(record.json, record.text, 'Failed to record file upload'))
  }
  const url = (record.json?.data as { url?: string } | undefined)?.url
  if (!url) throw new Error('File was recorded but no URL came back')

  const saveResponse = await fetchImpl(`/api/shows/${showId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    // Tags are left out on purpose: PUT replaces them only when they are sent,
    // and they were already written by the create call.
    body: JSON.stringify({ thumbnailUrl: url }),
  })
  const save = await readJson(saveResponse)
  if (!saveResponse.ok) {
    throw new Error(errorMessage(save.json, save.text, 'Failed to save thumbnail on the show'))
  }
  return url
}

export async function createShowWithThumbnail(
  input: CreateShowInput,
  fetchImpl: typeof fetch = fetch
): Promise<CreateShowResult> {
  const { payload, tags, thumbnail } = input

  const createResponse = await fetchImpl('/api/shows', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, tags }),
  })
  const created = await readJson(createResponse)
  if (!createResponse.ok) {
    throw new Error(errorMessage(created.json, created.text, 'Failed to create show'))
  }

  const showId = (created.json?.data as { id?: unknown } | undefined)?.id
  if (typeof showId !== 'number') {
    throw new Error('Show was created but the response had no id, so the thumbnail could not be attached')
  }

  if (!thumbnail) return { status: 'created', showId, thumbnailUrl: null }

  try {
    const thumbnailUrl = await uploadThumbnail(showId, thumbnail, fetchImpl)
    return { status: 'created', showId, thumbnailUrl }
  } catch (error) {
    return {
      status: 'created_without_thumbnail',
      showId,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
