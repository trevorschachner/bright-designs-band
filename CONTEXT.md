# Context

## What the site is for

brightdesigns.band is a catalog of marching band shows that Bright Designs resells, plus an admin area where the three owners (Trevor Schachner, Brighton Barrineau, Ryan Wilhite) manage that catalog. Visitors browse shows, listen to part previews, and send an inquiry through the contact form.

## Data model

Defined in `lib/database/schema.ts`.

- `shows` -> `show_arrangements` -> `arrangements` (the "parts") -> `arrangement_pieces` -> `pieces` (source music).
- `tags`, joined through `shows_to_tags` and `arrangements_to_tags`.
- `files` (audio, images, documents) and `resources` (downloadable and educational items).
- `contact_submissions` (inquiries) and `contact_rate_limits` (Postgres-backed limiter for `/api/contact`).

## Where things live

- `app/`: routes. `app/admin/` is the owner dashboard, `app/api/` the route handlers.
- `lib/services/`: cached read layer for public pages. `lib/database/`: Drizzle schema and raw queries.
- `lib/validation/`: zod schemas for write routes.
- `lib/auth/guard.ts`: the single authorization gate every write route calls (`guard('canManageShows')`).
- `lib/env.ts` (public helpers) and `lib/env.server.ts` (zod-validated server env via `getEnv()`).
- `lib/security-headers.mjs`: security headers including a report-only CSP.
- `proxy.ts`: Next 16 proxy (auth-code redirect, legacy `/shows/:id` redirect).
- `drizzle/`: schema migrations; `drizzle/migrations/` hand-written SQL.

## Auth today

Supabase magic link. Role is derived from the email: an address ending `@brightdesigns.band` is staff, anything else is a plain user (`lib/auth/roles.ts`). An explicit allowlist with roles is planned in #60.

## Caching today

Public pages use ISR (`revalidate = 3600`) and `unstable_cache` with the tag `shows` in `lib/services/shows.ts`. Invalidation is known to be incomplete (not every admin write revalidates it); to be fixed in #59.

## Current program

Decisions behind it are in `docs/adr/0001-overhaul-program.md`.

- #57 SP0: security hotfixes (private-file cache leak, contact spam relay, unvalidated show PUT, headers, redirects). Done.
- #58 SP1: codebase diet and toolchain (dead UI and deps, one client each, Turbopack, React 19, env schema, docs).
- #59 SP2: public performance and SEO (server-rendered catalog, tag caching and invalidation, JSON-LD, sitemap).
- #60 SP3: admin overhaul (allowlist roles, Server Actions, editor split, safe uploads, private bucket).
- #61 SP4: sheet sync and observability (nightly export plus on-demand button to the Show Database, deploy status, error flush).
- #62 SP5: content and GEO (llms.txt, AI crawlers, program notes, articles, case studies).
