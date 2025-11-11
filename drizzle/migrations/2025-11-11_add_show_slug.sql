-- Add slug column to shows, backfill values, enforce uniqueness
ALTER TABLE shows ADD COLUMN IF NOT EXISTS slug text;

-- Backfill slug from name/title (fallback to show-{id})
UPDATE shows
SET slug = trim(both '-' from lower(regexp_replace(
  COALESCE(NULLIF(name, ''), NULLIF(title, ''), 'show-' || id::text),
  '[^a-zA-Z0-9]+', '-', 'g'
)))
WHERE slug IS NULL OR slug = '';

-- Disambiguate duplicate slugs by appending -{id}
WITH dups AS (
  SELECT slug
  FROM shows
  GROUP BY slug
  HAVING COUNT(*) > 1
)
UPDATE shows s
SET slug = s.slug || '-' || s.id::text
FROM dups
WHERE s.slug = dups.slug;

-- Ensure not null and unique
ALTER TABLE shows ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS shows_slug_unique_idx ON shows (slug);


