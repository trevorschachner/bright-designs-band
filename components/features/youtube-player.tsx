"use client"

import React from 'react';
import { cn } from '@/lib/utils';
import { youTubeVideoId } from '@/lib/youtube';

interface YouTubePlayerProps {
  youtubeUrl?: string | null;
  className?: string;
}

export function YouTubePlayer({ youtubeUrl, className }: YouTubePlayerProps) {
  const videoId = youTubeVideoId(youtubeUrl);

  if (!videoId) {
    return (
      <div className={cn("w-full aspect-video bg-muted rounded-lg flex items-center justify-center", className)}>
        <p className="text-muted-foreground">Invalid YouTube URL</p>
      </div>
    );
  }

  // Use the privacy-enhanced "no-cookie" domain
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;

  return (
    <div className={cn("w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg", className)}>
      <iframe
        width="100%"
        height="100%"
        src={embedUrl}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      ></iframe>
    </div>
  );
}

interface YouTubeFacadeIslandProps {
  /** An 11-character YouTube video id. */
  videoId: string;
  /** Accessible name for the play button and the iframe. */
  title: string;
  className?: string;
  /** The server-rendered poster (thumbnail and play button). */
  children: React.ReactNode;
}

/**
 * Click-to-load YouTube. Until the visitor presses play, the page carries only
 * the server-rendered poster passed as `children`: no iframe, no YouTube
 * script, no third-party request but the thumbnail. The press swaps in the
 * privacy-enhanced (youtube-nocookie.com) player, autoplaying.
 */
export function YouTubeFacadeIsland({ videoId, title, className, children }: YouTubeFacadeIslandProps) {
  const [playing, setPlaying] = React.useState(false);

  return (
    <div className={cn("relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg", className)}>
      {playing ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Play video: ${title}`}
          className="group absolute inset-0 h-full w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {children}
        </button>
      )}
    </div>
  );
}
