/**
 * YouTube URL helpers. Pure, no React: shared by client components and
 * Server Actions (lib/actions/files.ts), which cannot import from a
 * 'use client' module.
 */

const VALID_URL_PATTERNS = [
  /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/,
  /^https?:\/\/(www\.)?youtube\.com\/watch\?.*v=/,
  /^https?:\/\/(www\.)?youtube\.com\/v\//,
  /^https?:\/\/(www\.)?youtube\.com\/embed\//,
  /^https?:\/\/youtu\.be\//,
]

export function isValidYouTubeUrl(url: string): boolean {
  return VALID_URL_PATTERNS.some((regex) => regex.test(url))
}

const VIDEO_ID_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  /youtube\.com\/v\/([^&\n?#]+)/,
  /youtube\.com\/embed\/([^&\n?#]+)/,
  /youtu\.be\/([^&\n?#]+)/,
]

/** The video id in a YouTube URL, or null. */
export function youTubeVideoId(url: string): string | null {
  for (const regex of VIDEO_ID_PATTERNS) {
    const match = url.match(regex)
    if (match?.[1]) return match[1]
  }
  return null
}
