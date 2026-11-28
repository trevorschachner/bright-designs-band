-- Undoes 2026-11-27_drop_sample_score_url.sql. Restores the column empty (it
-- held no data).
ALTER TABLE arrangements ADD COLUMN IF NOT EXISTS sample_score_url text;
