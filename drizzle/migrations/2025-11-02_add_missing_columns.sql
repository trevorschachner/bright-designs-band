-- Add columns required by current Drizzle schema but missing in DB

-- Ensure shows.updated_at exists
ALTER TABLE shows
  ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now() NOT NULL;

-- Ensure arrangements.display_order exists
ALTER TABLE arrangements
  ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0 NOT NULL;


