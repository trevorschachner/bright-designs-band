import { getStorageBucket, getStorageRootPrefix, shouldSkipSupabase } from '@/lib/env'
import { publicStorageUrl } from '@/lib/media/public-url'

/**
 * The one image that stands for a show: cards, the show page hero, the audio
 * player cover, the arrangement page fallback and the OG image all ask here.
 * Pure and client-safe (public env only).
 *
 * Precedence: `graphicUrl`, then `thumbnailUrl`, then `imageUrl` (the show's
 * first public image file, in display order). The graphic is the show's art:
 * a public show-level upload sets it (lib/actions/uploads.ts). The thumbnail
 * is the admin's "set as thumbnail" pick and holds the same file for almost
 * every show, so it only matters when the graphic is empty. The first image
 * covers shows whose art was uploaded before either column was set.
 */

export type ShowArtSource = {
  graphicUrl?: string | null
  thumbnailUrl?: string | null
  /** The show's first public image file (`files.url`). */
  imageUrl?: string | null
}

/**
 * Storage path or absolute URL to a public URL. Null when it cannot be built.
 * Stored values are full public URLs today; a bare path (`shows/1/image/a.webp`,
 * relative to the storage root prefix) is still accepted.
 */
export function toPublicUrl(path: string | null | undefined): string | null {
  const value = path?.trim()
  if (!value) return null
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  if (shouldSkipSupabase()) return null
  try {
    return publicStorageUrl(getStorageBucket(), `${getStorageRootPrefix()}/${value}`)
  } catch {
    return null
  }
}

/** The show's art as a public URL, or null when it has none. */
export function showArt(show: ShowArtSource | null | undefined): string | null {
  if (!show) return null
  return toPublicUrl(show.graphicUrl) ?? toPublicUrl(show.thumbnailUrl) ?? toPublicUrl(show.imageUrl)
}
