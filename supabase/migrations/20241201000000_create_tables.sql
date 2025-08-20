-- Create enums
CREATE TYPE difficulty AS ENUM ('Beginner', 'Intermediate', 'Advanced');
CREATE TYPE file_type AS ENUM ('image', 'audio', 'youtube', 'pdf', 'score', 'other');

-- Create shows table
CREATE TABLE IF NOT EXISTS shows (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  year TEXT,
  difficulty difficulty,
  duration TEXT,
  description TEXT,
  price DECIMAL(10, 2),
  thumbnail_url TEXT,
  composer TEXT,
  song_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create arrangements table  
CREATE TABLE IF NOT EXISTS arrangements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT,
  price DECIMAL(10, 2),
  show_id INTEGER NOT NULL REFERENCES shows(id) ON DELETE CASCADE
);

-- Create files table
CREATE TABLE IF NOT EXISTS files (
  id SERIAL PRIMARY KEY,
  file_name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_type file_type NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  show_id INTEGER REFERENCES shows(id) ON DELETE CASCADE,
  arrangement_id INTEGER REFERENCES arrangements(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT FALSE NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Create shows_to_tags junction table
CREATE TABLE IF NOT EXISTS shows_to_tags (
  show_id INTEGER NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (show_id, tag_id)
);

-- Create contact_submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
  id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  service TEXT NOT NULL,
  message TEXT NOT NULL,
  privacy_agreed BOOLEAN DEFAULT FALSE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  email_sent BOOLEAN DEFAULT FALSE NOT NULL,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  email_error TEXT,
  status TEXT DEFAULT 'new' NOT NULL,
  admin_notes TEXT,
  interested_show_id INTEGER REFERENCES shows(id) ON DELETE SET NULL,
  interested_arrangement_id INTEGER REFERENCES arrangements(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE arrangements ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE shows_to_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access
CREATE POLICY "Allow public read access to shows" ON shows
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow public read access to arrangements" ON arrangements
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow public read access to public files" ON files
  FOR SELECT TO public USING (is_public = true);

CREATE POLICY "Allow public read access to tags" ON tags
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow public read access to shows_to_tags" ON shows_to_tags
  FOR SELECT TO public USING (true);

-- Admin-only access for contact submissions
CREATE POLICY "Only authenticated users can read contact submissions" ON contact_submissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone can insert contact submissions" ON contact_submissions
  FOR INSERT TO public WITH CHECK (true);

-- Admin write access (staff users only)
CREATE POLICY "Staff can manage shows" ON shows
  FOR ALL TO authenticated 
  USING (auth.email() LIKE '%@brightdesigns.band')
  WITH CHECK (auth.email() LIKE '%@brightdesigns.band');

CREATE POLICY "Staff can manage arrangements" ON arrangements
  FOR ALL TO authenticated 
  USING (auth.email() LIKE '%@brightdesigns.band')
  WITH CHECK (auth.email() LIKE '%@brightdesigns.band');

CREATE POLICY "Staff can manage files" ON files
  FOR ALL TO authenticated 
  USING (auth.email() LIKE '%@brightdesigns.band')
  WITH CHECK (auth.email() LIKE '%@brightdesigns.band');

CREATE POLICY "Staff can manage tags" ON tags
  FOR ALL TO authenticated 
  USING (auth.email() LIKE '%@brightdesigns.band')
  WITH CHECK (auth.email() LIKE '%@brightdesigns.band');

CREATE POLICY "Staff can manage shows_to_tags" ON shows_to_tags
  FOR ALL TO authenticated 
  USING (auth.email() LIKE '%@brightdesigns.band')
  WITH CHECK (auth.email() LIKE '%@brightdesigns.band');

CREATE POLICY "Staff can manage contact submissions" ON contact_submissions
  FOR ALL TO authenticated 
  USING (auth.email() LIKE '%@brightdesigns.band')
  WITH CHECK (auth.email() LIKE '%@brightdesigns.band');
