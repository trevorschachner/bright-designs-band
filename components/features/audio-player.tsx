"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Volume2, VolumeX, Download } from "lucide-react"

export interface AudioTrack {
  id: string
  title: string
  duration?: string
  description?: string
  type?: string
  url: string
}

interface AudioPlayerComponentProps {
  tracks: AudioTrack[]
  title?: string
  className?: string
  compact?: boolean
  playerId?: string // Unique ID for this player instance
  onTrackSelect?: (trackIndex: number) => void // Callback when track should be selected in master player
}

// Custom event for master player control
const MASTER_PLAYER_EVENT = 'master-player-play-track'

export function AudioPlayerComponent({ 
  tracks, 
  title, 
  className, 
  compact = false,
  playerId,
  onTrackSelect 
}: AudioPlayerComponentProps) {
  const [currentTrack, setCurrentTrack] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const isMasterPlayer = playerId === 'master-player'

  const currentTrackData = tracks[currentTrack]

  // Listen for master player events (only master player listens)
  useEffect(() => {
    if (!isMasterPlayer) return

    const handleMasterPlay = (e: CustomEvent) => {
      const { trackIndex } = e.detail
      if (typeof trackIndex === 'number' && trackIndex >= 0 && trackIndex < tracks.length) {
        setCurrentTrack(trackIndex)
        setIsPlaying(true)
        // Force play after a short delay to ensure audio is loaded
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().catch(() => setIsPlaying(false))
          }
        }, 100)
      }
    }

    window.addEventListener(MASTER_PLAYER_EVENT as any, handleMasterPlay as EventListener)
    return () => {
      window.removeEventListener(MASTER_PLAYER_EVENT as any, handleMasterPlay as EventListener)
    }
  }, [isMasterPlayer, tracks.length])

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) return

    const audio = audioRef.current
    audio.volume = volume

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => {
      if (audio.duration) {
        setDuration(audio.duration)
      }
    }
    const handleEnded = () => {
      setCurrentTime(0)
      if (currentTrack < tracks.length - 1) {
        // Auto-play next track
        shouldAutoPlayRef.current = true
        setCurrentTrack(currentTrack + 1)
      } else {
        // Reached the end
        setIsPlaying(false)
      }
    }
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('canplay', updateDuration)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('canplay', updateDuration)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
    }
  }, [currentTrack, tracks.length])

  // Track if we should auto-play (used for seamless transitions)
  const shouldAutoPlayRef = useRef(false)

  // Update audio source when track changes
  useEffect(() => {
    if (audioRef.current && currentTrackData) {
      audioRef.current.load()
      
      // Auto-play if explicitly requested (for auto-play next track)
      if (shouldAutoPlayRef.current) {
        shouldAutoPlayRef.current = false
        const playTimer = setTimeout(() => {
          audioRef.current?.play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false))
        }, 200)
        return () => clearTimeout(playTimer)
      } else if (isPlaying) {
        // Normal play/pause state
        audioRef.current.play().catch(() => setIsPlaying(false))
      }
    }
  }, [currentTrack, currentTrackData, isPlaying])

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  const togglePlayPause = () => {
    if (!audioRef.current) return
    
    // If this is not the master player and has onTrackSelect, trigger master player instead
    if (!isMasterPlayer && onTrackSelect && tracks.length === 1) {
      // Find this track in the master player's track list
      onTrackSelect(0) // For single-track players, always select track 0
      return
    }
    
    if (audioRef.current.paused) {
      audioRef.current.play().catch(() => setIsPlaying(false))
    } else {
      audioRef.current.pause()
    }
  }

  const handleProgressChange = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleTrackChange = (index: number) => {
    setCurrentTrack(index)
    setCurrentTime(0)
    // If master player, start playing the selected track
    if (isMasterPlayer) {
      setIsPlaying(true)
      // Audio will auto-play when track changes due to useEffect
    } else {
      setIsPlaying(false)
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
                onClick={() => handleTrackChange(index)}
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
          {currentTrackData && !compact && (
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

      {/* Hidden audio element */}
      <div data-track-title={currentTrackData?.title || 'Audio'}>
        <audio
          ref={audioRef}
          src={currentTrackData?.url}
          preload="metadata"
          className="hidden"
        />
      </div>
    </div>
  )

  if (compact) {
    return (
      <Card className={`${className} h-full flex flex-col`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Volume2 className="w-5 h-5" />
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
          <Volume2 className="w-5 h-5" />
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
