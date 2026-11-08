# Observability

PostHog is the single sink. Client-side, `instrumentation-client.ts` loads posthog-js (pageviews, autocaptured clicks, exceptions, session replay). Server-side, `lib/observability/client.ts` holds one shared posthog-node client (key from `NEXT_PUBLIC_POSTHOG_KEY`, absolute host, `flushAt: 1`). With no key configured (local, CI, previews) everything is a no-op.

- `reportError(error, context)` in `lib/observability/report-error.ts`: a swallowed server error becomes a captured exception.
- `trackClientEvent(name, properties)` in `lib/observability/track.ts`: product events from the browser. Carries the visitor's PostHog identity, so it can be broken down by referrer and UTM source. No-op until posthog-js has initialised.
- `trackServerEvent(name, properties, distinctId?)` in `lib/observability/events.ts`: product events from the server. Awaits the flush, never throws (failures are `console.error`ed). `distinctId` is the acting staff email when known, otherwise `'server'`. Every event also carries `source: 'server'`.

Events fire after the write has committed (from a Server Action's `invalidate` closure, or after the insert in the contact route), never inside a transaction. A failed or rejected write fires nothing.

Browser events reach PostHog through `/ingest` on our own domain (so ad blockers don't drop them). On Netlify that proxy is the `[[redirects]]` block in `netlify.toml`, not the Next.js rewrite: the rewrite corrupted posthog-js's gzipped request bodies and PostHog rejected every browser event. To check the proxy, POST a gzipped batch to `/ingest/e/?compression=gzip-js`: a 200 means it works, "invalid GZIP data" means bodies are being rewritten again.

## Events

| Event | Properties | Fired from |
|---|---|---|
| `show.saved` | `showId`, `slug`, `created` (true on create) | `createShow`, `updateShow` |
| `arrangement.saved` | `arrangementId`, `showId` (null when the part is on no show) | `createArrangement`, `updateArrangement` |
| `upload.completed` | `fileId`, `kind`, `isPublic`, `bucket` | `completeUpload` |
| `contact.received` | `type`, `source` | `app/api/contact/route.ts`, after the row is stored |
| `contact.submitted` (browser) | `type`, `source` | `postContact` in `lib/page-trail.ts`, on a 2xx response. The conversion event for funnels by traffic source |
| `audio.played` (browser) | `title`, `showTitle`, `arrangementId` | `AudioProvider`, the first time a loaded track starts (resuming is not a new play) |
| `audio.completed` (browser) | `title`, `showTitle`, `arrangementId` | `AudioProvider`, when a track plays to the end |

No PII beyond the staff email as `distinctId`. `contact.received` and `contact.submitted` never carry the submitter's email, name or message.

## Session replay

Enabled in `instrumentation-client.ts`; the sample rate lives in PostHog (Project settings > Replay > Sampling). All inputs are masked. `app/admin/layout.tsx` wraps the admin area in `ph-no-capture`, which blanks it in recordings and excludes it from autocapture.

## "Marketing" dashboard

- **Traffic by source**: Web analytics > Channels / Referring domain / UTM source.
- **Inquiry funnel**: `$pageview` → `contact.submitted`, broken down by `$initial_referring_domain` or `$initial_utm_source`.
- **Most-played shows**: `audio.played` by `showTitle`; completion rate is `audio.completed` / `audio.played`.
- **Click heatmaps**: Toolbar > Heatmaps on any page (from autocapture).

## "Site health" dashboard

Build these tiles in PostHog:

- **Errors**: count of `$exception` events, split by `source` (`server` vs browser) and `operation`. Should be flat near zero; a spike on `GET /api/export/*` means the sheets stopped refreshing.
- **Pageviews**: `$pageview` by day, with the top paths.
- **Contact submissions**: `contact.received` by day, broken down by `type`. A drop to zero while pageviews hold means the form is failing.
- **Uploads**: `upload.completed` by day, broken down by `kind` and `isPublic`.
- **Admin activity** (optional): `show.saved` and `arrangement.saved` by day, with `created` as breakdown.

The last sheet refresh is not tracked in PostHog. Check it in the sheet itself: the auto tabs show whatever Google last fetched (see `docs/sheet-sync.md`).
