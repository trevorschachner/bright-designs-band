"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Volume2, VolumeX, Download, SkipBack, SkipForward } from "lucide-react"
import { Waveform } from "@/components/ui/waveform"
import { useAudio, type AudioTrack as PlayableTrack } from "@/components/features/audio/AudioProvider"

export interface AudioTrack {
  id: string
  title: string
  duration?: string
  description?: string
  type?: string
  url: string
  imageUrl?: string
}

interface AudioPlayerComponentProps {
  tracks: AudioTrack[]
  title?: string
  className?: string
  compact?: boolean
  onPreviousTrack?: () => void // Callback for previous track navigation
  onNextTrack?: () => void // Callback for next track navigation
  showNavigation?: boolean // Show previous/next buttons
  allowDownload?: boolean // Allow downloading the audio file
  showTitle?: string // Show these tracks belong to (shown in analytics/bar metadata)
}

const toPlayable = (track: AudioTrack, showTitle?: string): PlayableTrack => ({
  src: track.url,
  title: track.title,
  showTitle,
  arrangementId: track.id,
  imageUrl: track.imageUrl,
})

/**
 * Track list and controls for one page's audio. Playback happens in the
 * site-wide AudioProvider (one <audio> element in the root layout), so this
 * component only reflects and drives that shared state.
 */
export function AudioPlayerComponent({
  tracks,
  title,
  className,
  compact = false,
  onPreviousTrack,
  onNextTrack,
  showNavigation = false,
  allowDownload = true,
  showTitle,
}: AudioPlayerComponentProps) {
  const audio = useAudio()
  const [selectedTrack, setSelectedTrack] = useState(0)

  const queue = useMemo(() => tracks.map((t) => toPlayable(t, showTitle)), [tracks, showTitle])
  const loadedIndex = audio.track ? tracks.findIndex((t) => t.url === audio.track?.src) : -1
  const isMine = loadedIndex >= 0
  const currentTrack = isMine ? loadedIndex : selectedTrack
  const currentTrackData = tracks[currentTrack]
  const isPlaying = isMine && audio.playing
  const currentTime = isMine ? audio.currentTime : 0
  const duration = isMine ? audio.duration : 0
  const volume = audio.volume
  const isMuted = audio.muted

  // Until anything has played, the global bar shows this page's first track,
  // as it did when it scanned the page for <audio> elements. The cue is
  // released when the player unmounts so the next page can cue its own.
  const { started, cue, release } = audio
  const hasLoaded = audio.track !== null
  useEffect(() => {
    if (started || hasLoaded || !queue[0]) return
    cue(queue[0], queue)
  }, [started, hasLoaded, queue, cue])
  const firstSrc = queue[0]?.src
  useEffect(() => {
    if (!firstSrc) return
    return () => release(firstSrc)
  }, [firstSrc, release])

  const togglePlayPause = () => {
    if (isMine) {
      audio.toggle()
    } else if (currentTrackData) {
      audio.play(queue[currentTrack], queue)
    }
  }

  const handleProgressChange = (value: number[]) => {
    if (isMine) audio.seek(value[0])
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    audio.setVolume(newVolume)
    audio.setMuted(newVolume === 0)
  }

  const toggleMute = () => {
    audio.setMuted(!isMuted)
  }

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleTrackChange = (index: number, autoPlay: boolean = false) => {
    setSelectedTrack(index)
    if (autoPlay) {
      audio.play(queue[index], queue)
    } else if (isMine) {
      audio.cue(queue[index], queue)
    }
  }

  const handlePreviousTrack = () => {
    if (onPreviousTrack) {
      onPreviousTrack()
    } else if (currentTrack > 0) {
      handleTrackChange(currentTrack - 1, isPlaying)
    }
  }

  const handleNextTrack = () => {
    if (onNextTrack) {
      onNextTrack()
    } else if (currentTrack < tracks.length - 1) {
      handleTrackChange(currentTrack + 1, isPlaying)
    }
  }

  if (!tracks || tracks.length === 0) {
    if (compact) {
      return <p className="text-muted-foreground text-sm">No audio available</p>
    }
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Audio Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">No audio files available</p>
        </CardContent>
      </Card>
    )
  }

  const playerContent = (
    <div className={compact ? "space-y-3 flex-1 flex flex-col" : "space-y-4"}>
      {/* Track List - Simple and clean */}
      {tracks.length > 1 && !compact && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Tracks
          </h4>
          <div className="space-y-1">
            {tracks.map((track, index) => (
              <button
                key={track.id}
                onClick={() => handleTrackChange(index)}
                className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  currentTrack === index
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-muted/50 border border-transparent"
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-full bg-muted">
                  {currentTrack === index && isPlaying ? (
                    <Pause className="w-4 h-4 text-primary" />
                  ) : (
                    <Play className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {track.title}
                  </div>
                  {track.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {track.description}
                    </p>
                  )}
                </div>
                {track.duration && (
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {track.duration}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Compact track list for compact mode */}
      {tracks.length > 1 && compact && (
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {tracks.length} Tracks
          </h4>
          <div className="space-y-1">
            {tracks.map((track, index) => (
              <button
                key={track.id}
                onClick={() => handleTrackChange(index, true)}
                className={`w-full text-left flex items-center gap-2 p-2 rounded transition-colors text-xs ${
                  currentTrack === index
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-muted/50 border border-transparent"
                }`}
              >
                <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 rounded-full bg-muted">
                  {currentTrack === index && isPlaying ? (
                    <Pause className="w-3 h-3 text-primary" />
                  ) : (
                    <Play className="w-3 h-3 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0 truncate text-xs font-medium">
                  {track.title}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Player Controls */}
      <div className={compact ? "" : "border-t pt-4"}>
        {!compact && currentTrackData && (
          <div className="mb-4">
            <h4 className="font-semibold text-lg mb-1">{currentTrackData.title}</h4>
            {currentTrackData.description && (
              <p className="text-sm text-muted-foreground">{currentTrackData.description}</p>
            )}
          </div>
        )}

        {/* Current Track Info (compact mode) */}
        {compact && currentTrackData && (
          <div className="mb-2">
            <h4 className="font-semibold text-sm mb-0.5 truncate">{currentTrackData.title}</h4>
            {currentTrackData.description && (
              <p className="text-xs text-muted-foreground truncate">{currentTrackData.description}</p>
            )}
          </div>
        )}

        {/* Progress Bar */}
        <div className={compact ? "mb-2" : "mb-4"}>
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleProgressChange}
            className="w-full cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls Row */}
        <div className={`flex items-center ${compact ? 'gap-2' : 'gap-4'} ${compact ? 'justify-between' : 'justify-between'}`}>
          {/* Navigation and Play Controls */}
          <div className="flex items-center gap-2">
            {/* Previous Track Button */}
            {showNavigation && tracks.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className={compact ? "h-8 w-8" : "h-10 w-10"}
                onClick={handlePreviousTrack}
                disabled={currentTrack === 0}
              >
                <SkipBack className={compact ? "w-4 h-4" : "w-5 h-5"} />
              </Button>
            )}
            
            {/* Play/Pause Button */}
            <Button
              variant="default"
              size="icon"
              className={compact ? "h-10 w-10 rounded-full" : "h-12 w-12 rounded-full"}
              onClick={togglePlayPause}
            >
              {isPlaying ? (
                <Pause className={compact ? "w-4 h-4 fill-current" : "w-5 h-5 fill-current"} />
              ) : (
                <Play className={compact ? "w-4 h-4 fill-current ml-0.5" : "w-5 h-5 fill-current ml-0.5"} />
              )}
            </Button>

            {/* Next Track Button */}
            {showNavigation && tracks.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className={compact ? "h-8 w-8" : "h-10 w-10"}
                onClick={handleNextTrack}
                disabled={currentTrack === tracks.length - 1}
              >
                <SkipForward className={compact ? "w-4 h-4" : "w-5 h-5"} />
              </Button>
            )}
          </div>

          {/* Volume Control */}
          <div className={`flex items-center gap-2 ${compact ? 'flex-1 max-w-[150px]' : 'flex-1 max-w-[200px]'}`}>
            <Button
              variant="ghost"
              size="icon"
              className={compact ? "h-7 w-7 flex-shrink-0" : "h-8 w-8 flex-shrink-0"}
              onClick={toggleMute}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
              ) : (
                <Volume2 className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className={compact ? "flex-1 min-w-[60px]" : "flex-1"}
            />
          </div>

          {/* Download Button */}
          {currentTrackData && !compact && allowDownload && (
            <Button 
              variant="outline" 
              size="sm"
              asChild
            >
              <a 
                href={currentTrackData.url} 
                download={`${currentTrackData.title || 'audio'}.mp3`}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  )

  if (compact) {
    return (
      <Card className={`${className} h-full flex flex-col`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {isPlaying ? (
              <Waveform isPlaying={true} className="text-primary" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
            {title || "Audio Preview"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 flex-1 flex flex-col">
          {playerContent}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isPlaying ? (
            <Waveform isPlaying={true} className="text-primary" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
          {title || "Audio Preview"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {playerContent}
      </CardContent>
    </Card>
  )
}

export const audioPlayerStyles = ``
