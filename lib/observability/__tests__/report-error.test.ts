import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// The reporter caches its client and its disabled flag at module scope, so
// each test gets a fresh module.
async function freshReporter() {
  vi.resetModules();
  return (await import('../report-error')).reportError;
}

describe('reportError', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
  });

  it('logs the operation and message', async () => {
    const reportError = await freshReporter();
    reportError(new Error('connection refused'), { operation: 'getFeaturedShows' });

    expect(consoleError).toHaveBeenCalledOnce();
    const [line] = consoleError.mock.calls[0];
    expect(line).toContain('getFeaturedShows');
    expect(line).toContain('connection refused');
  });

  // The whole point is that a failure to report must not escalate a degraded
  // read into a crash. Callers invoke this from inside a catch block that is
  // about to return a fallback value.
  it('does not throw when no PostHog key is configured', async () => {
    const reportError = await freshReporter();
    expect(() => reportError(new Error('boom'), { operation: 'x' })).not.toThrow();
  });

  it('does not throw when the key is present but the host is unreachable', async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test_key';
    process.env.NEXT_PUBLIC_POSTHOG_HOST = 'http://127.0.0.1:1';
    const reportError = await freshReporter();
    expect(() => reportError(new Error('boom'), { operation: 'x' })).not.toThrow();
    delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
  });

  it('handles a non-Error being thrown', async () => {
    const reportError = await freshReporter();
    expect(() => reportError('a string', { operation: 'x' })).not.toThrow();
    expect(consoleError.mock.calls[0][0]).toContain('a string');
  });

  it('carries the degraded behaviour in the context', async () => {
    const reportError = await freshReporter();
    expect(() =>
      reportError(new Error('boom'), { operation: 'getShowsByFilter', degradedTo: 'empty list' }),
    ).not.toThrow();
  });
});
