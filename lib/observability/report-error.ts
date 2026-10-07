import { PostHog } from 'posthog-node';

/**
 * Reports a server-side error that the caller is deliberately swallowing.
 *
 * Some read paths degrade instead of failing: `getFeaturedShows` returns an
 * empty list when the database is unreachable, so a blip renders a homepage
 * without a featured section rather than a 500. That resilience is wanted. The
 * problem was that it looked identical to "there are no featured shows" --
 * both to the page and to us, because the only trace was a console.error in a
 * Netlify function log nobody reads.
 *
 * PostHog was already a dependency, but only client-side:
 * instrumentation-client.ts initialises posthog-js behind a
 * `typeof window !== 'undefined'` guard, so server-side failures never reached
 * it.
 *
 * Errors thrown by the reporter itself are contained here. A failure to report
 * a degraded read must never turn that degraded read into a crash.
 */

let client: PostHog | null = null;
let disabled = false;

function getClient(): PostHog | null {
  if (disabled) return null;
  if (client) return client;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) {
    // No key configured (local dev, CI, preview builds). Not an error.
    disabled = true;
    return null;
  }

  client = new PostHog(key, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    // Server rendering is short-lived; don't sit on events waiting for a batch
    // to fill, or the invocation ends before they flush.
    flushAt: 1,
    flushInterval: 0,
  });
  return client;
}

export interface ReportErrorContext {
  /** Where this happened, e.g. `getFeaturedShows`. */
  operation: string;
  /** What the caller returned instead, so the degraded behaviour is legible. */
  degradedTo?: string;
  [key: string]: unknown;
}

export async function reportError(error: unknown, context: ReportErrorContext): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);

  // Keep the log line. It is the only trace where no PostHog key is
  // configured, and it is what shows up in `netlify dev` locally.
  console.error(`[${context.operation}] ${message}`, error);

  try {
    const posthog = getClient();
    if (!posthog) return;

    posthog.captureException(
      error instanceof Error ? error : new Error(message),
      undefined,
      { source: 'server', ...context },
    );
    // flushAt: 1 only starts the send; a serverless function can freeze before
    // it completes. Awaiting flush() keeps the invocation alive until the
    // event has left.
    await posthog.flush();
  } catch (reportingError) {
    // Reporting must never escalate a degraded read into a failure.
    console.error('[reportError] failed to report error', reportingError);
  }
}
