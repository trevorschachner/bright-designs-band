-- Undoes 2026-11-26_arrangements_perusal_score.sql. The perusal score files
-- stay in `files`, unlinked.
ALTER TABLE arrangements DROP COLUMN IF EXISTS perusal_score_file_id;
