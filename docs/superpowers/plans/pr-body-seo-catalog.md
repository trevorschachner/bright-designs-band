## Deploy order
1. `npm run db:migrate:status`, then `npm run db:migrate` (applies `2026-10-10_shows_program_notes.sql` and `2026-10-10_arrangements_slug.sql`; both idempotent; the live code keeps working because `slug` is still nullable and the new show columns are optional).
2. `npx tsx scripts/seo/apply-theme-tags.ts` (dry run; expect 34 found, 0 missing), then `--apply`. Safe on the live code: old collections filter only on difficulty and `Small Band`.
3. Merge. Wait for the Netlify deploy to go live.
4. Apply `2026-10-11_arrangements_slug_not_null.sql` (`npm run db:migrate`).
5. Smoke: `curl -sI https://brightdesigns.band/arrangements/2` returns a real 308 (not 200) to `/arrangements/<slug>`; `curl -s https://brightdesigns.band/collections/easy-marching-band-shows | grep -c FAQPage` returns 1; `curl -s -o /dev/null -w '%{http_code}' https://brightdesigns.band/collections/story-marching-band-shows` returns 200; `/collections/small-band-marching-shows` returns 308; `/sitemap.xml` lists only published collections and only indexable arrangements; the canonical on a show page is `https://brightdesigns.band/shows/<slug>` (apex).
6. Lighthouse on one show page and one collection page from the deploy preview (script <= 425 KiB).
7. Search Console: resubmit the sitemap; request indexing for `/shows/*` and `/collections/*`.

Rollback: before rolling back to a deploy older than this PR, run `ALTER TABLE arrangements ALTER COLUMN slug DROP NOT NULL;`.

## What changed
- Theme tags: apply in one transaction, single read of existing links
- Theme tags: mapping for all 34 shows and an idempotent apply script
- Collection pages with intro copy, FAQ and CollectionPage schema; grouped index; publish rule in sitemap and llms
- Collections v2: restore indoor-winds description, narrow count regex
- Collections v2: review fixes (descriptions, nulls last, content guard, filter tests)
- Collections v2: 14 data-driven collections with tag/year filters, publish rule, content files
- Arrangement pages index only with 120+ words of real description; thin ones noindex,follow and out of the sitemap
- Arrangement slugs: never all digits or empty, capped collision loop, hardened backfill
- Arrangements get slugs: /arrangements/<slug>, 308 from numeric ids, sitemap and links updated
- Show page: render unknown note sections under the about heading; review fixes
- Show page: question-shaped sections from program notes, FAQ schema, related shows and collections
- Show schema: duration, level, in-stock offer without price; per-show FAQ builder
- Fix program-notes parsing: sentence-end summary cutting, bare bullets, EMPTY object, and edge cases
- Program-notes parser/renderer and ISO duration helper
- createShow stores programNotes; tidy export test and includes checkbox parsing
- Shows gain program notes, ensemble size and includes: schema, admin editor, CSV export
- Titles and descriptions that say what the page is: marching band shows, arrangements, design
- Self-canonical on every public page; drop the root canonical that leaked the homepage
- Add the SEO catalog implementation plan and collection copy

## Review notes
- The Netlify build will fail until the migrations are applied to the production database.
- Arrangement pages are noindex until their descriptions reach 120 words (content batch to follow).

## Closes
Part of #62 (technical half of SP5).
