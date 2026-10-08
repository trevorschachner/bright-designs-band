import { getPosthogClient } from './client';

/**
 * Server-side product events (see docs/observability.md for the catalogue).
 *
 * Call after the write has committed, never inside a transaction. `distinctId`
 * is the acting staff email when there is one, otherwise 'server' (public
 * routes such as the contact form). Properties carry ids and enums only: no
 * submitter emails, names or message text.
 *
 * Never throws: observability must not turn a successful write into a failure.
 */
export type ServerEvents = {
  'show.saved': { showId: number; slug: string; created: boolean };
  'arrangement.saved': { arrangementId: number; showId: number | null };
  'upload.completed': { fileId: number; kind: string; isPublic: boolean; bucket: string };
  'contact.received': { type: string | null; source: string };
};

export async function trackServerEvent<N extends keyof ServerEvents>(
  name: N,
  properties: ServerEvents[N],
  distinctId?: string | null,
): Promise<void> {
  try {
    const posthog = getPosthogClient();
    if (!posthog) return;
    posthog.capture({
      distinctId: distinctId || 'server',
      event: name,
      properties: { source: 'server', ...properties },
    });
    // flushAt: 1 only starts the send; await so a serverless function does
    // not freeze before the event leaves.
    await posthog.flush();
  } catch (error) {
    console.error(`[trackServerEvent] failed to send ${name}`, error);
  }
}
