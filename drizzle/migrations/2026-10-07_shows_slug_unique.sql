-- Lowercase every show slug and make sure slugs are unique.
--
-- /shows/[slug] used to fall back to a case-insensitive scan
-- (LOWER(slug) = LOWER($1) OR LOWER(REPLACE(slug, '_', '-')) = ...) when the
-- exact match missed. That scan cannot use an index and ran on every miss,
-- including every bot probe. SP2 removes it: a page now matches the exact slug
-- only, so stored slugs must already be in canonical form (lowercase words
-- separated by single hyphens: lib/slug.ts normaliseSlug, and the write-side
-- regex in lib/validation/shows.ts).
--
-- Pre-check before applying. Both queries should return no rows; if either
-- does, fix those rows by hand first (the update below would fail on a
-- collision, by design, rather than silently pick a winner):
--
--   -- slugs not in canonical form (mirrors normaliseSlug: trim, lowercase,
--   -- collapse runs of '-', strip leading/trailing '-'):
--   select id, slug from shows
--   where slug <> trim(both '-' from regexp_replace(lower(trim(slug)), '-{2,}', '-', 'g'));
--
--   -- slugs that would collide once lowercased:
--   select lower(slug) as slug, array_agg(id order by id) as ids
--   from shows group by lower(slug) having count(*) > 1;
--
-- The unique index normally exists already (2025-11-11_add_show_slug.sql and
-- 2026-08-19_schema_truth.sql both create shows_slug_unique_idx, and
-- lib/database/schema.ts declares slug .unique()). Creating it under the same
-- name with IF NOT EXISTS makes this a no-op where it is present and adds it
-- where it is not, instead of a second, redundant unique index.
--
-- The 23505 a duplicate slug raises is already answered with 409 by
-- PUT /api/shows/[id].

begin;

update public.shows set slug = lower(slug) where slug <> lower(slug);

create unique index if not exists shows_slug_unique_idx on public.shows using btree (slug);

commit;

-- rollback (the lowercase rewrite is not reversible; the index predates this
-- migration on most databases, so only drop it if this migration created it):
-- begin;
-- drop index if exists public.shows_slug_unique_idx;
-- commit;
