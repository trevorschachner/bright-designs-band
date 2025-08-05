"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Play, Pause, Volume2, Download } from "lucide-react"

// Dynamically import the audio player to avoid SSR issues
const AudioPlayer = dynamic(
  () => import("react-h5-audio-player"),
  { ssr: false }
)

interface AudioTrack {
  id: string
  title: string
  duration?: string
  description?: string
  type?: string // e.g., "Full Track", "Excerpt", "Movement 1", etc.
  url: string
}

interface AudioPlayerComponentProps {
  tracks: AudioTrack[]
  title?: string
  className?: string
}

export function AudioPlayerComponent({ tracks, title, className }: AudioPlayerComponentProps) {
  const [currentTrack, setCurrentTrack] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!tracks || tracks.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Audio Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">No audio files available</p>
        </CardContent>
      </Card>
    )
  }

  const handleTrackChange = (index: number) => {
    setCurrentTrack(index)
    setIsPlaying(false)
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          {title || "Audio Preview"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Track List */}
        {tracks.length > 1 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700">Available Tracks:</h4>
            <div className="grid gap-2">
              {tracks.map((track, index) => (
                <div
                  key={track.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    currentTrack === index
                      ? "bg-bright-primary/10 border-bright-primary"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
                  onClick={() => handleTrackChange(index)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{track.title}</span>
                      {track.type && (
                        <Badge variant="outline" className="text-xs">
                          {track.type}
                        </Badge>
                      )}
                    </div>
                    {track.description && (
                      <p className="text-xs text-gray-600 mt-1">{track.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {track.duration && (
                      <span className="text-xs text-gray-500">{track.duration}</span>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTrackChange(index)
                      }}
                    >
                      {currentTrack === index && isPlaying ? (
                        <Pause className="w-3 h-3" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Track Info */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-medium">{tracks[currentTrack].title}</h4>
              {tracks[currentTrack].description && (
                <p className="text-sm text-gray-600">{tracks[currentTrack].description}</p>
              )}
            </div>
            {tracks[currentTrack].type && (
              <Badge variant="secondary">{tracks[currentTrack].type}</Badge>
            )}
          </div>

          {/* Audio Player - Only render on client side */}
          {isClient && (
            <div className="audio-player-container">
              <AudioPlayer
                src={tracks[currentTrack].url}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                showJumpControls={false}
                showSkipControls={tracks.length > 1}
                onClickNext={() => {
                  if (currentTrack < tracks.length - 1) {
                    handleTrackChange(currentTrack + 1)
                  }
                }}
                onClickPrevious={() => {
                  if (currentTrack > 0) {
                    handleTrackChange(currentTrack - 1)
                  }
                }}
                customAdditionalControls={[]}
                customVolumeControls={[]}
                layout="horizontal-reverse"
                className="shadow-none border-0"
                style={{
                  backgroundColor: 'transparent',
                  color: '#374151',
                }}
              />
            </div>
          )}

          {/* Loading placeholder for SSR */}
          {!isClient && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-500 text-center">Loading audio player...</p>
            </div>
          )}

          {/* Download Button */}
          <div className="flex justify-end mt-3">
            <Button 
              variant="outline" 
              size="sm"
              asChild
            >
              <a 
                href={tracks[currentTrack].url} 
                download={`${tracks[currentTrack].title}.mp3`}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Custom styles for the audio player
export const audioPlayerStyles = `
  .audio-player-container .rhap_container {
    background-color: transparent !important;
    box-shadow: none !important;
    border: none !important;
  }
  
  .audio-player-container .rhap_main {
    background-color: #f9fafb !important;
    border-radius: 0.5rem !important;
    padding: 0.75rem !important;
  }
  
  .audio-player-container .rhap_play-pause-button {
    color: #F5DF4D !important;
  }
  
  .audio-player-container .rhap_volume-button {
    color: #374151 !important;
  }
  
  .audio-player-container .rhap_progress-filled {
    background-color: #F5DF4D !important;
  }
  
  .audio-player-container .rhap_progress-indicator {
    background-color: #F5DF4D !important;
    border: 2px solid #F5DF4D !important;
  }
` 