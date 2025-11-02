DO $$ BEGIN
 CREATE TYPE "public"."arrangement_scene" AS ENUM('Opener', 'Ballad', 'Closer');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "arrangements" ADD COLUMN IF NOT EXISTS "scene" "arrangement_scene";


