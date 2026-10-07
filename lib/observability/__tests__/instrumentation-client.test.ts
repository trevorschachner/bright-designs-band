// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const init = vi.fn();
vi.mock('posthog-js', () => ({ default: { init } }));
vi.mock('@/lib/env', () => ({ getPosthogKey: () => 'phc_test' }));

describe('instrumentation-client', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
    init.mockClear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('initialises posthog-js once, through the /ingest proxy, without session recording', async () => {
    await import('../../../instrumentation-client');
    vi.runAllTimers();
    expect(init).toHaveBeenCalledTimes(1);
    expect(init).toHaveBeenCalledWith(
      'phc_test',
      expect.objectContaining({
        api_host: '/ingest',
        ui_host: 'https://us.posthog.com',
        disable_session_recording: true,
        capture_pageview: 'history_change',
        capture_exceptions: true,
      }),
    );
  });

  it('does not initialise in development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    await import('../../../instrumentation-client');
    vi.runAllTimers();
    expect(init).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});
