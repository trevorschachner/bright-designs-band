# Bright Designs Band

The website and admin dashboard for Bright Designs, a marching band show design company. Public visitors browse a catalog of shows (with their parts, audio previews and files) that are available for resale and can send an inquiry through the contact form. The owners manage the catalog from `/admin`.

## Stack

- Next.js 16 (App Router), React 19, TypeScript, built with Turbopack
- Tailwind CSS 3 and shadcn/ui
- Supabase: Postgres, Auth (magic link) and Storage
- Drizzle ORM and drizzle-kit
- Netlify (`netlify.toml`, Node 20, `@netlify/plugin-nextjs`)
- PostHog for analytics and error reporting
- Email through Resend by default (plain `fetch`), with Gmail or generic SMTP (nodemailer) as fallbacks
- Cloudflare Turnstile on the contact form

## Getting started

Requires Node 20 and a Supabase project.

```sh
npm ci
cp .env.example .env.local   # then fill in the values
npm run dev
```

Open http://localhost:3000.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server. |
| `npm run build` | Production build. |
| `npm start` | Serve the production build. |
| `npm run lint` | ESLint over `.ts`/`.tsx`, zero warnings allowed. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm test` | Run the Vitest suite once. |
| `npm run test:watch` | Vitest in watch mode. |
| `npm run test:ci` | Vitest once, with coverage. |
| `npm run test:email` | Only the email tests (`lib/email/__tests__`). |
| `npm run test:email:validate` | Validate the email templates and inputs (`scripts/test-email-validation.ts`). |
| `npm run test:email:preview` | Render email previews (`scripts/preview-emails.ts`). |
| `npm run db:generate` | Generate a drizzle-kit migration from `lib/database/schema.ts`. |
| `npm run db:migrate` | Run the drizzle-kit migration, then apply pending hand-written SQL migrations. Refuses `NODE_ENV=production` unless `ALLOW_DB_MIGRATE=true`. |
| `npm run db:migrate:status` | Show which hand-written SQL migrations are pending (dry run). |
| `npm run db:push` | Push the schema directly with drizzle-kit. Refuses unless `ALLOW_DB_PUSH=true`, and never in production. |
| `npm run media:optimize` | Re-encodes Supabase Storage media and, with `--apply`, rewrites production DB rows. Production; read its header first. |
| `npm run export:shows` | Export shows, parts and pieces as CSVs for the Show Database sheet. Read-only. |
| `npm run perf:ci` | Lighthouse CI against `lighthouserc.json`: starts `npm run start` (build first) and checks the performance budget. |

## Testing

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

CI runs lint, typecheck and tests, then the build, in one job on every pull request and every push to `main`. Component tests (`*.test.tsx`) run under jsdom with Testing Library (`vitest.setup.ts` registers the jest-dom matchers); everything else runs under node.

### Performance budget

`lighthouserc.json` sets the budget for `/`, `/shows` and `/about` under Lighthouse's mobile emulation (three runs, median). Blocking: script at most 425 KiB (435139 bytes), total transfer at most 1.5 MiB, SEO score at least 0.95, best-practices score at least 0.9. Warn-only: performance score at least 0.85 and Largest Contentful Paint at most 4 s, because a shared runner's timings swing by 20+ points between runs. The App Router's own client runtime is about 116 KiB of script before any page code, so SP1's original 180 KiB / 0.95 / 2 s budget was unreachable. The `lighthouse` job in `.github/workflows/test.yml` builds the site on the runner with dummy env and runs `npm run perf:ci` on every pull request; the real LCP check is Lighthouse against the Netlify deploy preview, recorded in `docs/perf-baseline.md`.

## Database migrations

There are two tracks, and both matter (details in `drizzle/README.md`):

1. Schema: edit `lib/database/schema.ts`, then `npm run db:generate`. drizzle-kit writes `drizzle/*.sql`.
2. Hand-written SQL in `drizzle/migrations/*.sql` (RLS policies, backfills), applied and checksummed by `scripts/apply-sql-migrations.ts`.

A hand-written file containing the line `-- migrate: manual` is held back from `npm run db:migrate` (it stays pending, listed as held, in `npm run db:migrate:status`) because it must wait for a human step. Apply it alone with `npx tsx scripts/apply-sql-migrations.ts --apply --only <file.sql>` once that step is done. `2026-10-09_storage_public_select.sql` is the current example.

Never run migrations against the production database from an agent or a dev machine by habit. Production changes are applied deliberately by a person, and `migrate-db.js` refuses `NODE_ENV=production` unless `ALLOW_DB_MIGRATE=true`.

## Admin

`/admin` is for the people listed in the `admin_users` table, nobody else. `app/admin/layout.tsx` checks the signed-in email against it on every request, and every admin page also calls `guard()` for the permission its actions need (no cache, so a removed user is out on their next request; `app/admin/__tests__/page-guards.test.ts` keeps it that way), and the RLS policies use the same list (`is_admin_user()`, `is_admin_owner()`). Owners manage the list at `/admin/users`.

| Role | Can |
| --- | --- |
| `owner` | Everything an editor can, plus manage admin users (`/admin/users`) |
| `editor` | Shows, arrangements, pieces, tags, resources, files, inquiries, analytics link |

Permissions per role are in `lib/auth/permissions.ts`; `guard(permission)` in `lib/auth/guard.ts` is the one check.

Pages (nav order): Dashboard (counts, recently edited, needs attention: shows with no poster or a description under 40 characters, parts with no public audio or no pieces), Shows (show editor with its parts, files and pieces), Arrangements (searchable list linking to each part's show), Pieces, Tags, Resources, Inquiries (read-only `contact_submissions`, newest first, with copy-email and an Attio search link), Users (owners only). The Shows and Resources tables search by title on the server (`?q=`).

**Writes are Server Actions** in `lib/actions/*`, never API routes. Each one runs through `guarded()` (permission, strict zod schema, error mapping into `{ ok, data } | { ok: false, error }`) and returns `{ data, invalidate }`, so the cache is purged only after the write commits. Rules and the action list: `lib/actions/README.md`. Admin reads are uncached and live in `lib/services/admin.ts`.

**Uploads** go straight from the browser to Supabase Storage: `signUpload` validates type and size, builds the storage path itself and records a `pending_uploads` row; the browser uploads to the signed URL; `completeUpload` checks the stored object against what was signed and only then writes the `files` row.

**Buckets.** Public files are in the public bucket (`NEXT_PUBLIC_STORAGE_BUCKET`, "Bright Designs") and are served from their public URLs. Private files (`is_public = false`) are in the private bucket (`STORAGE_PRIVATE_BUCKET`, "private"); their `url` is `/api/files/<id>/download`, which gives staff a 60-second signed URL and everyone else a 401 or 403.

## Deploying

The SP3 admin overhaul (admin allowlist, slug redirects, `updated_at` on parts and tags, direct uploads, the private bucket) deploys in this order. Production only; agents never run these.

**Before merging (Supabase dashboard / SQL editor, production):**

- [ ] Auth → Users: trevor@, brighton@ and ryan@brightdesigns.band all exist (these are the seeded owners). Auth → Providers: "Allow new users to sign up" is OFF.
- [ ] `select schemaname, tablename, policyname, roles, cmd, qual, with_check from pg_policies where schemaname = 'storage';`
      Drop any policy that mentions brightdesigns.band (the migration stops if one remains) and any policy not limited by bucket_id (it would open the private bucket to every signed-in account).
- [ ] Storage: create bucket "private", NOT public. Leave `STORAGE_PRIVATE_BUCKET` and `NEXT_PUBLIC_STORAGE_BUCKET` unset in Netlify.
- [ ] `npm run db:migrate:status` → only SP3 files pending (0002–0004, admin_users, slug_redirects_rls, storage_policies_admin, plus storage_public_select listed as held). If anything older is pending, or the drizzle baseline row (`drizzle/README.md`) is missing, sort that out first.
- [ ] `ALLOW_DB_MIGRATE=true npm run db:migrate`. It must finish with every file applied. If it stops, do NOT merge; fix and re-run.

**Merge / deploy:**

- [ ] Merge. After the deploy, each owner signs in: /admin loads, and /admin/users lists three owners.
      Locked out? Run in the SQL editor: `insert into public.admin_users (email, role) values ('<you>@brightdesigns.band','owner') on conflict do nothing;`
- [ ] `/api/export/shows.csv` returns 200. A renamed show's old `/shows/<slug>` gives a 308.

**Same day:**

- [ ] `npx tsx scripts/migrate-private-files.ts` (dry run), then `--apply`. Keep the manifest it prints.
- [ ] Dry run again: "0 to move" and no "skip" lines (resolve or accept each one).

**Optional, only after a clean dry run:**

- [ ] `npx tsx scripts/apply-sql-migrations.ts --apply --only 2026-10-09_storage_public_select.sql`

To add an editor: add them at /admin/users AND invite them in Supabase → Authentication → Users.

`npm run db:migrate:status` lists the hand-written track (`drizzle/migrations/`) only. For drizzle 0002–0004, compare `select created_at from drizzle.__drizzle_migrations order by created_at desc;` with the `when` values in `drizzle/meta/_journal.json` (an entry newer than the latest row is pending). Details per step: `lib/actions/README.md` and `drizzle/README.md` ("Known pending").

## Environment

Every variable is listed and described in `.env.example`. Server-side variables are validated with zod in `lib/env.server.ts` (`getEnv()`) the first time they are used, so a bad value fails with a clear message rather than at some later call site. Public helpers live in `lib/env.ts`.

## Docs

- `CONTEXT.md`: one-page orientation (data model, where things live, auth, caching, current program).
- `docs/adr/`: architecture decision records. Start with `0001-overhaul-program.md`.
- `docs/README.md`: index of everything else (setup guides, feature docs, API and component indexes).

## Agent skills

Agent tooling is configured in `CLAUDE.md` (`AGENTS.md` points to it).

### Issue tracker

Issues live as GitHub issues in `trevorschachner/bright-designs-band`, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical triage roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), each label string equal to its name. See `docs/agents/triage-labels.md`.

### Domain docs

Single context: a root `CONTEXT.md` plus `docs/adr/`. See `docs/agents/domain.md`.
