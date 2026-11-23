-- Shows: visitors + listeners over the last 90 days, copied from PostHog by
-- scripts/sync-show-popularity.ts. Breaks ties in the catalog's default order
-- and orders the home page's featured shows. 0 until the first sync.
ALTER TABLE shows ADD COLUMN IF NOT EXISTS popularity integer DEFAULT 0 NOT NULL;
