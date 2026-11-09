'use client';

import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAudioActions, useAudioState, type AudioTrack } from "@/components/features/audio/AudioProvider";

/**
 * Play/pause for one catalog row, through the site-wide player (the bar shows
 * progress). Reads play state only, never the time, so `timeupdate` does not
 * re-render the table.
 */
export function CatalogPlayButton({ track, variant }: { track: AudioTrack; variant: 'table' | 'round' | 'poster' }) {
  const { play, pause } = useAudioActions();
  const { track: loaded, playing } = useAudioState();
  const isThisPlaying = playing && loaded?.src === track.src;
  const onClick = () => (isThisPlaying ? pause() : play(track));
  const label = `${isThisPlaying ? 'Pause' : 'Play'} ${track.title}`;

  if (variant === 'poster') {
    // Over cover art: solid, so it reads on any image.
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={label}
      >
        {isThisPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
      </button>
    );
  }

  if (variant === 'round') {
    return (
      <button
        type="button"
        onClick={onClick}
        className="shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
        aria-label={label}
      >
        {isThisPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>
    );
  }

  return (
    <Button type="button" variant="outline" size="sm" className="h-8 gap-2" onClick={onClick} aria-label={label}>
      {isThisPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      {isThisPlaying ? 'Pause' : 'Play'}
    </Button>
  );
}
