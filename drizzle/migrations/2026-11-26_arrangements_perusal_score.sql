-- Perusal scores (#101, decision record #99): each arrangement gets one
-- private "Perusal score" slot. Additive only, so it is safe to apply before
-- the code that uses it deploys; dropping sample_score_url is the separate,
-- held 2026-11-27_drop_sample_score_url.sql.
--
-- perusal_score_file_id points at the `files` row of the arrangement's full
-- score PDF. That row is always private (private bucket, url = its download
-- route), kind `score`, and on the same arrangement; setPerusalScore
-- (lib/actions/files.ts) enforces that. A column on arrangements makes the
-- slot one per arrangement by construction. Deleting the file clears the
-- slot (ON DELETE SET NULL); deleting the arrangement removes its files
-- through lib/services/file-removal.ts as before.
--
-- Rollback: 2026-11-26_arrangements_perusal_score.rollback.sql.

ALTER TABLE arrangements
  ADD COLUMN IF NOT EXISTS perusal_score_file_id integer
  REFERENCES files(id) ON DELETE SET NULL;
