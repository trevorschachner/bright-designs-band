# GitHub setup cleanup

Audited and largely executed 2026-08-20. Production is Netlify (`brightdesigns.band` →
`bright-designs-band.netlify.app`, confirmed by `server: Netlify` and `x-nf-request-id`
headers). Everything below was GitHub-side drift that accumulated around that fact.

**Status: 18 of 21 done.** What is left is one Netlify dashboard change and three
decisions.

---

## Done

### Tier 1: a second public site was deploying on every push

- [x] **GitHub Pages disabled.** It had been building from `main` root with legacy Jekyll
      on every push, serving https://trevorschachner.github.io/bright-designs-band/ with
      `https_enforced` and `public: true`. Jekyll rendered `README.md` as the homepage and
      shipped a full SEO payload: `<title>Bright Designs Band</title>`, a canonical link,
      `og:site_name`, and JSON-LD `{"@type":"WebSite","name":"Bright Designs Band"}`. A
      public indexable page claiming the brand, competing with the real site while
      `lib/seo/`, the sitemap generator and the June blog worked to rank it.
      The URL now returns 404.

- [x] **`archived-jekyll/` deleted.** It held Font Awesome webfonts and nothing else. It
      was the leftover that explained why Pages was ever on.

- [x] **`github-pages` environment deleted.**

### Tier 2: CI that did not do what it looked like it did

All in `.github/workflows/test.yml`, rewritten.

- [x] **The `develop` trigger matched no branch.** Triggers were `[main, develop]`; the
      branches are `main` and `dev`. Nothing pushed to `dev` had ever run CI. Triggers are
      now `[main]` only, since `dev` is fully merged and slated for deletion.

- [x] **Node 18 dropped from the matrix.** It went EOL in April 2025 while `netlify.toml`
      pins `NODE_VERSION = "20"`, so every run spent a full job on a runtime production
      never executes. Now a single Node 20 job.

- [x] **The production database URL is out of CI.** `build-check` set
      `DATABASE_URL: ${{ secrets.DATABASE_URL }}` while using dummy Supabase values.
      Verified locally that the variable has to be *set* (lib/database throws at import
      time, and Next collects page data for `/shows/[slug]` and `/arrangements/[id]`) but
      does not have to *reach* anything: with `postgresql://ci:ci@127.0.0.1:5432/ci` the
      queries fail, the pages fall back, and `next build` still exits 0. CI now uses that
      dummy string.

- [x] **Duplicated jobs collapsed.** Three jobs each ran checkout + setup-node + `npm ci`,
      and `npm run test:email` (which is just `vitest run lib/email/__tests__`, a subset of
      `npm run test`) ran in two of them. `needs: []` on `email-tests` was a no-op, and
      `build-check` depended on `email-tests` but not on `test`, so a build could pass
      while the real suite failed. Now two jobs: `test`, then `build` which needs it.

- [x] **Typecheck added.** There was no `tsc --noEmit` anywhere in CI on a TypeScript
      codebase; `npm run lint` is eslint and does not typecheck. Added a `typecheck`
      script to `package.json` and a step that runs it.

- [x] **`concurrency` group added**, keyed on the ref with `cancel-in-progress`.
      Consecutive pushes used to stack full matrix runs.

- [x] **Artifact upload dropped.** It uploaded `coverage/` and `test-results/`;
      `npm run test` is plain `vitest run` and generates neither, so every run logged
      "No files were found with the provided path." Nothing consumed the artifacts.

- [x] **Pinned actions bumped** from `@v4` to `@v5`. The v4 tags target Node 20, which is
      deprecated on runners and was being force-run on Node 24.

### Tier 3: `release.yml` was fiction

- [x] **Deleted.** Zero runs ever, and it could not have succeeded: it cut
      `release/<version>` from main and opened a PR from that branch back into main, which
      is an empty diff, so `peter-evans/create-pull-request` would exit with nothing to
      commit. It also assumed a release-branch flow while Netlify deploys continuously from
      main, pinned `create-pull-request@v5` (two majors behind), and needed the "Allow
      GitHub Actions to create and approve pull requests" setting to be on.

### Tier 5: hygiene

- [x] **Merge settings tightened.** All four merge types had been enabled with
      `delete_branch_on_merge: false`. Now squash-only with auto-delete.

- [x] **Default Actions token permissions lowered** from `write` to `read`, and
      `can_approve_pull_request_reviews` turned off. Workflows escalate per job where
      needed; `test.yml` declares `permissions: contents: read`.

- [x] **Stale repo name fixed in `CLAUDE.md`.** It pointed the issue tracker at
      `trevorschachner/schachner-designs`, this repo's former name. GitHub redirects it, so
      every `gh` call had been working by accident.

- [x] **`README.md` deployment line corrected** from Vercel to Netlify.

- [x] **Wiki and Projects turned off.** Both were enabled and empty.

- [x] **`dev` branch deleted.** `git merge-base --is-ancestor origin/dev main` confirmed it
      was fully merged, zero unique commits, last commit 2026-05-19. `main` is now the only
      branch.

- [x] **All three environments deleted.** `github-pages`, `dev` (2025-10-09) and
      `Production` (2025-08-05). The latter two had zero protection rules and zero
      deployments.

---

## Resolved 2026-08-21

- [x] **Branch protection on `main`.** Enabled: required status checks `Lint, typecheck and
      test` and `Build`, strict (branch must be up to date), required linear history,
      `enforce_admins` on, force-pushes and deletions blocked, zero required reviews. Direct
      pushes to `main` no longer land; everything goes through a PR.

      **Caution if visibility ever changes.** Making the repo private on the current free
      plan *deletes* these rules — GitHub offers neither branch protection nor rulesets on
      private repos below Pro, and it removes them silently rather than suspending them.
      This was tried and reverted on 2026-08-21; the rules had to be recreated by hand.
      Keeping both private and protected requires GitHub Pro.

- [x] **The documented issue workflow is real.** The five triage labels (`needs-triage`,
      `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`) now exist, and the
      backlog was seeded as issues #31-#35. `docs/agents/` stays. `TODO.md` was collapsed
      into a pointer at the issue tracker so there is one backlog, not two.

- [x] **Repo visibility: public, deliberately.** Weighed against branch protection, which
      the free plan does not offer on private repos, and protection won. This is now a
      decision rather than an inherited default.

- [x] **`dev` branch.** Confirmed dead a second time — zero unique commits, 39 behind
      `main`. A `dev` → `main` workflow was considered and rejected: per-PR Netlify deploy
      previews plus required checks already provide the gate a shared integration branch
      would, without the second merge hop or the drift. Short-lived feature branches squash
      into `main`. Stale local refs deleted.

---

## Left to do

### Needs the Netlify dashboard

- [ ] **Turn on Netlify commit statuses for production deploys.** Tracked as issue #35.
      Netlify *does* report on pull requests — `deploy-preview`, `Header rules`, `Redirect
      rules` and `Pages changed` all appear as checks. It does not report on `main`, so a
      failed production build leaves no mark on the commit. Netlify → Site configuration →
      Build & deploy → the GitHub App settings.

- [ ] **The `DATABASE_URL` repo secret.** Added 2025-11-19, no longer referenced by any
      workflow now that `build-check` is gone. Delete it unless something else needs it:
      `gh secret delete DATABASE_URL -R trevorschachner/bright-designs-band`.

---

## Checked, not a problem

- `www.brightdesigns.band` 301s to the apex on Netlify. Correct.
- `SHOWS_SCHEMA` in `lib/filters/schema-analyzer.ts` matches its Drizzle table. Only the
  arrangements one had drifted (fixed in `efeb37a`).
- No stray repo webhooks. Netlify connects through the GitHub App, which is expected.
