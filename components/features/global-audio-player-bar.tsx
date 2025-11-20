"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Volume2, VolumeX } from "lucide-react"

export function GlobalAudioPlayerBar() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)
  const [trackTitle, setTrackTitle] = useState<string | null>(null)
  const activeAudioRef = useRef<HTMLAudioElement | null>(null)

  // Find and track the currently playing audio element
  useEffect(() => {
    const findActiveAudio = () => {
      const audioElements = document.querySelectorAll('audio')
      for (const audio of audioElements) {
        if (!audio.paused && !audio.ended) {
          activeAudioRef.current = audio
          return audio
        }
      }
      // If no playing audio, use the first one if it exists
      if (audioElements.length > 0 && !activeAudioRef.current) {
        activeAudioRef.current = audioElements[0]
        return audioElements[0]
      }
      return null
    }

    const updateState = () => {
      const audio = findActiveAudio()
      if (audio) {
        setIsPlaying(!audio.paused && !audio.ended)
        setCurrentTime(audio.currentTime)
        if (audio.duration) {
          setDuration(audio.duration)
        }
        // Try to get track title from parent elements
        const container = audio.closest('[data-track-title]')
        if (container) {
          setTrackTitle(container.getAttribute('data-track-title'))
        } else {
          setTrackTitle('Audio')
        }
      } else {
        setIsPlaying(false)
        setCurrentTime(0)
        setDuration(0)
        setTrackTitle(null)
      }
    }

    // Initial update
    updateState()

    // Set up interval for updates
    const interval = setInterval(updateState, 100)

    // Listen to all audio events
    const handleAudioEvent = () => {
      updateState()
    }

    const audioElements = document.querySelectorAll('audio')
    audioElements.forEach(audio => {
      audio.addEventListener('play', handleAudioEvent)
      audio.addEventListener('pause', handleAudioEvent)
      audio.addEventListener('timeupdate', handleAudioEvent)
      audio.addEventListener('loadedmetadata', handleAudioEvent)
      audio.addEventListener('ended', handleAudioEvent)
    })

    // Watch for new audio elements
    const observer = new MutationObserver(() => {
      const newAudioElements = document.querySelectorAll('audio')
      newAudioElements.forEach(audio => {
        audio.addEventListener('play', handleAudioEvent)
        audio.addEventListener('pause', handleAudioEvent)
        audio.addEventListener('timeupdate', handleAudioEvent)
        audio.addEventListener('loadedmetadata', handleAudioEvent)
        audio.addEventListener('ended', handleAudioEvent)
      })
      updateState()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    return () => {
      clearInterval(interval)
      observer.disconnect()
      audioElements.forEach(audio => {
        audio.removeEventListener('play', handleAudioEvent)
        audio.removeEventListener('pause', handleAudioEvent)
        audio.removeEventListener('timeupdate', handleAudioEvent)
        audio.removeEventListener('loadedmetadata', handleAudioEvent)
        audio.removeEventListener('ended', handleAudioEvent)
      })
    }
  }, [])

  // Update volume on all audio elements
  useEffect(() => {
    const audioElements = document.querySelectorAll('audio')
    audioElements.forEach(audio => {
      audio.volume = isMuted ? 0 : volume
    })
  }, [volume, isMuted])

  const togglePlayPause = () => {
    const audio = activeAudioRef.current || document.querySelector('audio')
    if (audio) {
      if (audio.paused) {
        audio.play().catch(() => setIsPlaying(false))
      } else {
        audio.pause()
      }
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const handleProgressChange = (value: number[]) => {
    const newTime = value[0]
    setCurrentTime(newTime)
    const audio = activeAudioRef.current || document.querySelector('audio')
    if (audio) {
      audio.currentTime = newTime
    }
  }

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!trackTitle) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-background/95 backdrop-blur-sm border-t border-border shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Track Info */}
          <div className="flex-1 min-w-0 flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-muted rounded-md flex items-center justify-center">
              {isPlaying ? (
                <Pause className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Play className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{trackTitle}</div>
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
