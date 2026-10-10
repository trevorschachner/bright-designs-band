-- Program notes (long-form, markdown-lite: paragraphs and "- " bullets), the
-- band size a show suits, and what the package includes. Read by the public
-- show page, the admin editor, the CSV export and llms-full.txt.
ALTER TABLE shows ADD COLUMN IF NOT EXISTS program_notes text;
ALTER TABLE shows ADD COLUMN IF NOT EXISTS ensemble_size ensemble_size;
ALTER TABLE shows ADD COLUMN IF NOT EXISTS includes text;
