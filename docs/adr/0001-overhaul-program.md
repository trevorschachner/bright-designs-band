# 0001: Overhaul program

Status: accepted, 2026-10

## Context

The site grew quickly across many sessions and tools. By August 2026 an architecture review (appendix) had found a half-finished authorization seam, duplicated Supabase clients and toast hooks, ~30 unused packages, stale docs, and security gaps (a public contact endpoint usable as a spam relay, private-file cache leaks, unvalidated writes). Three owners and no full-time developer need a site that is small, safe, and cheap to keep up. The overhaul runs as six sub-projects, SP0 to SP5 (issues #57 to #62).

## Decisions

1. **Keep the stack.** Next.js App Router, Supabase (Postgres, Auth, Storage), Drizzle, Netlify, Tailwind with shadcn/ui. Upgrade in place (Next 16, React 19, Turbopack) instead of rewriting.
2. **Admin access is an allowlist with roles.** Replace "any `@brightdesigns.band` address is staff" with an explicit allowlist and roles, enforced through the single `guard()` gate (SP3, #60).
3. **Turnstile plus a Postgres rate limit on the contact form.** Cloudflare Turnstile verifies humans; `contact_rate_limits` throttles per client. No third-party limiter service (SP0, done).
4. **PostHog is initialised once.** One client-side init and one server error-reporting path (`instrumentation.ts` `onRequestError`), replacing scattered snippets [inferred].
5. **The site database is the editing surface; the Show Database sheet is a nightly export.** Owners edit shows in `/admin`. A nightly job exports shows, parts and pieces to the Show Database Google Sheet (SP4, #61; `npm run export:shows` is the read-only exporter). The sheet stays the shared reference but is not edited back into the site.

## Consequences

- Less code and fewer dependencies to maintain; one way to do each thing (one Supabase client pair, one toast hook, one env module).
- Admin changes need a deploy-free allowlist edit path (to be designed in SP3).
- Two sources of the same data exist for a day at a time. Edits made directly in the sheet will be overwritten by the next export.
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
