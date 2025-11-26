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
  const [hasHadAudio, setHasHadAudio] = useState(false) // Track if we've ever had audio
  const [highlight, setHighlight] = useState(false)
  const activeAudioRef = useRef<HTMLAudioElement | null>(null)

  // Trigger highlight when playback starts
  useEffect(() => {
    if (isPlaying) {
      setHighlight(true)
      const timer = setTimeout(() => setHighlight(false), 1500)
      return () => clearTimeout(timer)
    }
  }, [isPlaying])

  // Find and track the currently playing or recently played audio element
  useEffect(() => {
    const findActiveAudio = () => {
      const audioElements = document.querySelectorAll('audio')
      
      // First, try to find currently playing audio
      for (const audio of audioElements) {
        if (!audio.paused && !audio.ended) {
          activeAudioRef.current = audio
          setHasHadAudio(true)
          return audio
        }
      }
      
      // If no playing audio, check if we have a previously tracked audio that still exists
      if (activeAudioRef.current && document.contains(activeAudioRef.current)) {
        setHasHadAudio(true)
        return activeAudioRef.current
      }
      
      // If we've had audio before, try to find any audio element (even if paused)
      if (hasHadAudio && audioElements.length > 0) {
        // Prefer the first audio element that has been interacted with
        for (const audio of audioElements) {
          if (audio.currentTime > 0 || audio.duration > 0) {
            activeAudioRef.current = audio
            return audio
          }
        }
        // Fallback to first audio element
        activeAudioRef.current = audioElements[0]
        return audioElements[0]
      }
      
      // If no audio has been played yet, use first available
      if (audioElements.length > 0) {
        activeAudioRef.current = audioElements[0]
        setHasHadAudio(true)
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
          const title = container.getAttribute('data-track-title')
          if (title) {
            setTrackTitle(title)
          }
        } else {
          // Try to get title from data attributes on audio element itself
          const audioTitle = audio.getAttribute('data-track-title') || 
                           audio.getAttribute('aria-label') ||
                           'Audio'
          setTrackTitle(audioTitle)
        }
      } else {
        // Only hide if we've never had audio or all audio elements are gone
        const audioElements = document.querySelectorAll('audio')
        if (audioElements.length === 0 && !hasHadAudio) {
          setIsPlaying(false)
          setCurrentTime(0)
          setDuration(0)
          setTrackTitle(null)
          setHasHadAudio(false)
          activeAudioRef.current = null
        } else if (hasHadAudio && activeAudioRef.current) {
          // Keep player visible with last known state
          setIsPlaying(false)
          setCurrentTime(activeAudioRef.current.currentTime)
          if (activeAudioRef.current.duration) {
            setDuration(activeAudioRef.current.duration)
          }
          // Keep track title
          const container = activeAudioRef.current.closest('[data-track-title]')
          if (container) {
            const title = container.getAttribute('data-track-title')
            if (title) setTrackTitle(title)
          }
        }
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

  // Show player if we have a track title OR if we've had audio before (even if paused)
  if (!trackTitle && !hasHadAudio) return null

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-[100] bg-background/95 backdrop-blur-sm border-t border-border shadow-lg transition-all duration-500 ${highlight ? 'ring-2 ring-primary border-primary shadow-[0_-5px_20px_-5px_hsl(var(--primary)/0.3)]' : ''}`}>
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
