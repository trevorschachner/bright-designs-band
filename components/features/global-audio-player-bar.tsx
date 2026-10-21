"use client"

import { useEffect, useRef, useState, type RefObject } from "react"
import Image from "next/image"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { useAudioActions, useAudioState, useAudioTime } from "@/components/features/audio/AudioProvider"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, X } from "lucide-react"

const formatTime = (seconds: number) => {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Pads the page bottom by the bar's rendered height (0 while it is hidden),
 * so the bar never covers the footer or the last row of content.
 */
function usePadBodyFor(ref: RefObject<HTMLElement | null>, mounted: boolean) {
  useEffect(() => {
    const el = ref.current
    if (!mounted || !el || typeof ResizeObserver === 'undefined') return
    const apply = () => {
      document.body.style.paddingBottom = el.offsetHeight ? `${el.offsetHeight}px` : ''
    }
    const observer = new ResizeObserver(apply)
    observer.observe(el)
    apply()
    return () => {
      observer.disconnect()
      document.body.style.paddingBottom = ''
    }
  }, [ref, mounted])
}

/** Phone: a thin progress line along the bar's top edge, with a 24 px hit area. */
function ScrubLine() {
  const { currentTime, duration } = useAudioTime()
  const { seek } = useAudioActions()
  return (
    <SliderPrimitive.Root
      value={[currentTime]}
      max={duration || 100}
      step={0.1}
      onValueChange={(value) => seek(value[0])}
      aria-label="Seek"
      className="absolute inset-x-0 top-0 -translate-y-1/2 flex h-6 w-full touch-none select-none items-center cursor-pointer sm:hidden"
    >
      <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden bg-secondary">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb aria-label="Seek" className="block h-3 w-3 rounded-full bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
    </SliderPrimitive.Root>
  )
}

/** Desktop: progress slider with elapsed and total time. */
function Progress() {
  const { currentTime, duration } = useAudioTime()
  const { seek } = useAudioActions()
  return (
    <div className="hidden sm:flex w-full items-center gap-2">
      <span className="text-xs text-muted-foreground w-10 text-right">{formatTime(currentTime)}</span>
      <Slider
        value={[currentTime]}
        max={duration || 100}
        step={0.1}
        onValueChange={(value) => seek(value[0])}
        aria-label="Seek"
        className="flex-1 cursor-pointer"
      />
      <span className="text-xs text-muted-foreground w-10">{formatTime(duration)}</span>
    </div>
  )
}

/**
 * Fixed bottom bar for the site-wide audio (AudioProvider). Responsive by
 * CSS only (no matchMedia), so the first paint already has the right layout:
 * one ~64 px row on phones, the full bar from `sm` up.
 */
export function GlobalAudioPlayerBar() {
  const audio = useAudioActions()
  const { track, queue, playing: isPlaying, volume, muted: isMuted, playId, started } = useAudioState()
  const barRef = useRef<HTMLDivElement>(null)
  // Closing (phones only) lasts until playback starts again.
  const [dismissedAt, setDismissedAt] = useState<number | null>(null)
  // Ring highlight for 1.5 s each time playback starts.
  const [highlightDoneFor, setHighlightDoneFor] = useState(0)
  const highlight = isPlaying && highlightDoneFor !== playId

  useEffect(() => {
    if (!isPlaying) return
    const timer = setTimeout(() => setHighlightDoneFor(playId), 1500)
    return () => clearTimeout(timer)
  }, [isPlaying, playId])

  usePadBodyFor(barRef, track !== null)

  if (!track) return null

  const trackImage = track.imageUrl?.trim() ? track.imageUrl : null
  const index = queue.findIndex((t) => t.src === track.src)
  const hasQueue = queue.length > 1
  // On phones a track that is only cued stays in the page player; the bar
  // appears once something plays.
  const hiddenOnPhone = !started || dismissedAt === playId

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    audio.setVolume(newVolume)
    audio.setMuted(newVolume === 0)
  }

  const handleDismiss = () => {
    audio.pause()
    setDismissedAt(playId)
  }

  return (
    <div
      ref={barRef}
      data-testid="audio-bar"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-[100] bg-background/95 backdrop-blur-sm border-t border-border shadow-lg transition-shadow duration-500 pb-[env(safe-area-inset-bottom)]',
        hiddenOnPhone && 'hidden sm:block',
        highlight && 'ring-2 ring-primary border-primary shadow-[0_-5px_20px_-5px_hsl(var(--primary)/0.3)]',
      )}
    >
      <ScrubLine />
      <div className="container mx-auto px-3 sm:px-4 h-16 sm:h-auto sm:py-3 flex items-center gap-2 sm:gap-4">
        {/* Track info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 rounded-md overflow-hidden bg-muted flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12">
            {trackImage ? (
              // Through the image optimizer at thumbnail size: the cover is a
              // show graphic that can be several MB at full resolution.
              <Image
                src={trackImage}
                alt={track.title || 'Track cover'}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Play className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate text-foreground">{track.title}</div>
            {track.showTitle && (
              <div className="text-xs text-muted-foreground truncate">{track.showTitle}</div>
            )}
          </div>
        </div>

        {/* Controls: inline in the row on phones, a column with the progress bar from sm up */}
        <div className="contents sm:flex sm:flex-col sm:items-center sm:gap-2 sm:flex-1 sm:max-w-2xl">
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {hasQueue && (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 sm:h-8 sm:w-8"
                onClick={audio.previous}
                disabled={index <= 0}
                aria-label="Previous track"
              >
                <SkipBack className="w-5 h-5 sm:w-4 sm:h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 sm:h-8 sm:w-8 sm:rounded-md sm:bg-transparent sm:text-foreground sm:hover:bg-accent"
              onClick={audio.toggle}
              aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 sm:w-4 sm:h-4 fill-current" />
              ) : (
                <Play className="w-5 h-5 sm:w-4 sm:h-4 fill-current ml-0.5" />
              )}
            </Button>
            {hasQueue && (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 sm:h-8 sm:w-8"
                onClick={audio.next}
                disabled={index < 0 || index >= queue.length - 1}
                aria-label="Next track"
              >
                <SkipForward className="w-5 h-5 sm:w-4 sm:h-4" />
              </Button>
            )}
          </div>
          <Progress />
        </div>

        {/* Volume (desktop; phones use the hardware buttons) */}
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => audio.setMuted(!isMuted)}
            aria-label={isMuted || volume === 0 ? 'Unmute audio' : 'Mute audio'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            aria-label="Volume"
            className="w-24"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 flex-shrink-0 text-muted-foreground sm:hidden"
          onClick={handleDismiss}
          aria-label="Close audio player"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}
