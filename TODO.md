# Project Todo List

The backlog lives in **GitHub issues**, not this file.

- Open work: `gh issue list`
- Ready for an agent to pick up: `gh issue list --label ready-for-agent`
- Needs a human decision: `gh issue list --label ready-for-human`

Conventions and triage labels are documented in `docs/agents/issue-tracker.md` and
`docs/agents/triage-labels.md`.

## Completed before the move to issues

- [x] Finish the `guard()` migration (`24df3b0`). Every API route now goes through
      `guard()` except `contact`, `robots` and `sitemap`, which are public by design.
      No production `getSession()` calls remain.
- [x] Collapse `QueryBuilder` into one module (`c6f2099`), now `lib/filters/table-query.ts`.
      Fixed filtering shows by `tags`/`arrangements`, which used to 500.
- [x] Delete the commented tutorial at the end of `lib/database/queries.ts` (#28).
- [x] Fix: Clear show `graphic_url`/`thumbnail_url` when the corresponding file is deleted (2025-12-02)
- [x] Feature: Add "Set as Thumbnail" button to Admin File Gallery (2025-12-02)
- [x] Feature: Add Tag and Scene filters to Arrangements list (2025-12-02)
