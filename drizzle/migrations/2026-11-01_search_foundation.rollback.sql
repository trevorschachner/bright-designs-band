-- Undoes 2026-11-01_search_foundation.sql. The pg_trgm and unaccent extensions stay: other code may use them.
DROP FUNCTION IF EXISTS public.refresh_search();
DROP MATERIALIZED VIEW IF EXISTS public.show_search;
DROP MATERIALIZED VIEW IF EXISTS public.arrangement_search;
DROP FUNCTION IF EXISTS public.search_fold(text);
ALTER TABLE arrangements DROP COLUMN IF EXISTS featured;
ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_kind_check;
ALTER TABLE tags DROP COLUMN IF EXISTS kind;
