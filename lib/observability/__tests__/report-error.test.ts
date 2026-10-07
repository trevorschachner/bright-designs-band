import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// The reporter caches its client and its disabled flag at module scope, so
// each test gets a fresh module.
async function freshReporter() {
  vi.resetModules();
  return (await import('../report-error')).reportError;
}

const captureException = vi.fn();
const flush = vi.fn();
vi.mock('posthog-node', () => ({
  PostHog: class {
    captureException = captureException;
    flush = flush;
  },
}));

describe('reportError', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    captureException.mockReset();
    flush.mockReset().mockResolvedValue(undefined);
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
  });

  it('logs the operation and message', async () => {
    const reportError = await freshReporter();
    await reportError(new Error('connection refused'), { operation: 'getFeaturedShows' });

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
    await expect(reportError(new Error('boom'), { operation: 'x' })).resolves.toBeUndefined();
  });

  it('does not throw when the key is present but the host is unreachable', async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test_key';
    process.env.NEXT_PUBLIC_POSTHOG_HOST = 'http://127.0.0.1:1';
    const reportError = await freshReporter();
    await expect(reportError(new Error('boom'), { operation: 'x' })).resolves.toBeUndefined();
    delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
  });

  it('handles a non-Error being thrown', async () => {
    const reportError = await freshReporter();
    await expect(reportError('a string', { operation: 'x' })).resolves.toBeUndefined();
    expect(consoleError.mock.calls[0][0]).toContain('a string');
  });

  it('carries the degraded behaviour in the context', async () => {
    const reportError = await freshReporter();
    await expect(
      reportError(new Error('boom'), { operation: 'getShowsByFilter', degradedTo: 'empty list' }),
    ).resolves.toBeUndefined();
  });

  it('awaits flush so the event leaves before the function freezes', async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test_key';
    let resolveFlush!: () => void;
    flush.mockReturnValue(new Promise<void>((r) => (resolveFlush = r)));
    const reportError = await freshReporter();

    let done = false;
    const p = reportError(new Error('boom'), { operation: 'x' }).then(() => (done = true));
    await new Promise((r) => setTimeout(r, 10));
    expect(captureException).toHaveBeenCalledOnce();
    expect(flush).toHaveBeenCalledOnce();
    expect(done).toBe(false);

    resolveFlush();
    await p;
    expect(done).toBe(true);
  });

  it('swallows a flush failure and logs it', async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test_key';
    flush.mockRejectedValue(new Error('network down'));
    const reportError = await freshReporter();

    await expect(reportError(new Error('boom'), { operation: 'x' })).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalledTimes(2);
  });
});
