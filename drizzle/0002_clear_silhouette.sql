CREATE TABLE "admin_users" (
	"email" text PRIMARY KEY NOT NULL,
	"role" text NOT NULL,
	"added_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_lower" CHECK (email = lower(email)),
	CONSTRAINT "admin_users_role_check" CHECK (role in ('owner','editor'))
);
--> statement-breakpoint
ALTER TABLE "admin_users" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contact_rate_limits" (
	"ip" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "contact_rate_limits_ip_window_start_pk" PRIMARY KEY("ip","window_start")
);
--> statement-breakpoint
ALTER TABLE "contact_rate_limits" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "arrangements" DROP COLUMN IF EXISTS "copyright_amount_usd";