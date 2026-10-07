# Performance baseline

Lighthouse mobile (simulated throttling, Lighthouse 13.5, Chrome for Testing
1223). Local rows run against `npm run build && npm run start` with
`.env.local` on a MacBook; production rows against brightdesigns.band. Local
and production numbers are not directly comparable (no CDN and no network
latency locally, and the same throttling model). Compare rows of the same kind.

"Script KB" is the transfer size of all `Script` resources in the run.

| Date | Commit | Page | Perf | LCP | Script KB | Note |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-10-06 | production | `/shows` | 90 | 3.4 s | 313 | Production baseline before SP2 |
| 2026-10-07 | 9191c13 | `/shows` | 76 | 5.5 s | 415 | Local, before Task 2: client page, list fetched from `/api/shows` after hydration; HTML had 0 show links |
| 2026-10-07 | Task 2 | `/shows` | 82 | 4.5 s | 429 | Local, after Task 2: server-rendered list (24 show links in the HTML), one image per card. Second of two runs (first: 77, 5.0 s). LCP element is the hero subtitle text in both runs, not a card |
