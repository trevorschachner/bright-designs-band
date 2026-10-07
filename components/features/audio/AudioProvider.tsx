'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

export interface AudioTrack {
  src: string
  title: string
  showTitle?: string
  arrangementId?: string | number
  /** Cover art for the global player bar. */
  imageUrl?: string
}

export interface AudioContextValue {
  /** The loaded track (playing or paused); null until something is played or cued. */
  track: AudioTrack | null
  playing: boolean
  currentTime: number
  duration: number
  volume: number
  muted: boolean
  /** Increments on every `play` event; lets the bar react to "playback started". */
  playId: number
  /** True once anything has been played. Players only cue their first track before that. */
  started: boolean
  /**
   * Play `track` (or resume the loaded one when omitted). `queue` is the list
   * the track belongs to; when the track ends the next one in it plays.
   */
  play: (track?: AudioTrack, queue?: AudioTrack[]) => void
  /** Load `track` without playing it. */
  cue: (track: AudioTrack, queue?: AudioTrack[]) => void
  /** Unload `src` if it was only cued (never played). Players call this on unmount. */
  release: (src: string) => void
  pause: () => void
  toggle: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  setMuted: (muted: boolean) => void
}

const AudioContext = createContext<AudioContextValue | null>(null)

/**
 * Owns the site's single <audio> element. It lives in the root layout, so
 * playback survives client-side navigation; every player on a page is a
 * control bound to this context.
 */
export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const queueRef = useRef<AudioTrack[]>([])
  const trackRef = useRef<AudioTrack | null>(null)
  const startedRef = useRef(false)
  const [track, setTrack] = useState<AudioTrack | null>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [muted, setMuted] = useState(false)
  const [playId, setPlayId] = useState(0)

  const load = useCallback((next: AudioTrack, queue?: AudioTrack[]) => {
    const audio = audioRef.current
    if (!audio) return
    queueRef.current = queue ?? [next]
    trackRef.current = next
    setTrack(next)
    if (audio.getAttribute('src') !== next.src) {
      audio.src = next.src
      setCurrentTime(0)
      setDuration(0)
    }
  }, [])

  const play = useCallback((next?: AudioTrack, queue?: AudioTrack[]) => {
    const audio = audioRef.current
    if (!audio) return
    if (next) load(next, queue)
    if (!audio.getAttribute('src')) return
    audio.play()?.catch(() => setPlaying(false))
  }, [load])

  const cue = useCallback((next: AudioTrack, queue?: AudioTrack[]) => {
    audioRef.current?.pause()
    load(next, queue)
  }, [load])

  const release = useCallback((src: string) => {
    const audio = audioRef.current
    if (!audio || startedRef.current || trackRef.current?.src !== src) return
    trackRef.current = null
    queueRef.current = []
    audio.removeAttribute('src')
    setTrack(null)
    setCurrentTime(0)
    setDuration(0)
  }, [])

  const pause = useCallback(() => audioRef.current?.pause(), [])

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) play()
    else audio.pause()
  }, [play])

  const seek = useCallback((time: number) => {
    const audio = audioRef.current
    if (!audio) return
    const max = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : Infinity
    const clamped = Math.min(Math.max(time, 0), max)
    audio.currentTime = clamped
    setCurrentTime(clamped)
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onPlay = () => {
      startedRef.current = true
      setPlaying(true)
      setPlayId((n) => n + 1)
    }
    const onPause = () => setPlaying(false)
    const onTime = () => setCurrentTime(audio.currentTime)
    const onDuration = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
    const onEnded = () => {
      setPlaying(false)
      setCurrentTime(0)
      const queue = queueRef.current
      const index = queue.findIndex((t) => t.src === audio.getAttribute('src'))
      const next = index >= 0 ? queue[index + 1] : undefined
      if (next) play(next, queue)
    }
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onDuration)
    audio.addEventListener('durationchange', onDuration)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onDuration)
      audio.removeEventListener('durationchange', onDuration)
      audio.removeEventListener('ended', onEnded)
    }
  }, [play])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume
  }, [volume, muted])

  const value = useMemo<AudioContextValue>(
    () => ({
      track, playing, currentTime, duration, volume, muted, playId, started: playId > 0,
      play, cue, release, pause, toggle, seek, setVolume, setMuted,
    }),
    [track, playing, currentTime, duration, volume, muted, playId, play, cue, release, pause, toggle, seek],
  )

  return (
    <AudioContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="metadata" className="hidden" data-testid="site-audio" />
    </AudioContext.Provider>
  )
}

export function useAudio(): AudioContextValue {
  const ctx = useContext(AudioContext)
  if (!ctx) throw new Error('useAudio must be used within an AudioProvider')
  return ctx
}
