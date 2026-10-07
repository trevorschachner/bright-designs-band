# Server-side error reporting

## Why this exists

Some read paths degrade instead of failing. `getFeaturedShows` returns an empty
list when the database is unreachable, so a blip renders a homepage without a
featured section rather than a 500. That resilience is deliberate and worth
keeping.

The problem was that the empty list was indistinguishable from a genuine empty
result — to the page, and to us. The only trace was a `console.error` in a
Netlify function log nobody reads. A database outage and a site with no featured
shows rendered identically and reported identically.

This is the same failure shape as the two most expensive bugs in this repo's
history: filters offered for columns that did not exist, and eight months of
contact submissions silently discarded. In each case something was wrong and
nothing said so.

## How it works

`lib/observability/report-error.ts` exports `reportError(error, context)`. It
keeps the log line and additionally sends the exception to PostHog.

```ts
try {
  return await getFeaturedShowsCached();
} catch (error) {
  reportError(error, { operation: 'getFeaturedShows', degradedTo: 'empty list' });
  return [];
}
```

`operation` names the call site. `degradedTo` records what the caller returned
instead, so the degraded behaviour is legible in the dashboard rather than
having to be inferred.

## Constraints worth knowing

**It must never throw.** Callers invoke it from inside a `catch` block that is
about to return a fallback. A reporting failure that escaped would convert a
degraded read into a crash — turning a minor outage into a worse one. The
client construction and the capture are both contained, and tests cover the
no-key, unreachable-host and non-`Error` cases.

**No new dependency or secret.** `posthog-node` was already installed and
`NEXT_PUBLIC_POSTHOG_KEY` is already in the environment. PostHog was previously
browser-only: `instrumentation-client.ts` initialises `posthog-js` behind a
`typeof window !== 'undefined'` guard, so server-side failures never reached it.

**Absent key is not an error.** Local dev, CI and preview builds run without a
PostHog key. The reporter disables itself and falls back to the log line.

**`flushAt: 1`, `flushInterval: 0`.** Server rendering is short-lived. Batching
would mean the invocation ends before events flush.

## What this does not cover

Next's `onRequestError` instrumentation hook fires on errors that *escape* a
request. The errors here are caught deliberately, so that hook would never see
them. Adding it later for genuine crashes would be complementary, not a
replacement.

## When to use it

Use `reportError` wherever an error is being swallowed on purpose — where the
caller returns a fallback and continues. If the error should propagate, let it:
the read services in `lib/services/` throw by design (see
`lib/services/README.md`), and pages turn a missing row into `notFound()` and a
failure into the error boundary.

See also: `docs/features/filtering-system.md` for the related case of a filter
naming an unknown column, which returns a 400 rather than degrading.
