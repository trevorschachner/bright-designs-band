/**
 * YouTube URL helpers, the one parser for the whole site. Pure, no React:
 * shared by client components (the player and the facade), the SEO
 * VideoObject, and Server Actions (lib/actions/files.ts), which cannot import
 * from a 'use client' module. A URL the admin accepts is exactly a URL the
 * public page can play and describe.
 */

const VIDEO_ID =
  /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/

/** The 11-character video id from any common YouTube URL form, or null. */
export function youTubeVideoId(url: string | null | undefined): string | null {
  if (!url) return null
  return url.match(VIDEO_ID)?.[1] ?? null
}

/** An http(s) URL with a readable YouTube video id. */
export function isValidYouTubeUrl(url: string): boolean {
  return /^https?:\/\//.test(url) && youTubeVideoId(url) !== null
}
