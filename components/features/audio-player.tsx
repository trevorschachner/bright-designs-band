"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Download, 
  Gauge, 
  SkipBack, 
  SkipForward,
  Maximize2
} from "lucide-react"

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
}

// Global audio manager to ensure only one track plays at a time
class GlobalAudioManager {
  private activePlayerId: string | null = null
  private players: Map<string, { 
    pause: () => void
    play: () => Promise<void>
    toggle: () => void
    isPlaying: () => boolean
    getTrackInfo: () => AudioTrack | null
  }> = new Map()
  private globalKeyboardHandler: ((e: KeyboardEvent) => void) | null = null
  private listeners: Set<() => void> = new Set()

  register(id: string, controls: { 
    pause: () => void
    play: () => Promise<void>
    toggle: () => void
    isPlaying: () => boolean
    getTrackInfo: () => AudioTrack | null
  }) {
    this.players.set(id, controls)
    this.notifyListeners()
  }

  unregister(id: string) {
    this.players.delete(id)
    if (this.activePlayerId === id) {
      this.activePlayerId = null
    }
    this.notifyListeners()
  }

  setActive(id: string) {
    // Pause all other players first
    this.players.forEach((controls, playerId) => {
      if (playerId !== id && controls.isPlaying()) {
        controls.pause()
      }
    })
    // Then set this one as active
    this.activePlayerId = id
    this.notifyListeners()
  }

  getActiveId(): string | null {
    return this.activePlayerId
  }

  getActiveTrack(): AudioTrack | null {
    if (!this.activePlayerId) return null
    const controls = this.players.get(this.activePlayerId)
    return controls?.getTrackInfo() || null
  }

  isPlaying(): boolean {
    if (!this.activePlayerId) return false
    const controls = this.players.get(this.activePlayerId)
    return controls?.isPlaying() || false
  }

  toggleActive() {
    if (this.activePlayerId) {
      const controls = this.players.get(this.activePlayerId)
      if (controls) {
        // Toggle the active player
        controls.toggle()
        // Don't notify here - the toggle will trigger play/pause events
        // which will update state naturally
      }
    }
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener())
  }

  setupGlobalKeyboard() {
    if (this.globalKeyboardHandler) return

    this.globalKeyboardHandler = (e: KeyboardEvent) => {
      // Only handle spacebar if not typing in an input
      if (e.key === ' ' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        this.toggleActive()
      }
    }

    window.addEventListener('keydown', this.globalKeyboardHandler)
  }

  cleanup() {
    if (this.globalKeyboardHandler) {
      window.removeEventListener('keydown', this.globalKeyboardHandler)
      this.globalKeyboardHandler = null
    }
  }
}

export const globalAudioManager = new GlobalAudioManager()

export function AudioPlayerComponent({ tracks, title, className, compact = false }: AudioPlayerComponentProps) {
  const [currentTrack, setCurrentTrack] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)
  const [previousVolume, setPreviousVolume] = useState(0.8)
  const audioRef = useRef<HTMLAudioElement>(null)
  const playerIdRef = useRef<string>(`player-${Math.random().toString(36).substr(2, 9)}`)

  useEffect(() => {
    setIsClient(true)
    globalAudioManager.setupGlobalKeyboard()
    
    return () => {
      globalAudioManager.unregister(playerIdRef.current)
    }
  }, [])

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return
    
    const playerId = playerIdRef.current
    const audio = audioRef.current
    
    // Check actual audio state, not just React state (to avoid race conditions)
    if (!audio.paused) {
      // Currently playing, so pause
      audio.pause()
    } else {
      // Currently paused, so play
      // Only set active if not already active (prevents unnecessary pauses)
      if (globalAudioManager.getActiveId() !== playerId) {
        globalAudioManager.setActive(playerId)
      }
      // Then play this one
      audio.play().catch(() => {
        setIsPlaying(false)
      })
    }
  }, [])

  // Register/unregister with global manager
  useEffect(() => {
    if (!isClient || !audioRef.current) return

    const audio = audioRef.current
    const playerId = playerIdRef.current

    const controls = {
      pause: () => {
        if (!audio.paused) {
          audio.pause()
          setIsPlaying(false)
        }
      },
      play: async () => {
        try {
          if (audio.paused) {
            // Don't call setActive here - it's already called in togglePlayPause
            // This prevents double-triggering
            await audio.play()
            setIsPlaying(true)
          }
        } catch (error) {
          setIsPlaying(false)
          throw error
        }
      },
      toggle: () => {
        togglePlayPause()
      },
      isPlaying: () => {
        return !audio.paused && isPlaying
      },
      getTrackInfo: () => {
        return tracks[currentTrack] || null
      }
    }

    globalAudioManager.register(playerId, controls)

    return () => {
      globalAudioManager.unregister(playerId)
    }
  }, [isClient, isPlaying, togglePlayPause, tracks, currentTrack])

  // Initialize audio element
  useEffect(() => {
    if (!isClient || !audioRef.current) return

    const audio = audioRef.current
    const playerId = playerIdRef.current

    // Set initial volume to 80%
    audio.volume = 0.8

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => {
      setIsPlaying(false)
      if (currentTrack < tracks.length - 1) {
        setTimeout(() => {
          setCurrentTrack(currentTrack + 1)
        }, 500)
      }
    }

    const handlePlay = () => {
      setIsPlaying(true)
      // Don't call setActive here - it's already called in togglePlayPause
      // This prevents double-triggering
    }

    const handlePause = () => {
      setIsPlaying(false)
    }

    // Listen for pause events from other players
    const handleOtherPlayerPause = () => {
      if (globalAudioManager.getActiveId() !== playerId && isPlaying) {
        audio.pause()
        setIsPlaying(false)
      }
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
    }
  }, [isClient, currentTrack, tracks.length])

  // Update audio source when track changes
  useEffect(() => {
    if (audioRef.current && tracks[currentTrack]) {
      audioRef.current.load()
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false))
      }
    }
  }, [currentTrack, tracks])

  // Update playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate
    }
  }, [playbackRate])

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  // Local keyboard shortcuts (only for this player when active)
  useEffect(() => {
    if (!isClient) return

    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle if this player is active
      if (globalAudioManager.getActiveId() !== playerIdRef.current) return
      
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          seek(-10)
          break
        case 'ArrowRight':
          e.preventDefault()
          seek(10)
          break
        case 'ArrowUp':
          e.preventDefault()
          setVolume(Math.min(1, volume + 0.1))
          break
        case 'ArrowDown':
          e.preventDefault()
          setVolume(Math.max(0, volume - 0.1))
          break
        case 'm':
        case 'M':
          e.preventDefault()
          toggleMute()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isClient, volume])


  const seek = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds))
    }
  }

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false)
      setVolume(previousVolume)
    } else {
      setPreviousVolume(volume)
      setIsMuted(true)
    }
  }

  const handleProgressChange = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0]
    }
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
    if (value[0] > 0) {
      setIsMuted(false)
    }
  }

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleTrackChange = (index: number) => {
    setCurrentTrack(index)
    setIsPlaying(false)
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

  const currentTrackData = tracks[currentTrack]

  const playerContent = (
    <div className="space-y-6">
      {/* Track List - Spotify style */}
      {tracks.length > 1 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Tracks
          </h4>
          <div className="space-y-1">
            {tracks.map((track, index) => (
              <div
                key={track.id}
                className={`group flex items-center gap-3 p-2.5 rounded-md cursor-pointer transition-all ${
                  currentTrack === index
                    ? "bg-primary/10"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => handleTrackChange(index)}
              >
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                  {currentTrack === index && isPlaying ? (
                    <div className="w-4 h-4 flex items-center justify-center">
                      <div className="w-1 h-3 bg-primary rounded-full animate-pulse mr-0.5" style={{ animationDelay: '0ms' }} />
                      <div className="w-1 h-4 bg-primary rounded-full animate-pulse mr-0.5" style={{ animationDelay: '150ms' }} />
                      <div className="w-1 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : currentTrack === index ? (
                    <Pause className="w-4 h-4 text-primary" />
                  ) : (
                    <span className="text-xs text-muted-foreground group-hover:hidden">
                      {index + 1}
                    </span>
                  )}
                  {currentTrack !== index && (
                    <Play className="w-4 h-4 text-foreground hidden group-hover:block" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium truncate ${
                      currentTrack === index ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {track.title}
                    </span>
                    {track.type && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        {track.type}
                      </Badge>
                    )}
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Player - Spotify style */}
      <div className={compact ? "" : "border-t pt-6"}>
        {!compact && (
          <div className="mb-4">
            <h4 className="font-semibold text-lg mb-1">{currentTrackData.title}</h4>
            {currentTrackData.description && (
              <p className="text-sm text-muted-foreground">{currentTrackData.description}</p>
            )}
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-4">
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

        {/* Controls */}
        <div className="flex items-center justify-between">
          {/* Left: Track navigation */}
          <div className="flex items-center gap-2">
            {tracks.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => currentTrack > 0 && handleTrackChange(currentTrack - 1)}
                  disabled={currentTrack === 0}
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>

          {/* Center: Play/Pause */}
          <Button
            variant="ghost"
            size="icon"
            className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:scale-105 transition-transform"
            onClick={togglePlayPause}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </Button>

          {/* Right: Next track */}
          <div className="flex items-center gap-2">
            {tracks.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => currentTrack < tracks.length - 1 && handleTrackChange(currentTrack + 1)}
                disabled={currentTrack === tracks.length - 1}
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          {/* Left: Playback speed */}
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-muted-foreground" />
            <Select value={playbackRate.toString()} onValueChange={(v) => setPlaybackRate(parseFloat(v))}>
              <SelectTrigger className="w-20 h-8 text-xs border-0 bg-transparent hover:bg-muted">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.5">0.5x</SelectItem>
                <SelectItem value="0.75">0.75x</SelectItem>
                <SelectItem value="1">1x</SelectItem>
                <SelectItem value="1.25">1.25x</SelectItem>
                <SelectItem value="1.5">1.5x</SelectItem>
                <SelectItem value="2">2x</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Center: Keyboard shortcuts hint */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Space</kbd>
              <span>Play</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">←</kbd>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">→</kbd>
              <span>Seek</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">M</kbd>
              <span>Mute</span>
            </div>
          </div>

          {/* Right: Volume and Download */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 w-32">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
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
                className="flex-1"
              />
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8"
              asChild
            >
              <a 
                href={currentTrackData.url} 
                download={`${currentTrackData.title}.mp3`}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Hidden audio element */}
      {isClient && (
        <audio
          ref={audioRef}
          src={currentTrackData.url}
          preload="metadata"
          className="hidden"
        />
      )}
    </div>
  )

  if (compact) {
    return playerContent
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

// No longer needed since we're using native audio element
export const audioPlayerStyles = ``

