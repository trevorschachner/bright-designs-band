# Project Todo List

## High Priority
- [ ] Finish the GitHub cleanup: 18 of 21 items done 2026-08-20. Left are Netlify commit
      statuses (needs the Netlify dashboard) and three decisions: branch protection on
      `main`, whether the issue workflow in `docs/agents/` is real, and repo visibility.
      See `docs/github-setup-cleanup.md`.

## Features
- [ ] 

## Bugs & Issues
- [ ] 

## Improvements & Refactoring
- [ ] Finish the `guard()` migration: 6 of 16 API routes still hand-roll authorization in
      three idioms, and 4 still use `getSession()` (trusts the cookie) rather than
      `getUser()` (revalidates). See `docs/architecture-review.md`.
- [ ] Collapse `QueryBuilder` into one `queryTable` module. Fixes filtering shows by
      `tags`/`arrangements`, which currently 500s.
- [ ] Derive filter fields from Drizzle's `getTableColumns` instead of the hand-maintained
      parallel schema in `lib/filters/schema-analyzer.ts`.
- [ ] Delete the ~90 lines of commented tutorial at the end of `lib/database/queries.ts`
      (demonstrates `getAllShows`/`getShowsWithFilters`, neither of which exists), and
      decide the `lib/database/queries.ts` vs `lib/services/` split.

## Completed
- [x] Fix: Clear show `graphic_url`/`thumbnail_url` when the corresponding file is deleted (2025-12-02)
- [x] Feature: Add "Set as Thumbnail" button to Admin File Gallery (2025-12-02)
- [x] Feature: Add Tag and Scene filters to Arrangements list (2025-12-02)
