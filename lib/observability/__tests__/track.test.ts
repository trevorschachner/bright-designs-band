// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const posthog = vi.hoisted(() => ({ __loaded: false, capture: vi.fn() }));
vi.mock('posthog-js', () => ({ default: posthog }));

import { trackClientEvent } from '../track';

const settle = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
  await vi.dynamicImportSettled();
};

describe('trackClientEvent', () => {
  beforeEach(() => {
    posthog.capture.mockClear();
    posthog.__loaded = false;
  });

  it('drops the event when PostHog never initialised', async () => {
    trackClientEvent('contact.submitted', { type: 'inquiry', source: 'contact' });
    await settle();
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it('captures the event once PostHog is loaded', async () => {
    posthog.__loaded = true;
    trackClientEvent('audio.played', { title: 'Opener', showTitle: 'Hive Mind', arrangementId: 7 });
    await settle();
    expect(posthog.capture).toHaveBeenCalledWith('audio.played', { title: 'Opener', showTitle: 'Hive Mind', arrangementId: 7 });
  });

  it('never throws when capture fails', async () => {
    posthog.__loaded = true;
    posthog.capture.mockImplementationOnce(() => { throw new Error('boom'); });
    expect(() => trackClientEvent('contact.submitted', { type: null, source: null })).not.toThrow();
    await settle();
  });
});
