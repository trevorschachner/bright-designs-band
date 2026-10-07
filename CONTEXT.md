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

- `app/`: routes. `app/admin/` is the admin (dashboard, shows, arrangements, pieces, tags, resources, inquiries, users), `app/api/` the route handlers (public GETs, `/api/contact`, `/api/export/*`, the private-file download route; no admin writes).
- `lib/actions/`: Server Actions, the only way the admin writes (`guarded()`: permission, strict schema, invalidate after commit). See `lib/actions/README.md`.
- `lib/services/`: cached read layer for public pages, plus uncached admin reads (`lib/services/admin.ts`) and cache invalidation (`invalidate.ts`). `lib/database/`: Drizzle schema and raw queries.
- `lib/validation/`: zod schemas for the actions.
- `lib/auth/guard.ts`: the single authorization gate every action and staff route calls (`guard('canManageShows')`).
- `lib/env.ts` (public helpers) and `lib/env.server.ts` (zod-validated server env via `getEnv()`).
- `lib/security-headers.mjs`: security headers including a report-only CSP.
- `proxy.ts`: Next 16 proxy (auth-code redirect, legacy `/shows/:id` redirect).
- `drizzle/`: schema migrations; `drizzle/migrations/` hand-written SQL.

## Auth

Supabase magic link for sign-in. Admin access is an allowlist: a row in `admin_users` (email, role `owner` or `editor`), read on every request by `lib/auth/roles.ts`, with permissions per role in `lib/auth/permissions.ts`. No row means no access. Owners manage the list at `/admin/users`. RLS uses the same table (`is_admin_user()`, `is_admin_owner()`).

## Writes and files

Admin writes are Server Actions (`lib/actions/*`), not API routes. Uploads: `signUpload` validates and records a `pending_uploads` row and returns a signed URL; the browser uploads straight to Storage; `completeUpload` verifies the object and writes the `files` row. Public files live in the public bucket ("Bright Designs"); private files in the private bucket ("private"), reachable only through `/api/files/<id>/download` (staff, 60 s signed URL).

## Caching

Public pages use ISR and tagged `unstable_cache` reads in `lib/services/`. Every action invalidates through one helper in `lib/services/invalidate.ts` after its write commits (table in `lib/services/README.md`). Admin reads are uncached.

## Current program

Decisions behind it are in `docs/adr/0001-overhaul-program.md`.

- #57 SP0: security hotfixes (private-file cache leak, contact spam relay, unvalidated show PUT, headers, redirects). Done.
- #58 SP1: codebase diet and toolchain (dead UI and deps, one client each, Turbopack, React 19, env schema, docs).
- #59 SP2: public performance and SEO (server-rendered catalog, tag caching and invalidation, JSON-LD, sitemap).
- #60 SP3: admin overhaul (allowlist roles, Server Actions, editor split, safe uploads, private bucket).
- #61 SP4: sheet sync and observability (nightly export plus on-demand button to the Show Database, deploy status, error flush).
- #62 SP5: content and GEO (llms.txt, AI crawlers, program notes, articles, case studies).
