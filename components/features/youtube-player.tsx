"use client"

import React from 'react';
import { cn } from '@/lib/utils';

interface YouTubePlayerProps {
  youtubeUrl?: string | null;
  className?: string;
}

// Helper function to extract YouTube video ID from various URL formats
const getYouTubeId = (url: string | null | undefined): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export function YouTubePlayer({ youtubeUrl, className }: YouTubePlayerProps) {
  const videoId = getYouTubeId(youtubeUrl);

  if (!videoId) {
    return (
      <div className={cn("w-full aspect-video bg-muted rounded-lg flex items-center justify-center", className)}>
        <p className="text-muted-foreground">Invalid YouTube URL</p>
      </div>
    );
  }

  // Use the privacy-enhanced "no-cookie" domain
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;

  return (
    <div className={cn("w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg", className)}>
      <iframe
        width="100%"
        height="100%"
        src={embedUrl}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      ></iframe>
    </div>
  );
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
  const [isValid, setIsValid] = React.useState(true)

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
          !isValid ? 'border-red-500' : 'border-border'
        }`}
      />
      {!isValid && (
        <p className="text-sm text-red-600">
          Please enter a valid YouTube URL
        </p>
      )}
      {value && isValid && (
        <div className="mt-2">
          <p className="text-sm text-muted-foreground mb-2">Preview:</p>
          <YouTubePlayer youtubeUrl={value} />
        </div>
      )}
    </div>
  )
} 