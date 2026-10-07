# 0001: Overhaul program

Status: accepted, 2026-10

## Context

The site grew quickly across many sessions and tools. By August 2026 an architecture review (appendix) had found a half-finished authorization seam, duplicated Supabase clients and toast hooks, ~30 unused packages, stale docs, and security gaps (a public contact endpoint usable as a spam relay, private-file cache leaks, unvalidated writes). Three owners and no full-time developer need a site that is small, safe, and cheap to keep up. The overhaul runs as six sub-projects, SP0 to SP5 (issues #57 to #62).

## Decisions

1. **Keep Next.js, Supabase and Netlify.** Overhaul in place, no rewrite; the site stays live throughout. Upgrades (Next 16, React 19, Turbopack) happen on the existing stack.
2. **Admin access is a named allowlist.** A table, `admin_users`, with roles `owner` and `editor`. Self sign-up is closed. Initial owners are Trevor, Brighton and Ryan; new hires are added when ready. This replaces the `@brightdesigns.band` email-suffix rule (SP3, #60).
3. **Contact form: Cloudflare Turnstile plus a per-IP rate limit.** The limit is backed by the `contact_rate_limits` table in Postgres. The confirmation email no longer echoes anything the submitter typed (SP0, done).
4. **PostHog stays, initialised once.** It had been initialised twice. Session recording is off, and PostHog loads after the page is interactive.
5. **The website database is where shows are edited; the admin is the editing surface.** A nightly export, plus an on-demand button, keeps the Show Database Google Sheet complete, so the sheet remains the business record. Sheet-only columns (for example YouTube posting status) stay in the sheet and are never overwritten by the export. The sheet is not imported back into the site (SP4, #61; `npm run export:shows` is the read-only exporter).

## Consequences

- Less code and fewer dependencies to maintain; one way to do each thing (one Supabase client pair, one toast hook, one env module).
- Owners add and remove people in `/admin/users` without a deploy.
- Site-owned columns in the sheet are replaced by each export; sheet-only columns are untouched. Do not edit site-owned columns in the sheet; edit them in the admin.
- Server errors that are not caught are reported to PostHog through `instrumentation.ts` `onRequestError` (an SP0 implementation detail, not one of the five decisions).
- Cache invalidation on admin writes must be completed (SP2, #59) before the catalog can be fully server-rendered.
- Docs are kept small: `README.md`, `CONTEXT.md`, ADRs, and the guides under `docs/`.

## Appendix: 2026-08 architecture review, resolution log

The review (2026-08-20) used a deep-module lens, and was deleted from the tree once all four recommendations were done (2026-08-23). Its resolution log is preserved here. File names and numbers are as they were then.

### Suggested order, and how it resolved

1. **Finish the `guard()` migration** (six routes).
   Done in `24df3b0`. Every API route now goes through `guard()` except `contact`,
   `robots` and `sitemap`, which are public by design. No production `getSession()`
   calls remain.

2. **Collapse `QueryBuilder` into one `queryTable` module.**
   Done in `c6f2099` as `lib/filters/table-query.ts`. Filtering shows by `tags`,
   which used to 500, works; an unknown field is now a 400 rather than an empty
   200. `QueryBuilder` survives for the response envelope and URL handling.

3. **Derive filter fields from Drizzle.**
   Done in #37. `schema-analyzer.ts` split into `filter-fields.ts` (derivation)
   and `filter-definitions.ts` (the allowlist). Allowlist keys are typed against
   the table, so the parallel schema cannot drift again — a nonexistent column is
   a compile error. The same treatment was applied to `showSchema` in #43, which
   had drifted the same way with seven phantom columns.

4. **Delete the dead tutorial block** and decide the `queries.ts` / `services/` split.
   Tutorial deleted in #28. The split was resolved in #44 by naming it rather than
   merging the modules: `services/` is the cached, build-guarded, error-tolerant
   read layer for public pages; `queries.ts` is raw and throws. `fetchFeaturedShows`
   is no longer exported alongside its cached wrapper, and the swallowed errors it
   mentions are now reported rather than silent.

#### Also resolved

- **§5's error swallowing.** `getX` still degrades to `[]` on failure, deliberately,
  but the failure is now reported to PostHog instead of a `console.error` nobody
  read. See `lib/observability/report-error.ts`.
- **§6's `admin/shows/[id]/page.tsx`.** Tracked as #34, retitled away from line
  count toward the actual defect: the write path is untyped.
