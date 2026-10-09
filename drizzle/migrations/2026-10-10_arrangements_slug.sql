-- Public URL slug for arrangements (/arrangements/<slug>); numeric ids 308 to it.
ALTER TABLE arrangements ADD COLUMN IF NOT EXISTS slug text;

-- Backfill: lowercase title, non-alphanumerics to hyphens, collapsed; duplicates get -<id>.
WITH base AS (
  SELECT id, trim(both '-' from regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g')) AS s FROM arrangements WHERE slug IS NULL
), ranked AS (
  SELECT id, s, row_number() OVER (PARTITION BY s ORDER BY id) AS n FROM base
)
UPDATE arrangements a SET slug = CASE WHEN r.n = 1 AND NOT EXISTS (SELECT 1 FROM arrangements x WHERE x.slug = r.s) THEN r.s ELSE r.s || '-' || a.id END
FROM ranked r WHERE a.id = r.id;

UPDATE arrangements SET slug = 'arrangement-' || id WHERE slug IS NULL OR slug = '';
ALTER TABLE arrangements ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS arrangements_slug_unique_idx ON arrangements (slug);
