-- Update shows.difficulty to new enum values and drop legacy columns
-- This migration is safe to run once in production; guards are included for idempotency where possible.

-- 1) Ensure target enum exists
DO $$ BEGIN
  CREATE TYPE "public"."difficulty" AS ENUM ('Beginner', 'Intermediate', 'Advanced');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2) If shows.difficulty is currently of type grade_band, migrate values to new enum
DO $$
DECLARE
  v_data_type text;
BEGIN
  SELECT data_type INTO v_data_type
  FROM information_schema.columns
  WHERE table_name = 'shows' AND column_name = 'difficulty';

  -- When using enums, information_schema shows data_type = 'USER-DEFINED' and udt_name has the actual type
  IF v_data_type = 'USER-DEFINED' THEN
    PERFORM 1 FROM information_schema.columns
    WHERE table_name = 'shows' AND column_name = 'difficulty' AND udt_name = 'grade_band';

    IF FOUND THEN
      -- Add temp column using the new enum type
      ALTER TABLE "public"."shows" ADD COLUMN IF NOT EXISTS difficulty_tmp "public"."difficulty";

      -- Map values from grade_band -> difficulty
      UPDATE "public"."shows" SET difficulty_tmp = CASE difficulty::text
        WHEN '1_2' THEN 'Beginner'::"public"."difficulty"
        WHEN '3_4' THEN 'Intermediate'::"public"."difficulty"
        WHEN '5_plus' THEN 'Advanced'::"public"."difficulty"
        ELSE NULL
      END
      WHERE difficulty_tmp IS NULL;

      -- Swap columns
      ALTER TABLE "public"."shows" DROP COLUMN difficulty;
      ALTER TABLE "public"."shows" RENAME COLUMN difficulty_tmp TO difficulty;
    END IF;
  END IF;
END $$;

-- 3) Drop legacy columns from shows
ALTER TABLE "public"."shows" DROP COLUMN IF EXISTS composer;
ALTER TABLE "public"."shows" DROP COLUMN IF EXISTS song_title;


