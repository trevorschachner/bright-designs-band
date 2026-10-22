-- Contact submissions: the school, the page the form was sent from and the
-- page before it (for tracing in /admin/inquiries), and the result of the
-- Attio sync (lib/integrations/attio.ts). All nullable; old rows stay as is.
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS school text;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS page_url text;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS referrer_url text;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS attio_record_url text;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS attio_error text;
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS attio_synced_at timestamp;
