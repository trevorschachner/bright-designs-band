CREATE TYPE "public"."difficulty" AS ENUM('Beginner', 'Intermediate', 'Advanced');--> statement-breakpoint
CREATE TABLE "arrangements" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"type" text,
	"price" numeric(10, 2),
	"show_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shows" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"year" text,
	"difficulty" "difficulty",
	"duration" text,
	"description" text,
	"price" numeric(10, 2),
	"thumbnail_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shows_to_tags" (
	"show_id" integer NOT NULL,
	"tag_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "arrangements" ADD CONSTRAINT "arrangements_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shows_to_tags" ADD CONSTRAINT "shows_to_tags_show_id_shows_id_fk" FOREIGN KEY ("show_id") REFERENCES "public"."shows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shows_to_tags" ADD CONSTRAINT "shows_to_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;