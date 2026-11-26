-- Undoes 2026-11-26_arrangements_perusal_score.sql. Restores sample_score_url
-- empty (it held no data); the perusal score files stay in `files`, unlinked.
ALTER TABLE arrangements ADD COLUMN IF NOT EXISTS sample_score_url text;
ALTER TABLE arrangements DROP COLUMN IF EXISTS perusal_score_file_id;
