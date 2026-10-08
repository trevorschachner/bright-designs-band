import { z } from 'zod';

// ---------------------------------------------------------------------------
// Uploads (lib/actions/uploads.ts). The server decides everything that reaches
// the database: the path, the extension, the bucket, and (after checking the
// stored object) the size and MIME type. The browser's file name is kept for
// display only.
// ---------------------------------------------------------------------------

export const UPLOAD_KINDS = ['audio', 'image', 'score', 'other'] as const
export type UploadKind = (typeof UPLOAD_KINDS)[number]

const MB = 1024 * 1024

/** Largest object accepted per kind, in bytes. */
export const UPLOAD_SIZE_LIMITS: Record<UploadKind, number> = {
  image: 10 * MB,
  audio: 100 * MB,
  score: 50 * MB,
  other: 100 * MB,
}

/**
 * Every MIME type an upload may have, and the extension the server gives the
 * object. The extension never comes from the browser's file name.
 */
export const MIME_EXTENSIONS: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/wave': 'wav',
  'audio/aac': 'aac',
  'audio/mp4': 'm4a',
  'audio/m4a': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/ogg': 'ogg',
  'application/pdf': 'pdf',
  'application/vnd.recordare.musicxml+xml': 'musicxml',
  'application/vnd.recordare.musicxml': 'mxl',
  'application/zip': 'zip',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
}

/**
 * MIME types accepted per kind. `other` is a fixed list too (documents,
 * spreadsheets, MusicXML, zip): an arbitrary type is never accepted, so
 * nothing the browser could render as HTML or script is stored.
 */
export const UPLOAD_MIME_TYPES: Record<UploadKind, readonly string[]> = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/aac', 'audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/ogg'],
  score: ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.recordare.musicxml+xml', 'application/vnd.recordare.musicxml'],
  other: [
    'application/pdf',
    'application/zip',
    'text/plain',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.recordare.musicxml+xml',
    'application/vnd.recordare.musicxml',
  ],
}

/** `type/subtype` without parameters, lower-cased (`Text/Plain; charset=x` → `text/plain`). */
export function baseMime(mime: string | null | undefined): string {
  return String(mime ?? '').split(';')[0].trim().toLowerCase()
}

/** The extension for an allowed MIME type, or null. */
export function extensionForMime(mime: string): string | null {
  return MIME_EXTENSIONS[baseMime(mime)] ?? null
}

/** Whether `mime` is allowed for `kind`. */
export function isAllowedMime(kind: UploadKind, mime: string): boolean {
  return UPLOAD_MIME_TYPES[kind].includes(baseMime(mime)) && extensionForMime(mime) !== null
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Storage path for an upload, relative to the root prefix (the form `files`
 * rows keep in `storage_path`):
 *
 *   shows/<showId>/[arrangements/<arrId>/]<kind>/<uuid>.<ext>
 *   resources/<kind>/<uuid>.<ext>          (no show: resource attachments)
 *
 * Every segment is a number, a fixed word or a server-generated uuid, so
 * nothing from the browser can introduce `..`, a slash or an odd character.
 */
export function buildUploadPath(input: {
  showId?: number | null
  arrangementId?: number | null
  kind: UploadKind
  mimeType: string
  id: string
}): string {
  const { showId, arrangementId, kind, mimeType, id } = input
  const ext = extensionForMime(mimeType)
  if (!ext) throw new Error(`No extension for MIME type ${mimeType}`)
  if (!UUID_RE.test(id)) throw new Error('Upload id must be a uuid')
  if (!UPLOAD_KINDS.includes(kind)) throw new Error(`Unknown upload kind ${kind}`)
  const positive = (n: number) => Number.isInteger(n) && n > 0
  if (showId != null && !positive(showId)) throw new Error('showId must be a positive integer')
  if (arrangementId != null && !positive(arrangementId)) throw new Error('arrangementId must be a positive integer')
  if (arrangementId != null && showId == null) throw new Error('A part upload needs its show')
  const file = `${id}.${ext}`
  if (showId == null) return `resources/${kind}/${file}`
  if (arrangementId != null) return `shows/${showId}/arrangements/${arrangementId}/${kind}/${file}`
  return `shows/${showId}/${kind}/${file}`
}

/**
 * The browser's file name, for display only (`files.original_name`): no
 * directories, no control characters, at most 200 characters.
 */
export function displayFileName(name: string): string {
  const leaf = String(name ?? '').split(/[\\/]/).pop() ?? ''
  const cleaned = leaf.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 200)
  return cleaned && cleaned !== '.' && cleaned !== '..' ? cleaned : 'upload'
}

const rowId = z.number().int().positive()

/**
 * `signUpload`. `showId` is required for show and part files; resource
 * attachments (the resources admin) send none and land under `resources/`.
 * `mimeType` must be allowed for `kind`, and `size` within its limit.
 */
export const signUploadSchema = z
  .object({
    showId: rowId.optional(),
    arrangementId: rowId.optional(),
    fileName: z.string().min(1, 'File name is required').max(1000),
    mimeType: z.string().min(1, 'File type is required').max(255),
    size: z.number().int().positive('The file is empty'),
    kind: z.enum(UPLOAD_KINDS),
    isPublic: z.boolean(),
    description: z.string().trim().max(500).nullable().optional(),
    displayOrder: z.number().int().min(0).max(10_000).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (!isAllowedMime(data.kind, data.mimeType)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['mimeType'], message: `This file type is not accepted for ${data.kind} files` })
    }
    const limit = UPLOAD_SIZE_LIMITS[data.kind]
    if (data.size > limit) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['size'], message: `Max file size is ${Math.round(limit / MB)} MB for ${data.kind} files` })
    }
    if (data.arrangementId !== undefined && data.showId === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['showId'], message: 'A part upload needs its show' })
    }
  })
export type SignUploadInput = z.input<typeof signUploadSchema>

export const completeUploadSchema = z.object({ pendingId: z.string().regex(UUID_RE, 'Unknown upload') }).strict()
export type CompleteUploadInput = z.input<typeof completeUploadSchema>

// ---------------------------------------------------------------------------
// Server Action payloads (lib/actions/files.ts). Strict: unknown keys rejected.
// ---------------------------------------------------------------------------

const fileRowId = z.number().int().positive();

/**
 * `setShowThumbnail`: point the show's thumbnail at one of its image files
 * (`fileId`), at a URL (`url`), or clear it (`url: null`). Exactly one of
 * `fileId` / `url` is required (checked by the action).
 */
export const setShowThumbnailSchema = z
  .object({
    showId: fileRowId,
    fileId: fileRowId.optional(),
    url: z.string().trim().max(2000, 'URL is too long').nullable().optional(),
  })
  .strict();
export type SetShowThumbnailInput = z.input<typeof setShowThumbnailSchema>;

/** `attachYouTube`: a YouTube link stored as a file row on a show and/or a part. */
export const attachYouTubeSchema = z
  .object({
    showId: fileRowId.optional(),
    arrangementId: fileRowId.optional(),
    url: z.string().trim().min(1, 'YouTube URL is required').max(500, 'URL is too long'),
    description: z.string().trim().max(500).nullable().optional(),
    isPublic: z.boolean().optional(),
    displayOrder: z.number().int().min(0).max(10_000).optional(),
  })
  .strict();
export type AttachYouTubeInput = z.input<typeof attachYouTubeSchema>;

export const fileIdSchema = z.object({ id: fileRowId }).strict();
