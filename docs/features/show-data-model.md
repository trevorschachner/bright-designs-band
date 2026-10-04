# Show data model: shows, parts and pieces

[← Feature Index](./FEATURE_INDEX.md)

The site and the "Show Database" Google Sheet describe the same catalogue. This
page is the map between them (issue #51).

## Three levels

| Level | Table | Sheet tab | What it is |
|---|---|---|---|
| Show | `shows` | Shows | A full production, e.g. "Gold Rush". |
| Part | `arrangements` + `show_arrangements` | Parts | One movement of a show (Part 1–4), with its own audio. Titles are often medleys. `show_arrangements.order_index` is the part number. |
| Piece | `pieces` + `arrangement_pieces` | Pieces | A source work a part is built from, e.g. "Libertango", with composer, copyright cost and licensing status. |

"Arrangement" in code means a **part**. The sheet's old "Arrangements" tab
meant a **piece**; it is being renamed to Pieces.

A part is built from one or more pieces, in order
(`arrangement_pieces.order_index`), and a piece can appear in many parts.
Pieces are linked from the arrangement card in the admin show editor; the
catalogue itself is at `/admin/pieces`. Pieces are internal for now: their
API routes are staff-only and RLS gives the anon role no access.

## Show images: `graphic_url` vs `thumbnail_url`

Both columns exist and are not merged. As of 2026-10-04, 11 of 22 shows have
`thumbnail_url`, 10 have `graphic_url`, and every show with both has the same
value in each.

**Reads.** Every public surface prefers `graphic_url` and falls back to
`thumbnail_url`, then to the show's first public image file:

- Show cards and list view: `components/features/shows/ShowCard.tsx`, `ShowListView.tsx`, featured shows in `app/page.tsx`
- Show page and its OG image: `app/shows/[slug]/page.tsx`, `opengraph-image.tsx`
- Arrangement page: `app/arrangements/[id]/page.tsx` (after the arrangement's own image). The banner there renders only when `graphic_url` is set.
- `GET /api/shows` returns `thumbnailUrl = graphic || thumbnail || first image`, so API consumers see one resolved image.

**Writes.**

- `graphic_url` is set automatically by `POST /api/files` whenever an image is uploaded to a show (not to one of its parts). It has no field in the admin.
- `thumbnail_url` is the admin's "Thumbnail URL" field, "Set as thumbnail" in the show gallery, the new-show upload, and `POST /api/admin/shows/backfill-images`.
- Deleting a file clears whichever of the two pointed at it (`DELETE /api/files/[id]`).

So in practice: the latest uploaded show image wins over a manually chosen
thumbnail, because `graphic_url` is read first.

## Export to the sheet

    npm run export:shows -- <output-dir>

Writes `shows.csv`, `parts.csv` and `pieces.csv` in the sheet's column order
(see `lib/export/show-sheet.ts`). Every read runs in a `READ ONLY` transaction,
so it is safe against production. `ensemble_size` and `includes` on shows
export blank until those columns exist. A part linked to two shows appears
once per show.
