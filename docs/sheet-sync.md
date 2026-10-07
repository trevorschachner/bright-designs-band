# Sheet sync

The Google Sheets mirror the site. The site is the source of truth for show and part data; the sheets pull a copy. Nothing is pushed, nothing needs credentials.

## How the mirror works

`app/api/export/[file]/route.ts` serves four public CSVs. Each is pulled into a sheet tab whose cell A1 is an `IMPORTDATA` formula.

| CSV | Tab (auto tabs) | Columns |
|---|---|---|
| `https://brightdesigns.band/api/export/shows.csv` | Site Shows (auto) | `SHOW_COLUMNS` |
| `https://brightdesigns.band/api/export/parts.csv` | Site Parts (auto) | `PART_COLUMNS` |
| `https://brightdesigns.band/api/export/pieces.csv` | Site Pieces (auto) | `id, title, composer` |
| `https://brightdesigns.band/api/export/links.csv` | Site Links (auto), Active Assets sheet only | `show_id, arrangement_id, order_index` |

A1 of each tab is `=IMPORTDATA("https://brightdesigns.band/api/export/<file>.csv")`. The tabs exist in two spreadsheets: the Show Database (Site Shows, Site Parts, Site Pieces) and "Active Assets on Website 2026" (those three plus Site Links).

- **Reading.** `lib/export/load-show-sheet.ts` reads everything inside a `READ ONLY` transaction and shapes it with the row builders in `lib/export/show-sheet.ts` (which owns the column lists). `lib/export/public-export.ts` picks the public columns per file.
- **Caching.** The route caches through `cachedRead`, tagged `shows`, `arrangements`, `tags` and `pieces`. An admin write to any of those revalidates the route, so the next fetch is fresh.
- **Refresh.** Google re-fetches `IMPORTDATA` roughly hourly. After an admin edit the site side is fresh immediately; the sheet catches up on Google's next refresh.
- **Auto tabs are formula output.** Edit in /admin, never in an auto tab.

## Site-owned columns

These come from the site on every refresh. Order is the CSV order.

**Shows** (`SHOW_COLUMNS`): `id`, `title`, `slug`, `description`, `duration`, `difficulty`, `thumbnail_url`, `graphic_url`, `youtube_url`, `video_url`, `year`, `commissioned`, `program_coordinator`, `percussion_arranger`, `sound_designer`, `wind_arranger`, `drill_writer`, `ensemble_size`, `includes`, `tags`, `featured`, `display_order`.

**Parts** (`PART_COLUMNS`): `id`, `show`, `part`, `title`, `scene`, `duration_seconds`, `grade`, `ensemble_size`, `arranger`, `percussion_arranger`, `year`, `commissioned`, `youtube_url`, `sample_score_url`, `audio`, `pieces`.

**Pieces** (public): `id`, `title`, `composer`.

**Links**: `show_id`, `arrangement_id`, `order_index`.

## Sheet-only columns

The hand tabs in the Show Database sheet keep columns the site does not know about. They are maintained by hand and never overwritten by the mirror.

**Shows hand tab**
- `drive_folder`
- `files (score/parts/audio/video/drill)`
- `needs review`
- `website (on site / queued / no / not yet / ?)`
- `our work (music / drill / coordination)`

**Parts hand tab**
- `composer (until pieces are linked)`
- `percussion (ok / MISSING / blank = not checked)`
- `percussion follow-up`

Also on the hand tabs: YouTube posting status. Line hand tabs up with the auto tabs by `id` (lookup), not by row position.

## Adding a column

1. Add it to the schema (and, when it is new in the database, a migration, run by a human).
2. Add it to the column list and row builder in `lib/export/show-sheet.ts`, and select it in `lib/export/load-show-sheet.ts`.
3. Update the export test (`lib/export/__tests__/load-show-sheet-columns.test.ts`) so the column order is pinned.
4. The `IMPORTDATA` tabs pick it up on the next refresh with no sheet edit. Hand tabs need the column added manually.

Column order is part of the contract with the sheets; changing an existing order shifts every column to its right in any hand formula that references it.

## Forcing a refresh

Google decides when to re-fetch. To force it, edit the A1 formula cell (for example add and remove a space, or append `&""`) and press Enter; the tab re-imports immediately. Otherwise wait for the hourly refresh. If the data looks stale, first confirm the site has it: open the CSV URL in a browser.

## Why pieces omit copyright cost

The CSVs are public, like the rest of the site. The site does not show copyright cost or licensing status, so the public pieces CSV is `id, title, composer` only. Those fields stay in /admin and in the offline export below.

## Offline copy

    npm run export:shows -- <output-dir>

Writes `shows.csv`, `parts.csv` and `pieces.csv` using the same reader, in the full column order (pieces include `copyright_amount_usd` and `licensing_status`). Read-only, so it is safe against production. Needs `DATABASE_URL`.
