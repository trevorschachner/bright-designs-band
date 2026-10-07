import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// The client factory caches at module scope, so each test gets a fresh module.
async function freshTracker() {
  vi.resetModules();
  return (await import('../events')).trackServerEvent;
}

const capture = vi.fn();
const flush = vi.fn();
vi.mock('posthog-node', () => ({
  PostHog: class {
    capture = capture;
    flush = flush;
  },
}));

describe('trackServerEvent', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    capture.mockReset();
    flush.mockReset().mockResolvedValue(undefined);
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test';
  });

  afterEach(() => {
    consoleError.mockRestore();
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
  });

  it('captures the event with name, properties and the staff email as distinctId', async () => {
    const track = await freshTracker();
    await track('show.saved', { showId: 7, slug: 'neon', created: true }, 'editor@example.com');
    expect(capture).toHaveBeenCalledWith({
      distinctId: 'editor@example.com',
      event: 'show.saved',
      properties: { source: 'server', showId: 7, slug: 'neon', created: true },
    });
  });

  it("uses 'server' as distinctId when no staff email is known", async () => {
    const track = await freshTracker();
    await track('contact.received', { type: 'inquiry', source: 'contact' });
    expect(capture).toHaveBeenCalledWith(expect.objectContaining({ distinctId: 'server' }));
  });

  it('awaits the flush before resolving', async () => {
    let release!: () => void;
    flush.mockReturnValue(new Promise<void>((r) => (release = r)));
    const track = await freshTracker();
    let done = false;
    const pending = track('contact.received', { type: null, source: 'contact' }).then(() => (done = true));
    await new Promise((r) => setTimeout(r, 0));
    expect(done).toBe(false);
    release();
    await pending;
    expect(done).toBe(true);
  });

  it('does nothing without a key', async () => {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const track = await freshTracker();
    await track('contact.received', { type: null, source: 'contact' });
    expect(capture).not.toHaveBeenCalled();
  });

  it('swallows a throwing client', async () => {
    capture.mockImplementation(() => {
      throw new Error('boom');
    });
    const track = await freshTracker();
    await expect(track('contact.received', { type: null, source: 'contact' })).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalled();
  });

  it('swallows a rejecting flush', async () => {
    flush.mockRejectedValue(new Error('network'));
    const track = await freshTracker();
    await expect(track('contact.received', { type: null, source: 'contact' })).resolves.toBeUndefined();
  });
});
