-- Align DB with current schema: arrangement scene + show columns

-- Create enum for arrangement scene (safe if already exists)
DO $$ BEGIN
  CREATE TYPE "public"."arrangement_scene" AS ENUM('Opener', 'Ballad', 'Closer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint

-- Add scene column to arrangements
ALTER TABLE "arrangements" ADD COLUMN IF NOT EXISTS "scene" "arrangement_scene";
--> statement-breakpoint

-- Add commonly selected show columns if missing
ALTER TABLE "shows"
  ADD COLUMN IF NOT EXISTS "name" text,
  ADD COLUMN IF NOT EXISTS "length_seconds" integer,
  ADD COLUMN IF NOT EXISTS "graphic_url" text,
  ADD COLUMN IF NOT EXISTS "price" numeric(10,2),
  ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint

-- Backfill name from legacy title if empty
UPDATE "shows" SET "name" = "title" WHERE "name" IS NULL AND "title" IS NOT NULL;
--> statement-breakpoint

-- Ensure arrangements.display_order exists for sorting
ALTER TABLE "arrangements" ADD COLUMN IF NOT EXISTS "display_order" integer DEFAULT 0 NOT NULL;


