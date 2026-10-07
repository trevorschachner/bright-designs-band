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
| 2026-10-07 | Task 3 | `/shows/true-north` | 83 | 4.7 s | 411 | Local, after Task 3: one show lookup per request (React `cache`), arrangements+pieces and files in parallel, exact-slug only. Second of two runs (first: 75, 5.9 s; TBT 210 ms vs 30 ms). TTFB (cached) 3 ms ×3 |
| 2026-10-07 | Task 3 | `/arrangements/58` | 85 | 4.4 s | 416 | Local, after Task 3: ISR (`● SSG`, `x-nextjs-cache: HIT`), no `cookies()`, one relational query. Second of two runs (first: 80, 5.3 s). TTFB: 170 ms on the first (uncached) render, then 2-3 ms ×3 |
