import Image from 'next/image'
import { youtubeVideoId } from '@/lib/seo/structured-data'
import { YouTubeFacadeIsland } from './youtube-player'

interface YouTubeFacadeProps {
  youtubeUrl: string | null | undefined
  /** What the video is, for the play button's accessible name. */
  title: string
  className?: string
}

/**
 * The visible video for a page that emits a VideoObject: the YouTube
 * thumbnail and a play button, server-rendered, and nothing from YouTube
 * beyond that image until the visitor clicks (YouTubeFacadeIsland). Renders
 * nothing when no video id can be read from the URL, the same rule
 * createVideoObjectSchema uses, so the schema and the player agree.
 */
export function YouTubeFacade({ youtubeUrl, title, className }: YouTubeFacadeProps) {
  const videoId = youtubeVideoId(youtubeUrl)
  if (!videoId) return null

  return (
    <YouTubeFacadeIsland videoId={videoId} title={title} className={className}>
      <Image
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt=""
        fill
        className="object-cover opacity-90 transition-opacity group-hover:opacity-100"
        sizes="(max-width: 768px) 100vw, 768px"
      />
      <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/70 text-white shadow-lg transition-transform group-hover:scale-110">
          <svg viewBox="0 0 24 24" className="ml-1 h-8 w-8" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
    </YouTubeFacadeIsland>
  )
}
