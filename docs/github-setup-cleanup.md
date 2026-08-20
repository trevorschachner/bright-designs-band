# GitHub setup cleanup

Audited 2026-08-20. Production is Netlify (`brightdesigns.band` → `bright-designs-band.netlify.app`,
confirmed by `server: Netlify` and `x-nf-request-id` headers). Everything below is
GitHub-side drift that accumulated around that fact.

Work top-down. Tier 1 is live and costing something today; Tier 5 is hygiene.

---

## Tier 1: a second public site is deploying on every push

- [ ] **Turn off GitHub Pages.**

  `gh api repos/trevorschachner/bright-designs-band/pages` reports `status: built`,
  `build_type: legacy`, source `main` at `/`, serving
  https://trevorschachner.github.io/bright-designs-band/ with `https_enforced` and
  `public: true`. It rebuilds on every push to main: the last run
  (`pages build and deployment`, 2026-08-20T02:46:57Z) fired seconds before the Test Suite.

  Jekyll is rendering `README.md` as the homepage, and it ships a full SEO payload:
  `<title>Bright Designs Band</title>`, `<link rel="canonical">`, `og:site_name`,
  and JSON-LD `{"@type":"WebSite","name":"Bright Designs Band"}`. A public, indexable,
  8.7KB page claiming the brand name, competing with the real site. This repo carries a
  whole `lib/seo/` module, `lib/seo/structured-data.ts`, a sitemap generator, and a blog
  added specifically for search in June. Pages is undercutting all of it.

  Fix: Settings → Pages → Source: **None**. Then delete the `github-pages` environment
  (Settings → Environments).

- [ ] **Delete `archived-jekyll/`.** It is Font Awesome webfonts and nothing else
  (`find archived-jekyll -type f` returns only `css/font-awesome/fonts/*`). It is the
  leftover that explains why Pages was ever on.

---

## Tier 2: CI that does not do what it looks like it does

All in `.github/workflows/test.yml`.

- [ ] **The `develop` trigger matches no branch.** Triggers are
      `branches: [main, develop]`. The branches are `main` and `dev`. Nothing pushed to
      `dev` has ever run CI. Either fix the trigger to `dev` or delete the branch:
      `git log --oneline main..origin/dev` is empty, so `dev` is fully merged and its last
      commit is 2026-05-19. Deleting is the cleaner call.

- [ ] **Drop Node 18 from the matrix.** Matrix is `[18.x, 20.x]`. Node 18 went EOL in
      April 2025, and `netlify.toml` pins `NODE_VERSION = "20"`. Every run spends a full
      job testing a runtime production never executes. Use `[20.x]`, or `[20.x, 22.x]` if
      you want forward cover.

- [ ] **Stop handing the production database URL to CI.** `build-check` sets
      `DATABASE_URL: ${{ secrets.DATABASE_URL }}` while using dummy values for
      `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. `next build` does not
      need a live database. The secret was added 2025-11-19 and is the real connection
      string. Remove the env line; if nothing else needs it, delete the secret.

- [ ] **Collapse the duplicated jobs.** Three jobs each run `checkout` + `setup-node` +
      `npm ci`. `npm run test:email` runs in both `test` and `email-tests`. `needs: []` on
      `email-tests` is a no-op. `build-check` needs `[email-tests]` but not `test`, so the
      build can pass while the actual test suite is failing.

- [ ] **Add a typecheck step.** There is no `tsc --noEmit` anywhere in CI on a TypeScript
      codebase. `npm run lint` is `next lint` and does not typecheck.

- [ ] **Add a `concurrency` group** keyed on the ref, with `cancel-in-progress: true`.
      Consecutive pushes currently stack full matrix runs.

- [ ] **Fix or drop the artifact upload.** It uploads `coverage/` and `test-results/`.
      `npm run test` is plain `vitest run` and generates neither, so the step warns on
      every run. Either add `--coverage` or delete the step.

---

## Tier 3: `release.yml` is fiction

- [ ] **Delete `.github/workflows/release.yml`.**

  `gh run list --workflow=release.yml` returns zero runs. It has never executed, and it
  could not succeed if it did:

  - It cuts `release/<version>` from main and opens a PR from that branch back into main.
    The branch has no commits added, so the diff is empty and
    `peter-evans/create-pull-request` exits with nothing to commit.
  - It assumes a release-branch flow. Netlify deploys continuously from main.
  - `peter-evans/create-pull-request@v5` is two majors behind (v7).
  - Opening a PR with `GITHUB_TOKEN` requires "Allow GitHub Actions to create and approve
    pull requests," which is a separate org/repo setting.

---

## Tier 4: Netlify reports nothing back to GitHub

- [ ] **Enable Netlify commit statuses and deploy previews.**

  `gh api .../commits/727db83/check-runs` returns seven checks, all from the
  `github-actions` app (including Pages' `build`, `deploy`, `report-build-status`). Zero
  from Netlify. `gh api .../deployments` shows only `github-pages` entries. `.../commits/727db83/status`
  is `pending` with an empty `statuses` array.

  So a failed production build leaves no mark on the commit or on any PR. Netlify Site
  configuration → Build & deploy → Deploy notifications / GitHub App: turn on commit
  statuses and deploy previews for pull requests.

- [ ] **Delete the empty `dev` and `Production` environments.** Created 2025-10-09 and
      2025-08-05, zero protection rules, zero deployments. `github-pages` goes with Tier 1.

---

## Tier 5: hygiene and conventions

- [ ] **Protect `main`.** `gh api .../branches/main/protection` returns 404 Branch not
      protected, and `.../rulesets` is `[]`. Everything lands by direct push. Minimum
      worth having: require the Test Suite check to pass before a push lands. Requiring
      PRs is a bigger workflow change; decide separately.

- [ ] **Tighten merge settings.** All four merge types are on
      (`allow_squash_merge`, `allow_merge_commit`, `allow_rebase_merge`, `allow_auto_merge`)
      and `delete_branch_on_merge` is `false`. Squash-only plus auto-delete keeps history
      readable.

- [ ] **Lower default Actions token permissions.** `default_workflow_permissions` is
      `write` and `can_approve_pull_request_reviews` is `true`. Set the default to `read`
      and escalate per job where a workflow actually needs to write.

- [ ] **Fix the stale repo name in `CLAUDE.md`.** It points the issue tracker at
      `trevorschachner/schachner-designs`. That is this repo's former name. GitHub
      redirects it, so every `gh` call works by accident.

- [ ] **Decide whether the documented issue workflow is real.** `docs/agents/issue-tracker.md`
      and `docs/agents/triage-labels.md` describe GitHub issues, five triage labels
      (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`),
      wayfinder maps, sub-issues, and native issue dependencies. Reality: zero issues ever
      opened, and `gh label list` returns only GitHub's nine stock labels. Either create
      the labels and start using issues, or delete the docs so they stop describing a
      system that does not exist.

- [ ] **`README.md` says the project deploys to Vercel.** It deploys to Netlify.

- [ ] **Turn off Wiki and Projects** (`has_wiki` and `has_projects` are true, both empty).

- [ ] **Decide on repo visibility.** The repo is public. It contains the admin dashboard
      source, `lib/auth/` guards and role logic, and `drizzle/migrations/` including
      `2026-08-19_restrict_rls_writes_to_staff.sql`, which spells out every RLS policy.
      Last session's own commit message notes the Supabase anon key ships in the client
      bundle. Public source means anyone can read exactly how authorization is enforced
      and which policies were just patched. This is a real decision either way, but it
      should be a decision rather than an inherited default.

---

## Not a problem, checked anyway

- `www.brightdesigns.band` 301s to the apex on Netlify. Correct.
- `SHOWS_SCHEMA` in `lib/filters/schema-analyzer.ts` matches its Drizzle table. Only the
  arrangements one had drifted.
- No stray repo webhooks (`gh api .../hooks` is empty). Netlify connects through the
  GitHub App, which is expected.
