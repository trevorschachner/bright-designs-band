-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  file_url TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  requires_contact_form BOOLEAN DEFAULT TRUE NOT NULL,
  download_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Policies
-- Public read access
DROP POLICY IF EXISTS "Allow public read access to active resources" ON resources;
CREATE POLICY "Allow public read access to active resources" ON resources
  FOR SELECT TO public USING (is_active = true);

-- Admin write access
DROP POLICY IF EXISTS "Allow authenticated users to manage resources" ON resources;
CREATE POLICY "Allow authenticated users to manage resources" ON resources
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

