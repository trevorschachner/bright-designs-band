-- Perusal scores (#101, decision record #99): each arrangement gets one
-- private "Perusal score" slot, and the free-text sample_score_url goes.
--
-- perusal_score_file_id points at the `files` row of the arrangement's full
-- score PDF. That row is always private (private bucket, url = its download
-- route), kind `score`, and on the same arrangement; setPerusalScore
-- (lib/actions/files.ts) enforces that. A column on arrangements makes the
-- slot one per arrangement by construction. Deleting the file clears the
-- slot (ON DELETE SET NULL); deleting the arrangement removes its files
-- through lib/services/file-removal.ts as before.
--
-- sample_score_url: 0 of 211 arrangements had a value when this was written
-- (2026-11-26). Check before applying:
--   select count(*) from arrangements where sample_score_url is not null;
-- The application no longer reads or writes it; deploy that code before or
-- together with this migration.
--
-- Rollback: 2026-11-26_arrangements_perusal_score.rollback.sql.

ALTER TABLE arrangements
  ADD COLUMN IF NOT EXISTS perusal_score_file_id integer
  REFERENCES files(id) ON DELETE SET NULL;

ALTER TABLE arrangements DROP COLUMN IF EXISTS sample_score_url;
