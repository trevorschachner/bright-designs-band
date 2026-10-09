-- migrate: manual
-- Applied AFTER the deploy with arrangement slugs is live. Backfills any part
-- created by the previous deploy in between, then makes slug required.
UPDATE arrangements SET slug = 'arrangement-' || id WHERE slug IS NULL OR slug = '';
ALTER TABLE arrangements ALTER COLUMN slug SET NOT NULL;
