-- Add file_type enum
CREATE TYPE "public"."file_type" AS ENUM('image', 'audio', 'youtube', 'pdf', 'score', 'other');

-- Create files table
CREATE TABLE "files" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_name" text NOT NULL,
	"original_name" text NOT NULL,
	"file_type" "file_type" NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" text NOT NULL,
	"url" text NOT NULL,
	"storage_path" text NOT NULL,
	"show_id" integer,
	"arrangement_id" integer,
	"is_public" boolean DEFAULT false NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints
ALTER TABLE "files" ADD CONSTRAINT "files_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "files" ADD CONSTRAINT "files_arrangement_id_arrangements_id_fk" FOREIGN KEY ("arrangement_id") REFERENCES "public"."arrangements"("id") ON DELETE cascade ON UPDATE no action;

-- Add indexes for better performance
CREATE INDEX "files_show_id_idx" ON "files" ("show_id");
CREATE INDEX "files_arrangement_id_idx" ON "files" ("arrangement_id");
CREATE INDEX "files_file_type_idx" ON "files" ("file_type");
CREATE INDEX "files_is_public_idx" ON "files" ("is_public"); 