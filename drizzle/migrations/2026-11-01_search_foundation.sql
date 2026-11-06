-- Build a Show, phase 1 (#82): tag kinds, featured parts, and the search
-- documents behind lib/services/search.ts.
--
-- Search reads two materialized views, one row per arrangement and per show.
-- They are rebuilt by public.refresh_search(), which every catalog write
-- schedules after it commits (lib/services/invalidate.ts). About 250 rows, so a
-- refresh takes milliseconds. CONCURRENTLY keeps readers unblocked; it needs
-- the unique index on each view.
--
-- Rollback: 2026-11-01_search_foundation.rollback.sql.

-- Supabase keeps extensions in their own schema; elsewhere (tests) it is created here.
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

-- Lowercase without accents ("Café" -> "cafe"). Schema-qualified, dictionary
-- named explicitly: one-argument unaccent() depends on the search_path.
CREATE OR REPLACE FUNCTION public.search_fold(text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
  AS $$ SELECT lower(extensions.unaccent('extensions.unaccent'::regdictionary, $1)) $$;

-- Tag kinds group tags into facets (Mood, Theme, ...). Existing "Theme: " tags are themes.
ALTER TABLE tags ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'other';
ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_kind_check;
ALTER TABLE tags ADD CONSTRAINT tags_kind_check CHECK (kind IN ('theme', 'mood', 'genre', 'style', 'other'));
UPDATE tags SET kind = 'theme' WHERE name LIKE 'Theme: %' AND kind = 'other';

ALTER TABLE arrangements ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

-- One row per arrangement. Weights: A title and source pieces, B shows and
-- people, C tags (its own and its shows', minus the "Theme: " prefix) and description.
-- trgm_text is the short text the typo fallback compares against. It has no
-- trigram index: the fallback scores word_similarity() on every row, and at a
-- few hundred rows a scan is faster than an index it could not use anyway.
DROP MATERIALIZED VIEW IF EXISTS public.arrangement_search;
CREATE MATERIALIZED VIEW public.arrangement_search AS
SELECT
  a.id AS arrangement_id,
  setweight(to_tsvector('english', public.search_fold(concat_ws(' ', a.title, p.titles))), 'A')
    || setweight(to_tsvector('english', public.search_fold(concat_ws(' ', s.titles, a.composer, a.arranger, a.percussion_arranger, p.composers))), 'B')
    || setweight(to_tsvector('english', public.search_fold(concat_ws(' ', t.names, a.description))), 'C') AS doc,
  public.search_fold(concat_ws(' ', a.title, p.titles, s.titles, a.composer, p.composers)) AS trgm_text
FROM arrangements a
LEFT JOIN LATERAL (
  SELECT string_agg(pc.title, ' ') AS titles, string_agg(pc.composer, ' ') AS composers
  FROM arrangement_pieces ap JOIN pieces pc ON pc.id = ap.piece_id
  WHERE ap.arrangement_id = a.id
) p ON true
LEFT JOIN LATERAL (
  SELECT string_agg(sh.title, ' ') AS titles
  FROM show_arrangements sa JOIN shows sh ON sh.id = sa.show_id
  WHERE sa.arrangement_id = a.id
) s ON true
LEFT JOIN LATERAL (
  SELECT string_agg(regexp_replace(tg.name, '^Theme: ', ''), ' ') AS names
  FROM tags tg
  WHERE tg.id IN (
    SELECT at.tag_id FROM arrangements_to_tags at WHERE at.arrangement_id = a.id
    UNION
    SELECT st.tag_id FROM shows_to_tags st JOIN show_arrangements sa ON sa.show_id = st.show_id
    WHERE sa.arrangement_id = a.id
  )
) t ON true;

CREATE UNIQUE INDEX arrangement_search_id_idx ON public.arrangement_search (arrangement_id);
CREATE INDEX arrangement_search_doc_idx ON public.arrangement_search USING gin (doc);

-- One row per show. A title and the source pieces of its parts, B its part
-- titles, C tags, description and program notes.
DROP MATERIALIZED VIEW IF EXISTS public.show_search;
CREATE MATERIALIZED VIEW public.show_search AS
SELECT
  sh.id AS show_id,
  setweight(to_tsvector('english', public.search_fold(concat_ws(' ', sh.title, p.titles))), 'A')
    || setweight(to_tsvector('english', public.search_fold(coalesce(ar.titles, ''))), 'B')
    || setweight(to_tsvector('english', public.search_fold(concat_ws(' ', t.names, sh.description, sh.program_notes))), 'C') AS doc,
  public.search_fold(concat_ws(' ', sh.title, ar.titles, p.titles)) AS trgm_text
FROM shows sh
LEFT JOIN LATERAL (
  SELECT string_agg(a.title, ' ') AS titles
  FROM show_arrangements sa JOIN arrangements a ON a.id = sa.arrangement_id
  WHERE sa.show_id = sh.id
) ar ON true
LEFT JOIN LATERAL (
  SELECT string_agg(DISTINCT pc.title, ' ') AS titles
  FROM show_arrangements sa
  JOIN arrangement_pieces ap ON ap.arrangement_id = sa.arrangement_id
  JOIN pieces pc ON pc.id = ap.piece_id
  WHERE sa.show_id = sh.id
) p ON true
LEFT JOIN LATERAL (
  SELECT string_agg(regexp_replace(tg.name, '^Theme: ', ''), ' ') AS names
  FROM shows_to_tags st JOIN tags tg ON tg.id = st.tag_id
  WHERE st.show_id = sh.id
) t ON true;

CREATE UNIQUE INDEX show_search_id_idx ON public.show_search (show_id);
CREATE INDEX show_search_doc_idx ON public.show_search USING gin (doc);

CREATE OR REPLACE FUNCTION public.refresh_search() RETURNS void
  LANGUAGE plpgsql
  AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.arrangement_search;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.show_search;
END
$$;

-- Server-only, like the tables they read: materialized views have no RLS, so
-- keep them (and the refresh) away from the PostgREST roles.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public.arrangement_search, public.show_search FROM anon, authenticated;
    REVOKE EXECUTE ON FUNCTION public.refresh_search() FROM PUBLIC, anon, authenticated;
  END IF;
END
$$;
