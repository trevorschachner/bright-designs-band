'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'

export interface AudioTrack {
  src: string
  title: string
  showTitle?: string
  arrangementId?: string | number
  /** Cover art for the global player bar. */
  imageUrl?: string
}

/** Stable functions; reading this context never re-renders on playback changes. */
export interface AudioActions {
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

/** Changes on play/pause/track/volume, never on `timeupdate`. */
export interface AudioState {
  /** The loaded track (playing or paused); null until something is played or cued. */
  track: AudioTrack | null
  playing: boolean
  volume: number
  muted: boolean
  /** Increments on every `play` event; lets the bar react to "playback started". */
  playId: number
  /** True once anything has been played. Players only cue their first track before that. */
  started: boolean
}

interface TimeStore {
  subscribe: (onChange: () => void) => () => void
  getCurrentTime: () => number
  getDuration: () => number
}

const ActionsContext = createContext<AudioActions | null>(null)
const StateContext = createContext<AudioState | null>(null)
const TimeContext = createContext<TimeStore | null>(null)

const TIME_EVENTS = ['timeupdate', 'durationchange', 'loadedmetadata', 'seeked', 'emptied', 'ended'] as const

/**
 * Owns the site's single <audio> element. It lives in the root layout, so
 * playback survives client-side navigation; every player on a page is a
 * control bound to this provider.
 *
 * Three contexts so that `timeupdate` (about 4 per second) re-renders only
 * the components that show the time: actions (stable), state (slow) and a
 * time store read through `useAudioTime`.
 */
export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const queueRef = useRef<AudioTrack[]>([])
  const trackRef = useRef<AudioTrack | null>(null)
  const startedRef = useRef(false)
  const [track, setTrack] = useState<AudioTrack | null>(null)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [muted, setMuted] = useState(false)
  const [playId, setPlayId] = useState(0)

  // Time is read straight from the element; listeners are notified on its
  // media events and after a seek.
  const [timeStore] = useState<TimeStore & { emit: () => void }>(() => {
    const listeners = new Set<() => void>()
    return {
      subscribe(onChange) {
        listeners.add(onChange)
        return () => listeners.delete(onChange)
      },
      emit() {
        listeners.forEach((listener) => listener())
      },
      getCurrentTime() {
        const audio = audioRef.current
        return audio && !audio.ended ? audio.currentTime : 0
      },
      getDuration() {
        const d = audioRef.current?.duration
        return d !== undefined && Number.isFinite(d) ? d : 0
      },
    }
  })

  const load = useCallback((next: AudioTrack, queue?: AudioTrack[]) => {
    const audio = audioRef.current
    if (!audio) return
    queueRef.current = queue ?? [next]
    trackRef.current = next
    setTrack(next)
    if (audio.getAttribute('src') !== next.src) {
      audio.src = next.src
      timeStore.emit()
    }
  }, [timeStore])

  const play = useCallback((next?: AudioTrack, queue?: AudioTrack[]) => {
    const audio = audioRef.current
    if (!audio) return
    if (next) load(next, queue)
    if (!audio.getAttribute('src')) return
    audio.play()?.catch((error: unknown) => {
      // A newer load() or pause() interrupted this play(); not a failure.
      if (error instanceof Error && error.name === 'AbortError') return
      setPlaying(false)
    })
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
    timeStore.emit()
  }, [timeStore])

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
    audio.currentTime = Math.min(Math.max(time, 0), max)
    timeStore.emit()
  }, [timeStore])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onPlay = () => {
      startedRef.current = true
      setPlaying(true)
      setPlayId((n) => n + 1)
    }
    const onPause = () => setPlaying(false)
    const onTime = () => timeStore.emit()
    const onEnded = () => {
      setPlaying(false)
      const queue = queueRef.current
      const index = queue.findIndex((t) => t.src === audio.getAttribute('src'))
      const next = index >= 0 ? queue[index + 1] : undefined
      if (next) play(next, queue)
    }
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    for (const type of TIME_EVENTS) audio.addEventListener(type, onTime)
    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
      for (const type of TIME_EVENTS) audio.removeEventListener(type, onTime)
    }
  }, [play, timeStore])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume
  }, [volume, muted])

  const actions = useMemo<AudioActions>(
    () => ({ play, cue, release, pause, toggle, seek, setVolume, setMuted }),
    [play, cue, release, pause, toggle, seek],
  )
  const state = useMemo<AudioState>(
    () => ({ track, playing, volume, muted, playId, started: playId > 0 }),
    [track, playing, volume, muted, playId],
  )

  return (
    <ActionsContext.Provider value={actions}>
      <StateContext.Provider value={state}>
        <TimeContext.Provider value={timeStore}>
          {children}
          <audio ref={audioRef} preload="metadata" className="hidden" data-testid="site-audio" />
        </TimeContext.Provider>
      </StateContext.Provider>
    </ActionsContext.Provider>
  )
}

function required<T>(value: T | null, hook: string): T {
  if (!value) throw new Error(`${hook} must be used within an AudioProvider`)
  return value
}

export function useAudioActions(): AudioActions {
  return required(useContext(ActionsContext), 'useAudioActions')
}

export function useAudioState(): AudioState {
  return required(useContext(StateContext), 'useAudioState')
}

/** Current time and duration in seconds; re-renders on every `timeupdate`. */
export function useAudioTime(): { currentTime: number; duration: number } {
  const store = required(useContext(TimeContext), 'useAudioTime')
  const currentTime = useSyncExternalStore(store.subscribe, store.getCurrentTime, () => 0)
  const duration = useSyncExternalStore(store.subscribe, store.getDuration, () => 0)
  return { currentTime, duration }
}
