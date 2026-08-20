/**
 * Pure planning logic for the media egress optimization (scripts/optimize-media.mjs).
 *
 * Kept free of I/O so the risky part — deciding which rows change and what every
 * column becomes — is testable without touching Supabase or the database.
 */

export type MediaKind = 'image' | 'audio'

export type FileRow = {
  id: number
  storagePath: string
  url: string
  originalName: string
  fileName: string
  mimeType: string
  fileSize: number
}

export type OptimizationTarget = {
  kind: MediaKind
  sourceExt: string
  targetExt: string
  targetMime: string
}

export const IMAGE_TARGET: OptimizationTarget = {
  kind: 'image',
  sourceExt: 'png',
  targetExt: 'webp',
  targetMime: 'image/webp',
}

export const AUDIO_TARGET: OptimizationTarget = {
  kind: 'audio',
  sourceExt: 'wav',
  targetExt: 'mp3',
  targetMime: 'audio/mpeg',
}

/**
 * Every column in the schema that can hold an absolute Supabase Storage URL.
 * Derived from information_schema; update this list if new url columns appear,
 * or a migration will silently leave dangling references behind.
 */
export const REFERENCING_COLUMNS: { table: string; column: string }[] = [
  { table: 'shows', column: 'thumbnail_url' },
  { table: 'shows', column: 'graphic_url' },
  { table: 'shows', column: 'video_url' },
  { table: 'resources', column: 'image_url' },
  { table: 'resources', column: 'file_url' },
  { table: 'arrangements', column: 'sample_score_url' },
]

export type FilePlan = {
  id: number
  kind: MediaKind
  oldStoragePath: string
  newStoragePath: string
  oldUrl: string
  newUrl: string
  newFileName: string
  newOriginalName: string
  newMimeType: string
  oldMimeType: string
  oldFileSize: number
  oldFileName: string
  oldOriginalName: string
}

export type UrlRewrite = {
  table: string
  column: string
  oldValue: string
  newValue: string
}

const SAFE_IDENTIFIER = /^[a-z_][a-z0-9_]*$/

/**
 * Guard for identifiers that get interpolated into SQL.
 *
 * The rewrite statements must interpolate table and column names — Postgres
 * does not allow those as bind parameters. REFERENCING_COLUMNS is a hardcoded
 * constant today, so nothing untrusted reaches here; this exists so that stops
 * being true loudly rather than silently if the list ever becomes dynamic.
 */
export function assertSafeIdentifier(identifier: string): void {
  if (!SAFE_IDENTIFIER.test(identifier)) {
    throw new Error(`Unsafe SQL identifier: ${JSON.stringify(identifier)}`)
  }
}

const extensionOf = (value: string): string => {
  const lastDot = value.lastIndexOf('.')
  const lastSlash = value.lastIndexOf('/')
  if (lastDot === -1 || lastDot < lastSlash) return ''
  return value.slice(lastDot + 1).toLowerCase()
}

/** Swap the final extension, appending one if the value has none. */
export function replaceExtension(value: string, targetExt: string): string {
  const current = extensionOf(value)
  if (!current) return `${value}.${targetExt}`
  return `${value.slice(0, value.length - current.length - 1)}.${targetExt}`
}

/**
 * Swap the extension on a URL's path while leaving query, hash, and any
 * percent-encoding elsewhere in the URL byte-for-byte intact.
 */
export function replaceUrlExtension(url: string, targetExt: string): string {
  const suffixStart = url.search(/[?#]/)
  const path = suffixStart === -1 ? url : url.slice(0, suffixStart)
  const suffix = suffixStart === -1 ? '' : url.slice(suffixStart)
  return `${replaceExtension(path, targetExt)}${suffix}`
}

/**
 * Build the change set for one file, or null if the row needs no work —
 * either it is already optimized or its extension is not what we convert.
 * Returning null on re-runs is what makes the migration idempotent.
 */
export function planFile(row: FileRow, target: OptimizationTarget): FilePlan | null {
  if (extensionOf(row.storagePath) !== target.sourceExt) return null

  return {
    id: row.id,
    kind: target.kind,
    oldStoragePath: row.storagePath,
    newStoragePath: replaceExtension(row.storagePath, target.targetExt),
    oldUrl: row.url,
    newUrl: replaceUrlExtension(row.url, target.targetExt),
    newFileName: replaceExtension(row.fileName, target.targetExt),
    newOriginalName: replaceExtension(row.originalName, target.targetExt),
    newMimeType: target.targetMime,
    oldMimeType: row.mimeType,
    oldFileSize: row.fileSize,
    oldFileName: row.fileName,
    oldOriginalName: row.originalName,
  }
}

/** The per-column URL rewrites needed so nothing keeps pointing at the original. */
export function planUrlRewrites(oldUrl: string, newUrl: string): UrlRewrite[] {
  return REFERENCING_COLUMNS.map(({ table, column }) => {
    assertSafeIdentifier(table)
    assertSafeIdentifier(column)
    return { table, column, oldValue: oldUrl, newValue: newUrl }
  })
}
