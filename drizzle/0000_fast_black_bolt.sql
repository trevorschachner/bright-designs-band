DO $$ BEGIN
 CREATE TYPE "public"."difficulty" AS ENUM('Beginner', 'Intermediate', 'Advanced');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."file_type" AS ENUM('image', 'audio', 'youtube', 'pdf', 'score', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "arrangements" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"type" text,
	"price" numeric(10, 2),
	"show_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contact_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"service" text NOT NULL,
	"message" text NOT NULL,
	"privacy_agreed" boolean DEFAULT false NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"email_sent" boolean DEFAULT false NOT NULL,
	"email_sent_at" timestamp,
	"email_error" text,
	"status" text DEFAULT 'new' NOT NULL,
	"admin_notes" text,
	"interested_show_id" integer,
	"interested_arrangement_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "files" (
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shows" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"year" text,
	"difficulty" "difficulty",
	"duration" text,
	"description" text,
	"price" numeric(10, 2),
	"thumbnail_url" text,
	"composer" text,
	"song_title" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shows_to_tags" (
	"show_id" integer NOT NULL,
	"tag_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "arrangements" ADD CONSTRAINT "arrangements_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_submissions" ADD CONSTRAINT "contact_submissions_interested_show_id_shows_id_fk" FOREIGN KEY ("interested_show_id") REFERENCES "public"."shows"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_submissions" ADD CONSTRAINT "contact_submissions_interested_arrangement_id_arrangements_id_fk" FOREIGN KEY ("interested_arrangement_id") REFERENCES "public"."arrangements"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "files" ADD CONSTRAINT "files_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "files" ADD CONSTRAINT "files_arrangement_id_arrangements_id_fk" FOREIGN KEY ("arrangement_id") REFERENCES "public"."arrangements"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shows_to_tags" ADD CONSTRAINT "shows_to_tags_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shows_to_tags" ADD CONSTRAINT "shows_to_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
