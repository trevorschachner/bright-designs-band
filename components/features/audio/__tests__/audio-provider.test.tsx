import { useEffect } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AudioProvider,
  useAudioActions,
  useAudioState,
  useAudioTime,
  type AudioTrack,
} from '@/components/features/audio/AudioProvider';
import { ArrangementResults } from '@/components/features/catalog/ArrangementResults';
import type { ArrangementListItem } from '@/lib/services/arrangements';
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

type Actions = ReturnType<typeof useAudioActions>;
// The probe hands the actions to the test after each commit and prints the
// state and time it sees.
const probe: { api?: Actions } = {};
function Probe() {
  const actions = useAudioActions();
  const state = useAudioState();
  const time = useAudioTime();
  useEffect(() => {
    probe.api = actions;
  });
  return (
    <output data-testid="state">
      {JSON.stringify({ src: state.track?.src ?? null, playing: state.playing, time: time.currentTime, duration: time.duration })}
    </output>
  );
}
const api = new Proxy({} as Actions, { get: (_, key) => probe.api![key as keyof Actions] });

const catalogRow = (id: number, title: string, url: string): ArrangementListItem => ({
  id, title, composer: null, durationSeconds: 120, sampleScoreUrl: null,
  files: [{ id, fileType: 'audio', url }], showArrangements: [],
});
const state = () => JSON.parse(screen.getByTestId('state').textContent!);
const audioEl = () => document.querySelector('audio') as HTMLAudioElement;

describe('AudioProvider', () => {
  it('renders exactly one <audio> element for the provider, two players, catalog rows and the bar', () => {
    render(
      <AudioProvider>
        <AudioPlayerComponent tracks={[{ id: '1', title: 'Intro', url: intro.src }]} />
        <AudioPlayerComponent tracks={[{ id: '2', title: 'Ballad', url: ballad.src }]} compact />
        <ArrangementResults items={[catalogRow(7, 'Finale', '/audio/finale.mp3'), catalogRow(8, 'Opener', '/audio/opener.mp3')]} />
        <GlobalAudioPlayerBar />
      </AudioProvider>,
    );
    expect(document.querySelectorAll('audio')).toHaveLength(1);
  });

  it('plays catalog rows through the shared element', () => {
    render(
      <AudioProvider>
        <Probe />
        <ArrangementResults items={[catalogRow(7, 'Finale', '/audio/finale.mp3')]} />
      </AudioProvider>,
    );
    // The table (sm and up) and the compact row both render a button.
    fireEvent.click(screen.getAllByRole('button', { name: 'Play Finale' })[0]);
    expect(audioEl().getAttribute('src')).toBe('/audio/finale.mp3');
    expect(state().playing).toBe(true);
    fireEvent.click(screen.getAllByRole('button', { name: 'Pause Finale' })[0]);
    expect(state().playing).toBe(false);
    expect(document.querySelectorAll('audio')).toHaveLength(1);
  });

  it('does not re-render action/state-only consumers on timeupdate', () => {
    // Counted in effects: each committed render of the consumer runs one.
    const renders = { slow: 0, time: 0 };
    function SlowConsumer() {
      useAudioActions();
      useAudioState();
      useEffect(() => {
        renders.slow += 1;
      });
      return null;
    }
    function TimeConsumer() {
      useAudioTime();
      useEffect(() => {
        renders.time += 1;
      });
      return null;
    }
    render(
      <AudioProvider>
        <Probe />
        <SlowConsumer />
        <TimeConsumer />
      </AudioProvider>,
    );
    act(() => api.play(intro));
    const slowBefore = renders.slow;
    const timeBefore = renders.time;
    act(() => {
      for (const t of [1, 2, 3]) {
        stateOf(audioEl()).time = t;
        audioEl().dispatchEvent(new Event('timeupdate'));
      }
    });
    expect(state().time).toBe(3);
    expect(renders.slow).toBe(slowBefore);
    expect(renders.time).toBeGreaterThan(timeBefore);
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
    act(() => {
      api.play(ballad);
      stateOf(audioEl()).time = 0;
      audioEl().dispatchEvent(new Event('emptied'));
    });
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

  it('releases the track a player cued, not just its first one, when it unmounts', () => {
    const tracks = [
      { id: '1', title: 'Intro', url: intro.src },
      { id: '2', title: 'Ballad', url: ballad.src },
    ];
    const { rerender } = render(
      <AudioProvider>
        <Probe />
        <AudioPlayerComponent tracks={tracks} />
      </AudioProvider>,
    );
    expect(state().src).toBe(intro.src);
    // Picking a track in the (non-compact) list cues it without playing.
    fireEvent.click(screen.getByRole('button', { name: /Ballad/ }));
    expect(state()).toMatchObject({ src: ballad.src, playing: false });
    rerender(
      <AudioProvider>
        <Probe />
      </AudioProvider>,
    );
    expect(state().src).toBeNull();
    expect(audioEl().hasAttribute('src')).toBe(false);
  });

  it('throws a clear error outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/must be used within an AudioProvider/);
  });
});
