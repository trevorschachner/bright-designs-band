// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const init = vi.fn();
vi.mock('posthog-js', () => ({ default: { init } }));
vi.mock('@/lib/env', () => ({ getPosthogKey: () => 'phc_test' }));

const flush = async () => {
  // Let the dynamic import and its .then run.
  for (let i = 0; i < 5; i++) await Promise.resolve();
  await vi.dynamicImportSettled();
};

const expectInitOnce = () => {
  expect(init).toHaveBeenCalledTimes(1);
  expect(init).toHaveBeenCalledWith(
    'phc_test',
    expect.objectContaining({
      api_host: '/ingest',
      ui_host: 'https://us.posthog.com',
      disable_session_recording: true,
      disable_surveys: true,
      capture_pageview: 'history_change',
      capture_exceptions: true,
    }),
  );
};

describe('instrumentation-client', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
    init.mockClear();
    // jsdom has no requestIdleCallback: exercise the setTimeout fallback.
    vi.stubGlobal('requestIdleCallback', undefined);
  });
  afterEach(async () => {
    // Fire whatever this test's module left pending so its listeners and
    // timers cannot leak into the next test.
    window.dispatchEvent(new Event('pointerdown'));
    vi.runAllTimers();
    await flush();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('does not initialise at module load', async () => {
    await import('../../../instrumentation-client');
    await flush();
    expect(init).not.toHaveBeenCalled();
  });

  it('initialises once after the idle fallback', async () => {
    await import('../../../instrumentation-client');
    vi.advanceTimersByTime(2000);
    await flush();
    expectInitOnce();
    window.dispatchEvent(new Event('pointerdown'));
    vi.runAllTimers();
    await flush();
    expect(init).toHaveBeenCalledTimes(1);
  });

  it('initialises once on the first interaction, before idle', async () => {
    await import('../../../instrumentation-client');
    window.dispatchEvent(new Event('keydown'));
    window.dispatchEvent(new Event('scroll'));
    await flush();
    expectInitOnce();
    vi.runAllTimers();
    await flush();
    expect(init).toHaveBeenCalledTimes(1);
  });

  it('uses requestIdleCallback when available', async () => {
    const ric = vi.fn();
    vi.stubGlobal('requestIdleCallback', ric);
    await import('../../../instrumentation-client');
    expect(ric).toHaveBeenCalledWith(expect.any(Function), { timeout: 2000 });
    ric.mock.calls[0][0]();
    await flush();
    expectInitOnce();
  });

  it('does not initialise in development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    await import('../../../instrumentation-client');
    vi.runAllTimers();
    window.dispatchEvent(new Event('pointerdown'));
    await flush();
    expect(init).not.toHaveBeenCalled();
  });
});
