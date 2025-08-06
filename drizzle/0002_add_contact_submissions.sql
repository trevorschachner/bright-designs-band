-- Migration: Add contact form submissions table
-- Created: 2024-12-XX

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
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for common queries (only if they don't exist)
CREATE INDEX IF NOT EXISTS "contact_submissions_email_idx" ON "contact_submissions" ("email");
CREATE INDEX IF NOT EXISTS "contact_submissions_status_idx" ON "contact_submissions" ("status");
CREATE INDEX IF NOT EXISTS "contact_submissions_created_at_idx" ON "contact_submissions" ("created_at");
CREATE INDEX IF NOT EXISTS "contact_submissions_service_idx" ON "contact_submissions" ("service");

-- Add comments for documentation
COMMENT ON TABLE "contact_submissions" IS 'Stores contact form submissions with email delivery tracking';
COMMENT ON COLUMN "contact_submissions"."service" IS 'Type of service requested: existing-show, choreography, custom-arranging, show-promotion, drill-design, other';
COMMENT ON COLUMN "contact_submissions"."status" IS 'Processing status: new, contacted, resolved, spam';
COMMENT ON COLUMN "contact_submissions"."email_sent" IS 'Whether notification emails were successfully sent';
COMMENT ON COLUMN "contact_submissions"."privacy_agreed" IS 'User consent to privacy policy';