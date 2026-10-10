-- Public URL slug for arrangements (/arrangements/<slug>); numeric ids 308 to it.
-- NOT NULL comes in a follow-up (2026-10-11_arrangements_slug_not_null.sql), applied
-- after the deploy that writes slugs is live, so the old code can keep inserting.
-- Guarantees after this runs: every slug is (1) non-empty, (2) not all digits
-- (all-digit paths are read as legacy ids), (3) unique.
ALTER TABLE arrangements ADD COLUMN IF NOT EXISTS slug text;

-- Backfill: lowercase title, non-alphanumerics to hyphens, collapsed; empty or
-- all-digit results get an 'arrangement' prefix; duplicates get -<id>.
WITH norm AS (
  SELECT id, trim(both '-' from regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g')) AS n FROM arrangements WHERE slug IS NULL
), base AS (
  SELECT id, CASE WHEN n = '' THEN 'arrangement' WHEN n ~ '^[0-9]+$' THEN 'arrangement-' || n ELSE n END AS s FROM norm
), ranked AS (
  SELECT id, s, row_number() OVER (PARTITION BY s ORDER BY id) AS n FROM base
)
UPDATE arrangements a SET slug = CASE WHEN r.n = 1 AND NOT EXISTS (SELECT 1 FROM arrangements x WHERE x.slug = r.s) THEN r.s ELSE r.s || '-' || a.id END
FROM ranked r WHERE a.id = r.id;

UPDATE arrangements SET slug = 'arrangement-' || id WHERE slug IS NULL OR slug = '';

-- Final uniqueness pass: a suffixed slug can still clash with another title's slug.
UPDATE arrangements a SET slug = a.slug || '-' || a.id
WHERE a.slug IN (SELECT slug FROM arrangements GROUP BY slug HAVING count(*) > 1)
  AND a.id <> (SELECT min(id) FROM arrangements b WHERE b.slug = a.slug);

CREATE UNIQUE INDEX IF NOT EXISTS arrangements_slug_unique_idx ON arrangements (slug);
