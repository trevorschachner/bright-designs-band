-- Schema updates for shows/arrangements and join table

-- Create enum grade_band if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'grade_band') THEN
    CREATE TYPE grade_band AS ENUM ('1_2', '3_4', '5_plus');
  END IF;
END$$;

-- Create enum ensemble_size if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ensemble_size') THEN
    CREATE TYPE ensemble_size AS ENUM ('small', 'medium', 'large');
  END IF;
END$$;

-- shows table updates
ALTER TABLE shows
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS length_seconds integer,
  ADD COLUMN IF NOT EXISTS graphic_url text,
  ADD COLUMN IF NOT EXISTS youtube_url text,
  ADD COLUMN IF NOT EXISTS commissioned text,
  ADD COLUMN IF NOT EXISTS program_coordinator text,
  ADD COLUMN IF NOT EXISTS percussion_arranger text,
  ADD COLUMN IF NOT EXISTS sound_designer text,
  ADD COLUMN IF NOT EXISTS wind_arranger text,
  ADD COLUMN IF NOT EXISTS drill_writer text;

-- backfill shows.name from title where null
UPDATE shows SET name = title WHERE name IS NULL AND title IS NOT NULL;

-- Migrate difficulty to new enum, preserving existing values
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='shows' AND column_name='difficulty'
  ) THEN
    -- Add temporary column of the new enum type
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name='shows' AND column_name='difficulty_tmp'
    ) THEN
      ALTER TABLE shows ADD COLUMN difficulty_tmp grade_band;
    END IF;

    -- Map legacy difficulty values -> new enum values
    UPDATE shows
    SET difficulty_tmp = CASE difficulty::text
      WHEN 'Beginner' THEN '1_2'::grade_band
      WHEN 'Intermediate' THEN '3_4'::grade_band
      WHEN 'Advanced' THEN '5_plus'::grade_band
      ELSE NULL
    END
    WHERE difficulty_tmp IS NULL;

    -- Swap columns
    ALTER TABLE shows DROP COLUMN difficulty;
    ALTER TABLE shows RENAME COLUMN difficulty_tmp TO difficulty;
  ELSE
    -- No legacy column found; ensure new column exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name='shows' AND column_name='difficulty'
    ) THEN
      ALTER TABLE shows ADD COLUMN difficulty grade_band;
    END IF;
  END IF;
END$$;

-- arrangements table updates
ALTER TABLE arrangements
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS composer text,
  ADD COLUMN IF NOT EXISTS grade grade_band,
  ADD COLUMN IF NOT EXISTS year smallint,
  ADD COLUMN IF NOT EXISTS duration_seconds integer,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS percussion_arranger text,
  ADD COLUMN IF NOT EXISTS copyright_amount_usd numeric(10,2),
  ADD COLUMN IF NOT EXISTS ensemble_size ensemble_size,
  ADD COLUMN IF NOT EXISTS youtube_url text,
  ADD COLUMN IF NOT EXISTS commissioned text,
  ADD COLUMN IF NOT EXISTS sample_score_url text;

-- backfill arrangements.name from title where null
UPDATE arrangements SET name = title WHERE name IS NULL AND title IS NOT NULL;

-- Create show_arrangements join table
CREATE TABLE IF NOT EXISTS show_arrangements (
  show_id integer NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  arrangement_id integer NOT NULL REFERENCES arrangements(id) ON DELETE CASCADE,
  order_index smallint NOT NULL,
  CONSTRAINT show_arrangements_pkey PRIMARY KEY (show_id, arrangement_id)
);
CREATE INDEX IF NOT EXISTS show_arrangements_show_idx ON show_arrangements (show_id);
CREATE INDEX IF NOT EXISTS show_arrangements_arr_idx ON show_arrangements (arrangement_id);

-- Seed join rows from legacy arrangements.show_id if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='arrangements' AND column_name='show_id'
  ) THEN
    INSERT INTO show_arrangements (show_id, arrangement_id, order_index)
    SELECT show_id, id, 0 FROM arrangements WHERE show_id IS NOT NULL
    ON CONFLICT DO NOTHING;
    -- Drop the foreign key column now that join is created
    ALTER TABLE arrangements DROP COLUMN show_id;
  END IF;
END$$;


