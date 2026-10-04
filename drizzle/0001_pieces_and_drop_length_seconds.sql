CREATE TABLE "arrangement_pieces" (
	"arrangement_id" integer NOT NULL,
	"piece_id" integer NOT NULL,
	"order_index" smallint NOT NULL,
	CONSTRAINT "arrangement_pieces_arrangement_id_piece_id_pk" PRIMARY KEY("arrangement_id","piece_id")
);
--> statement-breakpoint
CREATE TABLE "pieces" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"composer" text,
	"copyright_amount_usd" numeric(10, 2),
	"licensing_status" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "arrangement_pieces" ADD CONSTRAINT "arrangement_pieces_arrangement_id_arrangements_id_fk" FOREIGN KEY ("arrangement_id") REFERENCES "public"."arrangements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "arrangement_pieces" ADD CONSTRAINT "arrangement_pieces_piece_id_pieces_id_fk" FOREIGN KEY ("piece_id") REFERENCES "public"."pieces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "arrangement_pieces_arr_idx" ON "arrangement_pieces" USING btree ("arrangement_id");--> statement-breakpoint
CREATE INDEX "arrangement_pieces_piece_idx" ON "arrangement_pieces" USING btree ("piece_id");--> statement-breakpoint
ALTER TABLE "shows" DROP COLUMN "length_seconds";