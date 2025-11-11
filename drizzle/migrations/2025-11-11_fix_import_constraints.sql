-- Allow imports where legacy data doesn't have `name`, use `title` primarily
ALTER TABLE shows ALTER COLUMN name DROP NOT NULL;

-- Create function to ensure slug is set and unique on insert/update
CREATE OR REPLACE FUNCTION ensure_show_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  base text;
  candidate text;
  suffix text;
  exists_conflict boolean;
BEGIN
  -- Build base from name or title, fallback to show-{id}
  base := COALESCE(NULLIF(NEW.name, ''), NULLIF(NEW.title, ''), 'show-' || NEW.id::text);
  -- Normalize: lower, trim '-', replace non-alnum with '-'
  candidate := lower(regexp_replace(base, '[^a-zA-Z0-9]+', '-', 'g'));
  candidate := trim(both '-' from candidate);

  -- If empty after normalization, fallback to show-{id}
  IF candidate IS NULL OR candidate = '' THEN
    candidate := 'show-' || NEW.id::text;
  END IF;

  -- Ensure uniqueness by appending -{id} if needed
  SELECT EXISTS(SELECT 1 FROM shows s WHERE s.slug = candidate AND s.id <> NEW.id) INTO exists_conflict;
  IF exists_conflict THEN
    candidate := candidate || '-' || NEW.id::text;
  END IF;

  -- Set slug only if missing or empty
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := candidate;
  END IF;

  RETURN NEW;
END;
$$;

-- Install trigger (fires on insert and update)
DROP TRIGGER IF EXISTS trg_ensure_show_slug ON shows;
CREATE TRIGGER trg_ensure_show_slug
BEFORE INSERT OR UPDATE ON shows
FOR EACH ROW
EXECUTE FUNCTION ensure_show_slug();


