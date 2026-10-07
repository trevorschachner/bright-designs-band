import { PostHog } from 'posthog-node';
import { getPosthogHost, getPosthogKey } from '@/lib/env';

// posthog-node needs an absolute host; the public default (`/ingest`) is a
// client-side rewrite and means nothing on the server.
const SERVER_POSTHOG_HOST = 'https://us.i.posthog.com';

let client: PostHog | null = null;
let disabled = false;

/**
 * The shared server-side PostHog client (error reports and server events), or
 * null when no key is configured (local dev, CI, preview builds: not an error).
 */
export function getPosthogClient(): PostHog | null {
  if (disabled) return null;
  if (client) return client;

  const key = getPosthogKey();
  if (!key) {
    disabled = true;
    return null;
  }

  const host = getPosthogHost(SERVER_POSTHOG_HOST);
  client = new PostHog(key, {
    host: host.startsWith('/') ? SERVER_POSTHOG_HOST : host,
    // Server rendering is short-lived; don't sit on events waiting for a batch
    // to fill, or the invocation ends before they flush.
    flushAt: 1,
    flushInterval: 0,
  });
  return client;
}
