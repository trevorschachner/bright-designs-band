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
| 2026-10-07 | 4c75d63 | `/` | 82 | 5.0 s | 408 | Local, before Task 4. FCP 1.2 s; LCP element the hero subtitle `<p>`; 91% of LCP is "render delay" |
| 2026-10-07 | 4c75d63 | `/shows` | 83 | 4.6 s | 432 | Local, before Task 4 |
| 2026-10-07 | 4c75d63 | `/shows/true-north` | 84 | 4.6 s | 411 | Local, before Task 4. LCP element the poster; no `fetchpriority=high` |
| 2026-10-07 | Task 4 | `/` | 88 | 3.9 s | 369 | Local, after Task 4: no framer-motion anywhere, no remount after hydration, 4 Poppins weights, single PostHog init. Two runs, identical. Observed LCP now equals observed FCP (88 ms) |
| 2026-10-07 | Task 4 | `/shows` | 88 | 3.9 s | 394 | Local, after Task 4. Two runs, identical. TBT 30 ms |
| 2026-10-07 | Task 4 | `/shows/true-north` | 88 | 3.9 s | 373 | Local, after Task 4: poster `fetchpriority=high`. Two runs, identical |

Why local LCP stays near 4 s: Lantern's LCP graph includes every request that
finished, and every script that was evaluated, before the observed LCP paint.
On localhost the root-layout chunks (react-dom 71 KB, posthog-js 53 KB, the
Next runtime 44 KB, ...) arrive and run before Chrome's first frame, so the
simulated slow-4G download of all of them is counted against LCP even though
the text is in the HTML. Making posthog-js a lazy import (and dropping
`PHProvider`, which imports it statically) took `/` to 91 / 3.5 s in a
throwaway build; the rest is the framework floor. Production, where the HTML
paints before the chunks arrive, is the number to watch.
| 2026-10-07 | b5ef491 | `/` | 87 | 4.0 s | 335 | Local, Task 4 fixes: posthog-js lazy (loads at ~140 ms, after LCP; surveys off), Poppins 300–800 (6 preloads), Inter preloaded again. Two runs, 4.0 s both |
| 2026-10-07 | b5ef491 | `/shows` | 87 | 4.1 s | 360 | Local, Task 4 fixes. Two runs, 4.1 s both |
| 2026-10-07 | b5ef491 | `/shows/true-north` | 87 | 4.1 s | 339 | Local, Task 4 fixes. Two runs, 4.1 s both |

Font preloads are high-priority requests that finish before the LCP paint, so
Lantern counts them against LCP too. A throwaway build of b5ef491 with only
`preload: false` on Inter (a 48 KB variable font that is never painted; it sits
behind Poppins in every stack) measured `/` 89 / 3.8 s, `/shows` 89 / 3.7 s,
`/shows/true-north` 89 / 3.8 s.
