# Observability

PostHog is the single sink. Client-side, `instrumentation-client.ts` loads posthog-js (pageviews, exceptions). Server-side, `lib/observability/client.ts` holds one shared posthog-node client (key from `NEXT_PUBLIC_POSTHOG_KEY`, absolute host, `flushAt: 1`). With no key configured (local, CI, previews) everything is a no-op.

- `reportError(error, context)` in `lib/observability/report-error.ts`: a swallowed server error becomes a captured exception.
- `trackServerEvent(name, properties, distinctId?)` in `lib/observability/events.ts`: product events from the server. Awaits the flush, never throws (failures are `console.error`ed). `distinctId` is the acting staff email when known, otherwise `'server'`. Every event also carries `source: 'server'`.

Events fire after the write has committed (from a Server Action's `invalidate` closure, or after the insert in the contact route), never inside a transaction. A failed or rejected write fires nothing.

## Events

| Event | Properties | Fired from |
|---|---|---|
| `show.saved` | `showId`, `slug`, `created` (true on create) | `createShow`, `updateShow` |
| `arrangement.saved` | `arrangementId`, `showId` (null when the part is on no show) | `createArrangement`, `updateArrangement` |
| `upload.completed` | `fileId`, `kind`, `isPublic`, `bucket` | `completeUpload` |
| `contact.received` | `type`, `source` | `app/api/contact/route.ts`, after the row is stored |

No PII beyond the staff email as `distinctId`. `contact.received` never carries the submitter's email, name or message.

## "Site health" dashboard

Build these tiles in PostHog:

- **Errors**: count of `$exception` events, split by `source` (`server` vs browser) and `operation`. Should be flat near zero; a spike on `GET /api/export/*` means the sheets stopped refreshing.
- **Pageviews**: `$pageview` by day, with the top paths.
- **Contact submissions**: `contact.received` by day, broken down by `type`. A drop to zero while pageviews hold means the form is failing.
- **Uploads**: `upload.completed` by day, broken down by `kind` and `isPublic`.
- **Admin activity** (optional): `show.saved` and `arrangement.saved` by day, with `created` as breakdown.

The last sheet refresh is not tracked in PostHog. Check it in the sheet itself: the auto tabs show whatever Google last fetched (see `docs/sheet-sync.md`).
