ALTER TABLE "shows" ADD COLUMN "video_url" text;--> statement-breakpoint
ALTER TABLE "shows" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;