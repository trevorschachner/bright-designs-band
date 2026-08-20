CREATE TYPE "public"."arrangement_scene" AS ENUM('Opener', 'Ballad', 'Closer');--> statement-breakpoint
CREATE TYPE "public"."ensemble_size" AS ENUM('small', 'medium', 'large');--> statement-breakpoint
CREATE TYPE "public"."file_type" AS ENUM('image', 'audio', 'youtube', 'pdf', 'score', 'other');--> statement-breakpoint
CREATE TYPE "public"."grade_band" AS ENUM('1_2', '3_4', '5_plus');--> statement-breakpoint
CREATE TYPE "public"."difficulty" AS ENUM('Beginner', 'Intermediate', 'Advanced');--> statement-breakpoint
CREATE TABLE "arrangements" (
	"id" serial PRIMARY KEY NOT NULL,
	"composer" text,
	"arranger" text,
	"grade" "grade_band",
	"year" smallint,
	"duration_seconds" integer,
	"description" text,
	"percussion_arranger" text,
	"copyright_amount_usd" numeric(10, 2),
	"ensemble_size" "ensemble_size",
	"scene" "arrangement_scene",
	"youtube_url" text,
	"commissioned" text,
	"sample_score_url" text,
	"title" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "arrangements_to_tags" (
	"arrangement_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "arrangements_to_tags_arrangement_id_tag_id_pk" PRIMARY KEY("arrangement_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "contact_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"service" text NOT NULL,
	"message" text NOT NULL,
	"source" text DEFAULT 'contact' NOT NULL,
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
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"file_url" text,
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"requires_contact_form" boolean DEFAULT true NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "resources_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "show_arrangements" (
	"show_id" integer NOT NULL,
	"arrangement_id" integer NOT NULL,
	"order_index" smallint NOT NULL,
	CONSTRAINT "show_arrangements_show_id_arrangement_id_pk" PRIMARY KEY("show_id","arrangement_id")
);
--> statement-breakpoint
CREATE TABLE "shows" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"length_seconds" integer,
	"difficulty" "difficulty",
	"graphic_url" text,
	"youtube_url" text,
	"year" smallint,
	"featured" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"commissioned" text,
	"program_coordinator" text,
	"percussion_arranger" text,
	"sound_designer" text,
	"wind_arranger" text,
	"drill_writer" text,
	"duration" text,
	"price" numeric(10, 2),
	"thumbnail_url" text,
	"video_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shows_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "shows_to_tags" (
	"show_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "shows_to_tags_show_id_tag_id_pk" PRIMARY KEY("show_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "arrangements_to_tags" ADD CONSTRAINT "arrangements_to_tags_arrangement_id_arrangements_id_fk" FOREIGN KEY ("arrangement_id") REFERENCES "public"."arrangements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "arrangements_to_tags" ADD CONSTRAINT "arrangements_to_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_submissions" ADD CONSTRAINT "contact_submissions_interested_show_id_shows_id_fk" FOREIGN KEY ("interested_show_id") REFERENCES "public"."shows"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_submissions" ADD CONSTRAINT "contact_submissions_interested_arrangement_id_arrangements_id_fk" FOREIGN KEY ("interested_arrangement_id") REFERENCES "public"."arrangements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_arrangement_id_arrangements_id_fk" FOREIGN KEY ("arrangement_id") REFERENCES "public"."arrangements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "show_arrangements" ADD CONSTRAINT "show_arrangements_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "show_arrangements" ADD CONSTRAINT "show_arrangements_arrangement_id_arrangements_id_fk" FOREIGN KEY ("arrangement_id") REFERENCES "public"."arrangements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shows_to_tags" ADD CONSTRAINT "shows_to_tags_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shows_to_tags" ADD CONSTRAINT "shows_to_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "files_show_id_idx" ON "files" USING btree ("show_id");--> statement-breakpoint
CREATE INDEX "files_arrangement_id_idx" ON "files" USING btree ("arrangement_id");--> statement-breakpoint
CREATE INDEX "show_arrangements_show_idx" ON "show_arrangements" USING btree ("show_id");--> statement-breakpoint
CREATE INDEX "show_arrangements_arr_idx" ON "show_arrangements" USING btree ("arrangement_id");