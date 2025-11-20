"use client"

import { AudioPlayerComponent } from './audio-player'
import type { AudioTrack } from './audio-player'

interface ArrangementAudioPlayerProps {
  arrangementId: number
  trackIndex: number
  tracks: AudioTrack[]
  compact?: boolean
}

export function ArrangementAudioPlayer({ 
  arrangementId, 
  trackIndex, 
  tracks, 
  compact 
}: ArrangementAudioPlayerProps) {
  const handleTrackSelect = () => {
    // Dispatch event to master player
    window.dispatchEvent(new CustomEvent('master-player-play-track', {
      detail: { trackIndex }
    }))
  }

  return (
    <AudioPlayerComponent
      tracks={tracks}
      compact={compact}
      onTrackSelect={handleTrackSelect}
    />
  )
}

