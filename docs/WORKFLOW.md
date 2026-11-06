# Development Workflow

## Branches

- **`main`** - Integration branch. Every PR targets `main`. Merging gets a free Netlify branch deploy, not a production deploy.
- **`production`** - Netlify's production branch (brightdesigns.band). Only the Release workflow moves it, and only forward to `main`.

## Why

Netlify bills 15 credits per production deploy. Deploy previews and branch deploys are free. When `main` was the production branch, every merged PR cost a production deploy, and busy days merged four to six. Now merged PRs pile up on `main` and ship together.

## Day to day

1. Branch from `main`, open a PR into `main`.
2. Check the Netlify deploy preview on the PR (free).
3. Merge when CI is green. Nothing reaches the live site yet.

## Releasing

Actions → **Release to production** → **Run workflow** (or `gh workflow run release.yml`).

The workflow:

1. Refuses to run unless CI ("Lint, typecheck, test and build") passed on the `main` commit.
2. Fast-forwards `production` to `main`. Netlify then builds one production deploy.
3. Lists the commits it shipped in the run summary.

Release whenever a batch is worth shipping, about once or twice a week. Release right away for security fixes and anything a customer is waiting on.

## Hotfixes

Merge the fix into `main` like any PR, then run the release. `production` never takes commits that are not on `main`, so the push fails rather than overwrite anything if someone pushes to `production` directly.

## Rolling back

Netlify → Deploys → pick the previous production deploy → **Publish deploy**. Rollbacks cost no credits. Then revert the bad change on `main` before the next release.
