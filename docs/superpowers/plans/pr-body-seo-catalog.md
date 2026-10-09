## Deploy order (migrations BEFORE merge, like SP3)
1. `npm run db:migrate:status` then `npm run db:migrate` applies `2026-10-10_shows_program_notes.sql` and `2026-10-10_arrangements_slug.sql` (idempotent; backfills arrangement slugs).
2. Merge. Netlify deploy.
3. `npx tsx scripts/seo/apply-theme-tags.ts --apply` (DATABASE_URL from Netlify env).
4. Smoke: `curl -sI https://brightdesigns.band/arrangements/2` returns 308 to /arrangements/<slug>; `curl -s https://brightdesigns.band/collections/easy-marching-band-shows | grep -c FAQPage` returns 1; `curl -s https://brightdesigns.band/collections/small-band-marching-shows -o /dev/null -w '%{http_code}'` returns 308; `/sitemap.xml` lists only published collections and only indexable arrangements.
5. Request indexing in Search Console for /shows/* and /collections/*
   (also resubmit the sitemap).

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
