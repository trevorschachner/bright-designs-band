"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { useAudioActions, useAudioState, useAudioTime } from "@/components/features/audio/AudioProvider"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, X } from "lucide-react"

const MOBILE_QUERY = '(max-width: 640px)'

function subscribeMobile(onChange: () => void) {
  const mq = window.matchMedia(MOBILE_QUERY)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

function useIsMobile() {
  return useSyncExternalStore(
    subscribeMobile,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  )
}

/** Fixed bottom bar for the site-wide audio (AudioProvider). */
export function GlobalAudioPlayerBar() {
  const audio = useAudioActions()
  const { track, playing: isPlaying, volume, muted: isMuted, playId } = useAudioState()
  const { currentTime, duration } = useAudioTime()
  const isMobile = useIsMobile()
  // Dismissal (mobile only) lasts until playback starts again.
  const [dismissedAt, setDismissedAt] = useState<number | null>(null)
  const isDismissed = isMobile && dismissedAt === playId
  // Ring highlight for 1.5 s each time playback starts.
  const [highlightDoneFor, setHighlightDoneFor] = useState(0)
  const highlight = isPlaying && highlightDoneFor !== playId

  useEffect(() => {
    if (!isPlaying) return
    const timer = setTimeout(() => setHighlightDoneFor(playId), 1500)
    return () => clearTimeout(timer)
  }, [isPlaying, playId])

  const trackTitle = track?.title ?? null
  const trackImage = track?.imageUrl?.trim() ? track.imageUrl : null

  const togglePlayPause = () => audio.toggle()

  const toggleMute = () => {
    audio.setMuted(!isMuted)
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    audio.setVolume(newVolume)
    audio.setMuted(newVolume === 0)
  }

  const handleProgressChange = (value: number[]) => {
    audio.seek(value[0])
  }

  const skipBackward = () => audio.seek(currentTime - 10)
  const skipForward = () => audio.seek(currentTime + 10)

  const canSeek = track !== null

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleDismiss = () => {
    audio.pause()
    setDismissedAt(playId)
  }

  if (!track || isDismissed) return null

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-[100] bg-background/95 backdrop-blur-sm border-t border-border shadow-lg transition-all duration-500 ${highlight ? 'ring-2 ring-primary border-primary shadow-[0_-5px_20px_-5px_hsl(var(--primary)/0.3)]' : ''}`}>
      <div className="container mx-auto px-4 py-3">
        <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center gap-4'}`}>
          {/* Track Info */}
          <div className={`flex items-center gap-3 w-full ${isMobile ? '' : 'flex-1 min-w-0'}`}>
            <div className={`flex-shrink-0 rounded-md overflow-hidden bg-muted flex items-center justify-center ${isMobile ? 'w-10 h-10' : 'w-12 h-12'}`}>
              {trackImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={trackImage}
                  alt={trackTitle || 'Track cover'}
                  className="w-full h-full object-cover"
                />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Play className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate text-foreground">{trackTitle}</div>
              {isMobile && (
                <div className="text-[11px] text-muted-foreground">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              )}
            </div>
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto h-8 w-8 text-muted-foreground"
                onClick={handleDismiss}
                aria-label="Close audio player"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Player Controls */}
          <div className={`flex ${isMobile ? 'w-full justify-between items-center' : 'flex-col items-center gap-2 flex-1 max-w-2xl'}`}>
            <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-2'}`}>
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  onClick={skipBackward}
                  aria-label="Skip backward 10 seconds"
                  disabled={!canSeek}
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant={isMobile ? 'default' : 'ghost'}
                size={isMobile ? 'icon' : 'icon'}
                className={isMobile ? 'h-10 w-10 rounded-full bg-primary text-primary-foreground' : 'h-8 w-8'}
                onClick={togglePlayPause}
                aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
              >
                {isPlaying ? (
                  <Pause className={isMobile ? 'w-4 h-4' : 'w-4 h-4 fill-current'} />
                ) : (
                  <Play className={isMobile ? 'w-4 h-4 ml-0.5' : 'w-4 h-4 fill-current ml-0.5'} />
                )}
              </Button>
              {isMobile && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10"
                    onClick={skipForward}
                    aria-label="Skip forward 10 seconds"
                    disabled={!canSeek}
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10"
                    onClick={toggleMute}
                    aria-label={isMuted || volume === 0 ? 'Unmute audio' : 'Mute audio'}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </Button>
                </>
              )}
            </div>
            
            {/* Progress Bar */}
            <div className={`${isMobile ? 'w-full flex items-center gap-2 mt-2' : 'w-full flex items-center gap-2'}`}>
              {!isMobile && (
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {formatTime(currentTime)}
                </span>
              )}
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleProgressChange}
                className="flex-1 cursor-pointer"
              />
              {!isMobile && (
                <span className="text-xs text-muted-foreground w-10">
                  {formatTime(duration)}
                </span>
              )}
            </div>
          </div>

          {/* Volume Control */}
          {!isMobile && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleMute}
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
                className="w-24"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
