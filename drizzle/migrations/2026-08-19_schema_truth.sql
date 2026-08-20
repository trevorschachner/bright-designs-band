-- Schema truth: remove an orphan column and enforce slug uniqueness.
--
-- 1. arrangements."percussion arranger" (with a literal space) is a duplicate
--    of arrangements.percussion_arranger. Verified against production: the
--    spaced column holds 0 of 73 rows, the real one holds 68, and no code in
--    the repository references the spaced name. Keeping both leaves two
--    columns with the same meaning for anything reading the schema.
--
-- 2. shows.slug is NOT NULL and is used as the public URL key, but only ever
--    had a plain btree index (idx_shows_slug). A hand-written migration was
--    supposed to add a unique index and evidently never took, so uniqueness
--    has been enforced only by application-level collision loops — three of
--    them, each with a different algorithm. Verified: no duplicates exist, so
--    the constraint can be added without touching data.
--
-- 3. shows.title is declared .notNull() in lib/database/schema.ts but is
--    nullable in the database, so schema.ts has been lying about it and a
--    drizzle-kit generate would emit a spurious diff. arrangements.title is
--    nullable in both, yet every consumer treats it as the display name and
--    interpolates it unguarded. Verified: zero nulls in either column, so both
--    constraints can be enforced without touching data.

begin;

alter table public.arrangements drop column if exists "percussion arranger";

drop index if exists public.idx_shows_slug;
create unique index if not exists shows_slug_unique_idx on public.shows using btree (slug);

alter table public.shows alter column title set not null;
alter table public.arrangements alter column title set not null;

commit;
