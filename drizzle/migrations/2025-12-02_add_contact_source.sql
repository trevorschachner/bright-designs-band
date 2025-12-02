-- Add source tracking for contact submissions
ALTER TABLE contact_submissions
  ADD COLUMN IF NOT EXISTS source text;

UPDATE contact_submissions
SET source = COALESCE(source, 'contact');

ALTER TABLE contact_submissions
  ALTER COLUMN source SET NOT NULL,
  ALTER COLUMN source SET DEFAULT 'contact';

