"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from "lucide-react"
import { globalAudioManager } from "./audio-player"
import type { AudioTrack } from "./audio-player"

export function GlobalAudioPlayerBar() {
  const [track, setTrack] = useState<AudioTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    // Set initial volume on all audio elements to 80%
    const setVolumeOnElements = () => {
      const audioElements = document.querySelectorAll('audio')
      audioElements.forEach(audio => {
        audio.volume = 0.8
      })
    }
    
    setVolumeOnElements()

    // Subscribe to global audio manager changes
    const unsubscribe = globalAudioManager.subscribe(() => {
      const activeTrack = globalAudioManager.getActiveTrack()
      const playing = globalAudioManager.isPlaying()
      setTrack(activeTrack)
      setIsPlaying(playing)
      // Update volume on any new audio elements
      setVolumeOnElements()
    })

    // Initial state
    setTrack(globalAudioManager.getActiveTrack())
    setIsPlaying(globalAudioManager.isPlaying())

    // Also listen to play/pause events on audio elements
    const handlePlayPause = () => {
      setIsPlaying(globalAudioManager.isPlaying())
      // Update track in case it changed
      setTrack(globalAudioManager.getActiveTrack())
    }

    // Listen for new audio elements being added
    const observer = new MutationObserver(() => {
      setVolumeOnElements()
      const audioElements = document.querySelectorAll('audio')
      audioElements.forEach(audio => {
        audio.addEventListener('play', handlePlayPause)
        audio.addEventListener('pause', handlePlayPause)
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    const audioElements = document.querySelectorAll('audio')
    audioElements.forEach(audio => {
      audio.addEventListener('play', handlePlayPause)
      audio.addEventListener('pause', handlePlayPause)
    })

    return () => {
      unsubscribe()
      observer.disconnect()
      audioElements.forEach(audio => {
        audio.removeEventListener('play', handlePlayPause)
        audio.removeEventListener('pause', handlePlayPause)
      })
    }
  }, [])

  // Update time and duration from active player's audio element
  useEffect(() => {
    if (!track) {
      setCurrentTime(0)
      setDuration(0)
      return
    }

    const updateTime = () => {
      const audioElements = document.querySelectorAll('audio')
      audioElements.forEach(audio => {
        if (audio.src.includes(track.url) || audio.src.includes(encodeURIComponent(track.url))) {
          setCurrentTime(audio.currentTime)
          if (audio.duration) {
            setDuration(audio.duration)
          }
        }
      })
    }

    // Initial update
    updateTime()

    // Set up interval for time updates
    const interval = setInterval(updateTime, 100)

    // Also listen to timeupdate events on audio elements
    const audioElements = document.querySelectorAll('audio')
    const handlers: Array<{ element: HTMLAudioElement; handler: () => void }> = []
    
    audioElements.forEach(audio => {
      if (audio.src.includes(track.url) || audio.src.includes(encodeURIComponent(track.url))) {
        const handler = () => {
          setCurrentTime(audio.currentTime)
          if (audio.duration) {
            setDuration(audio.duration)
          }
        }
        audio.addEventListener('timeupdate', handler)
        audio.addEventListener('loadedmetadata', handler)
        handlers.push({ element: audio, handler })
      }
    })

    return () => {
      clearInterval(interval)
      handlers.forEach(({ element, handler }) => {
        element.removeEventListener('timeupdate', handler)
        element.removeEventListener('loadedmetadata', handler)
      })
    }
  }, [track])

  const togglePlayPause = () => {
    globalAudioManager.toggleActive()
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    // Update volume on all audio elements
    const audioElements = document.querySelectorAll('audio')
    audioElements.forEach(audio => {
      audio.volume = isMuted ? volume : 0
    })
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
    const audioElements = document.querySelectorAll('audio')
    audioElements.forEach(audio => {
      audio.volume = newVolume
    })
  }

  const handleProgressChange = (value: number[]) => {
    const newTime = value[0]
    setCurrentTime(newTime)
    // Update the audio element's currentTime
    const audioElements = document.querySelectorAll('audio')
    audioElements.forEach(audio => {
      if (track && (audio.src.includes(track.url) || audio.src.includes(encodeURIComponent(track.url)))) {
        audio.currentTime = newTime
      }
    })
  }

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!track) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-background/95 backdrop-blur-sm border-t border-border shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Track Info */}
          <div className="flex-1 min-w-0 flex items-center gap-4">
            <div className="flex-shrink-0 w-14 h-14 bg-muted rounded-md flex items-center justify-center">
              <Play className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{track.title}</div>
              {track.description && (
                <div className="text-xs text-muted-foreground truncate">{track.description}</div>
              )}
            </div>
          </div>

          {/* Player Controls */}
          <div className="flex flex-col items-center gap-2 flex-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={togglePlayPause}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </Button>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-10 text-right">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleProgressChange}
                className="flex-1 cursor-pointer"
              />
              <span className="text-xs text-muted-foreground w-10">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Volume Control */}
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
        </div>
      </div>
    </div>
  )
}

