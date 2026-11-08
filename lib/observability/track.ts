'use client';

/**
 * Browser-side product events (see docs/observability.md for the catalogue).
 *
 * Browser events carry the visitor's PostHog identity, so they can be broken
 * down by traffic source (referrer, UTM, initial referring domain), which the
 * server's `'server'` distinct id cannot be.
 *
 * posthog-js is initialised lazily by instrumentation-client.ts. This reuses
 * the same module (no extra chunk) and drops the event when PostHog never
 * started: development, no key, or an ad blocker. Properties carry ids,
 * titles and enums only: no submitter emails, names or message text.
 *
 * Never throws: analytics must not break a form or the player.
 */
export type ClientEvents = {
  'contact.submitted': { type: string | null; source: string | null };
  'audio.played': AudioEventProperties;
  'audio.completed': AudioEventProperties;
};

export interface AudioEventProperties {
  title: string;
  showTitle: string | null;
  arrangementId: string | number | null;
}

export function trackClientEvent<N extends keyof ClientEvents>(name: N, properties: ClientEvents[N]): void {
  if (typeof window === 'undefined') return;
  void import('posthog-js')
    .then(({ default: posthog }) => {
      if (!posthog.__loaded) return;
      posthog.capture(name, properties);
    })
    .catch(() => {
      // Chunk failed to load (offline, blocked): the event is best-effort.
    });
}
