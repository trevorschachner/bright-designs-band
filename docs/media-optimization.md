# Media Optimization (Supabase Egress)

## Why this exists

Supabase restricted the project with `Cached Egress Exceeded` (HTTP 402). The
cause was source assets, not traffic volume:

| Type | Files | Total | Avg |
|---|---|---|---|
| PNG posters | 17 | 88 MB | 5.3 MB |
| WAV audio | 5 | 112 MB | 22 MB |

A single 29 MB WAV play burns 0.6% of the free tier's 5 GB monthly egress.
Roughly 172 plays exhausts the quota on its own.

## What was changed

1. **`scripts/optimize-media.ts`** — re-encodes PNG → WebP (q82, max width
   1920) and WAV → MP3 (192k VBR), uploads the results *alongside* the
   originals, and repoints the database.
2. **OG image caching** — all four `opengraph-image.tsx` routes now set
   `revalidate = 604800`. Previously every crawler hit re-rendered the image
   and re-downloaded the full-size source art from Storage.
3. **Removed `unoptimized`** from `components/features/file-gallery.tsx` and
   `app/admin/shows/[id]/page.tsx`, which were serving multi-megabyte PNGs
   straight to the browser. The flag remains in `app/admin/shows/new/page.tsx`
   because that `src` is a local `data:` URL from `FileReader`, where Next's
   optimizer cannot help.

## Running it

```bash
npm run media:optimize                 # dry run, everything
npm run media:optimize -- --images     # dry run, images only
npm run media:optimize -- --audio      # dry run, audio only
npm run media:optimize -- --apply      # encode, upload, update the database
```

### Prerequisites for `--apply`

- `ffmpeg` on PATH (`brew install ffmpeg`) — audio only; `--images` works without it.
- `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (Supabase → Settings → API).
  The anon key cannot write to the bucket.
- **The Supabase project must not be restricted.** While it returns 402 the
  script cannot download originals or upload results. Dry runs still work,
  because they only read Postgres.

## Reverting

Every `--apply` writes `scripts/.media-migration-<timestamp>.json` recording
the before and after of every column it touched.

```bash
npx tsx scripts/optimize-media.ts --revert scripts/.media-migration-<ts>.json
```

Originals are never deleted from the bucket, so a revert fully restores the
prior state. Optimized objects are left behind; remove them by hand if you
want them gone.

**Revert late at your own risk.** The revert restores `files` rows
unconditionally, but only rewrites referencing columns that still hold the
post-migration URL. If someone re-pointed a show's thumbnail to a different
image after the migration, that column is correctly left alone — but the
`files` row still reverts, leaving the two describing different objects.
Revert promptly, or reconcile `shows.thumbnail_url` / `graphic_url` by hand
afterwards.

## Notes

- The script is idempotent — rows already pointing at `.webp`/`.mp3` are
  skipped, so a re-run after a partial failure is safe.
- `lib/media/optimize-plan.ts` holds the pure planning logic (which rows
  change, what each column becomes) and is unit tested in
  `lib/media/__tests__/`. `REFERENCING_COLUMNS` there lists every column that
  can hold a Storage URL — **add to it if new URL columns appear**, or a
  migration will leave dangling references.
- The 65 existing MP3s (2.8 MB average) were deliberately left alone.
- This does not prevent recurrence. Nothing stops the next 9 MB PNG from being
  uploaded; compressing on ingest in `lib/storage.ts` is the durable fix.
