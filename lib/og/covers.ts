import sharp from 'sharp'
import { showArt, type ShowArtSource } from '@/lib/media/show-art'
import { getFeaturedShows } from '@/lib/services/shows'

/** A cover tile on a text card: 16:9, the shape show art is made in. */
export const COVER = { width: 272, height: 153 }

/**
 * One show's art as a JPEG data URL at the given size, or null. Satori can't
 * decode WebP (all show art is WebP), and its decode failure surfaces
 * mid-stream, so the art is converted before Satori ever sees it.
 */
export async function artDataUrl(url: string, size: { width: number; height: number }, revalidate = 604800): Promise<string | null> {
  try {
    const res = await fetch(url, { next: { revalidate } })
    if (!res.ok) return null
    const jpeg = await sharp(Buffer.from(await res.arrayBuffer()))
      .resize(size.width, size.height, { fit: 'cover' })
      .jpeg({ quality: 82 })
      .toBuffer()
    return `data:image/jpeg;base64,${jpeg.toString('base64')}`
  } catch {
    return null
  }
}

/** Cover tiles for a list of shows, skipping any without art. At most `max`. */
export async function coversFor(shows: ShowArtSource[], max = 7): Promise<string[]> {
  const urls = shows.map((show) => showArt(show)).filter((url): url is string => Boolean(url)).slice(0, max)
  const tiles = await Promise.all(urls.map((url) => artDataUrl(url, COVER)))
  return tiles.filter((tile): tile is string => Boolean(tile))
}

/** The featured shows' covers, the same ones the home page leads with. Empty on any failure. */
export async function featuredCovers(): Promise<string[]> {
  try {
    return await coversFor(await getFeaturedShows())
  } catch {
    return []
  }
}
