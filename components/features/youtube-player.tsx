'use client'

import { useState } from 'react'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Play, ExternalLink, AlertCircle } from 'lucide-react'

interface YouTubePlayerProps {
  url: string
  title?: string
  className?: string
  autoplay?: boolean
  showControls?: boolean
}

export function YouTubePlayer({ 
  url, 
  title, 
  className = '',
  autoplay = false,
  showControls = true 
}: YouTubePlayerProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Extract YouTube video ID from various URL formats
  const getYouTubeVideoId = (url: string): string | null => {
    const regexes = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtu\.be\/([^&\n?#]+)/
    ]

    for (const regex of regexes) {
      const match = url.match(regex)
      if (match && match[1]) {
        return match[1]
      }
    }
    return null
  }

  const videoId = getYouTubeVideoId(url)

  if (!videoId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Invalid YouTube URL. Please check the link and try again.
        </AlertDescription>
      </Alert>
    )
  }

  if (hasError) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Unable to load YouTube video. 
          <Button variant="link" className="p-0 h-auto ml-2" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3 h-3 mr-1" />
              Watch on YouTube
            </a>
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Build embed URL with parameters
  const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`)
  embedUrl.searchParams.set('rel', '0') // Don't show related videos
  embedUrl.searchParams.set('modestbranding', '1') // Modest branding
  if (autoplay) embedUrl.searchParams.set('autoplay', '1')
  if (!showControls) embedUrl.searchParams.set('controls', '0')

  return (
    <div className={`youtube-player ${className}`}>
      <AspectRatio ratio={16 / 9}>
        <iframe
          src={embedUrl.toString()}
          title={title || 'YouTube video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full rounded-lg"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      </AspectRatio>
      
      {/* Fallback link */}
      <div className="mt-2 flex items-center justify-between">
        <Button variant="link" className="p-0 h-auto text-sm" asChild>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-3 h-3 mr-1" />
            Watch on YouTube
          </a>
        </Button>
        {title && (
          <span className="text-sm text-gray-600 truncate ml-2">{title}</span>
        )}
      </div>
    </div>
  )
}

// Utility function to validate YouTube URLs
export function isValidYouTubeUrl(url: string): boolean {
  const regexes = [
    /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/,
    /^https?:\/\/(www\.)?youtube\.com\/watch\?.*v=/,
    /^https?:\/\/(www\.)?youtube\.com\/v\//,
    /^https?:\/\/(www\.)?youtube\.com\/embed\//,
    /^https?:\/\/youtu\.be\//
  ]

  return regexes.some(regex => regex.test(url))
}

// Component for YouTube URL input with validation
interface YouTubeUrlInputProps {
  value: string
  onChange: (url: string) => void
  placeholder?: string
  className?: string
}

export function YouTubeUrlInput({ 
  value, 
  onChange, 
  placeholder = "Enter YouTube URL (e.g., https://youtu.be/dQw4w9WgXcQ)",
  className = ""
}: YouTubeUrlInputProps) {
  const [isValid, setIsValid] = useState(true)

  const handleChange = (newValue: string) => {
    onChange(newValue)
    
    if (newValue.trim() === '') {
      setIsValid(true)
      return
    }
    
    setIsValid(isValidYouTubeUrl(newValue))
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        type="url"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-bright-primary ${
          !isValid ? 'border-red-500' : 'border-gray-300'
        }`}
      />
      {!isValid && (
        <p className="text-sm text-red-600">
          Please enter a valid YouTube URL
        </p>
      )}
      {value && isValid && (
        <div className="mt-2">
          <p className="text-sm text-gray-600 mb-2">Preview:</p>
          <YouTubePlayer url={value} />
        </div>
      )}
    </div>
  )
} 