-- Backfill title from name where title is null or empty
UPDATE shows
SET title = name
WHERE (title IS NULL OR trim(title) = '')
  AND name IS NOT NULL
  AND trim(name) <> '';

-- Make title not null to enforce single source of truth
ALTER TABLE shows ALTER COLUMN title SET NOT NULL;

-- Drop legacy name column now that title is canonical
ALTER TABLE shows DROP COLUMN IF EXISTS name;

-- Update slug trigger to rely only on NEW.title
CREATE OR REPLACE FUNCTION ensure_show_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  base text;
  candidate text;
  exists_conflict boolean;
BEGIN
  -- Build base from title; fallback to show-{id}
  base := COALESCE(NULLIF(NEW.title, ''), 'show-' || NEW.id::text);
  candidate := lower(regexp_replace(base, '[^a-zA-Z0-9]+', '-', 'g'));
  candidate := trim(both '-' from candidate);
  IF candidate IS NULL OR candidate = '' THEN
    candidate := 'show-' || NEW.id::text;
  END IF;

  SELECT EXISTS(SELECT 1 FROM shows s WHERE s.slug = candidate AND s.id <> NEW.id) INTO exists_conflict;
  IF exists_conflict THEN
    candidate := candidate || '-' || NEW.id::text;
  END IF;

  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := candidate;
  END IF;

  RETURN NEW;
END;
$$;


