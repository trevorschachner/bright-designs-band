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

Never run migrations against the production database from an agent or a dev machine by habit. Production changes are applied deliberately by a person, and `migrate-db.js` refuses `NODE_ENV=production` unless `ALLOW_DB_MIGRATE=true`.

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
