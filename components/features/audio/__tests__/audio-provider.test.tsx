import { useEffect } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AudioProvider, useAudio, type AudioTrack } from '@/components/features/audio/AudioProvider';
import { AudioPlayerComponent } from '@/components/features/audio-player';
import { GlobalAudioPlayerBar } from '@/components/features/global-audio-player-bar';

// jsdom has no media pipeline: model paused/currentTime/duration per element
// and make play()/pause() fire the events a browser would.
const media = new WeakMap<HTMLMediaElement, { paused: boolean; time: number; duration: number }>();
const stateOf = (el: HTMLMediaElement) => {
  let s = media.get(el);
  if (!s) media.set(el, (s = { paused: true, time: 0, duration: NaN }));
  return s;
};

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockImplementation(function (this: HTMLMediaElement) {
    return stateOf(this).paused;
  });
  vi.spyOn(HTMLMediaElement.prototype, 'duration', 'get').mockImplementation(function (this: HTMLMediaElement) {
    return stateOf(this).duration;
  });
  vi.spyOn(HTMLMediaElement.prototype, 'currentTime', 'get').mockImplementation(function (this: HTMLMediaElement) {
    return stateOf(this).time;
  });
  vi.spyOn(HTMLMediaElement.prototype, 'currentTime', 'set').mockImplementation(function (this: HTMLMediaElement, t: number) {
    stateOf(this).time = t;
  });
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (this: HTMLMediaElement) {
    stateOf(this).paused = false;
    this.dispatchEvent(new Event('play'));
    return Promise.resolve();
  });
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (this: HTMLMediaElement) {
    const s = stateOf(this);
    if (s.paused) return;
    s.paused = true;
    this.dispatchEvent(new Event('pause'));
  });
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  // Radix Slider measures itself; the bar reads a media query.
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false, media: query, addEventListener() {}, removeEventListener() {},
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const intro: AudioTrack = { src: '/audio/intro.mp3', title: 'Intro', showTitle: 'True North', arrangementId: 1 };
const ballad: AudioTrack = { src: '/audio/ballad.mp3', title: 'Ballad', showTitle: 'True North', arrangementId: 2 };

// The probe hands the latest context value to the test after each commit.
const probe: { api?: ReturnType<typeof useAudio> } = {};
function Probe() {
  const ctx = useAudio();
  useEffect(() => {
    probe.api = ctx;
  });
  return (
    <output data-testid="state">
      {JSON.stringify({ src: ctx.track?.src ?? null, playing: ctx.playing, time: ctx.currentTime, duration: ctx.duration })}
    </output>
  );
}
const api = new Proxy({} as ReturnType<typeof useAudio>, { get: (_, key) => probe.api![key as keyof typeof probe.api] });
const state = () => JSON.parse(screen.getByTestId('state').textContent!);
const audioEl = () => document.querySelector('audio') as HTMLAudioElement;

describe('AudioProvider', () => {
  it('renders exactly one <audio> element for the provider, two players and the bar', () => {
    render(
      <AudioProvider>
        <AudioPlayerComponent tracks={[{ id: '1', title: 'Intro', url: intro.src }]} />
        <AudioPlayerComponent tracks={[{ id: '2', title: 'Ballad', url: ballad.src }]} compact />
        <GlobalAudioPlayerBar />
      </AudioProvider>,
    );
    expect(document.querySelectorAll('audio')).toHaveLength(1);
  });

  it('moves through play, pause and seek', () => {
    render(<AudioProvider><Probe /></AudioProvider>);
    expect(state()).toEqual({ src: null, playing: false, time: 0, duration: 0 });

    act(() => api.play(intro));
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
    expect(audioEl().getAttribute('src')).toBe(intro.src);
    expect(state()).toMatchObject({ src: intro.src, playing: true });

    act(() => api.pause());
    expect(state().playing).toBe(false);

    act(() => api.toggle());
    expect(state().playing).toBe(true);

    act(() => api.seek(42));
    expect(audioEl().currentTime).toBe(42);
    expect(state().time).toBe(42);

    act(() => api.seek(-5));
    expect(state().time).toBe(0);

    // Switching tracks reuses the same element.
    const before = audioEl();
    act(() => api.play(ballad));
    expect(audioEl()).toBe(before);
    expect(audioEl().getAttribute('src')).toBe(ballad.src);
    expect(state()).toMatchObject({ src: ballad.src, playing: true, time: 0 });
  });

  it('updates currentTime and duration from media events', () => {
    render(<AudioProvider><Probe /></AudioProvider>);
    act(() => api.play(intro));
    const el = audioEl();
    act(() => {
      stateOf(el).duration = 180;
      el.dispatchEvent(new Event('loadedmetadata'));
      stateOf(el).time = 12.5;
      el.dispatchEvent(new Event('timeupdate'));
    });
    expect(state()).toMatchObject({ time: 12.5, duration: 180 });
  });

  it('plays the next track in the queue when one ends', () => {
    render(<AudioProvider><Probe /></AudioProvider>);
    act(() => api.play(intro, [intro, ballad]));
    act(() => {
      stateOf(audioEl()).paused = true;
      audioEl().dispatchEvent(new Event('ended'));
    });
    expect(state()).toMatchObject({ src: ballad.src, playing: true });
  });

  it('keeps playing when the page content changes (client-side navigation)', () => {
    const { rerender } = render(
      <AudioProvider>
        <Probe />
        <AudioPlayerComponent tracks={[{ id: '1', title: 'Intro', url: intro.src }]} />
      </AudioProvider>,
    );
    act(() => api.play(intro));
    const el = audioEl();
    rerender(
      <AudioProvider>
        <Probe />
        <p>Another page</p>
      </AudioProvider>,
    );
    expect(audioEl()).toBe(el);
    expect(state()).toMatchObject({ src: intro.src, playing: true });
    expect(document.querySelectorAll('audio')).toHaveLength(1);
  });

  it('drives the shared element from the page player and the bar', () => {
    render(
      <AudioProvider>
        <Probe />
        <AudioPlayerComponent tracks={[{ id: '1', title: 'Intro', url: intro.src }]} />
        <GlobalAudioPlayerBar />
      </AudioProvider>,
    );
    // Before anything plays, the page's first track is cued into the bar.
    expect(state()).toMatchObject({ src: intro.src, playing: false });
    fireEvent.click(screen.getByRole('button', { name: 'Play audio' }));
    expect(state().playing).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Pause audio' }));
    expect(state().playing).toBe(false);
  });

  it('throws a clear error outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/within an AudioProvider/);
  });
});
