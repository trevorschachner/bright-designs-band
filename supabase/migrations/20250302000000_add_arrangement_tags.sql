-- Create arrangements_to_tags junction table
CREATE TABLE IF NOT EXISTS arrangements_to_tags (
  arrangement_id INTEGER NOT NULL REFERENCES arrangements(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (arrangement_id, tag_id)
);

-- Enable RLS
ALTER TABLE arrangements_to_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for arrangements_to_tags
DROP POLICY IF EXISTS "Allow public read access to arrangements_to_tags" ON arrangements_to_tags;
CREATE POLICY "Allow public read access to arrangements_to_tags" ON arrangements_to_tags
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert arrangements_to_tags" ON arrangements_to_tags;
CREATE POLICY "Allow authenticated users to insert arrangements_to_tags" ON arrangements_to_tags
  AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete arrangements_to_tags" ON arrangements_to_tags;
CREATE POLICY "Allow authenticated users to delete arrangements_to_tags" ON arrangements_to_tags
  AS PERMISSIVE FOR DELETE
  TO authenticated
  USING (true);

-- Insert Mood & Vibe tags
INSERT INTO tags (name) VALUES
  ('Dark'),
  ('Aggressive'),
  ('Suspenseful'),
  ('Ominous'),
  ('Dramatic'),
  ('Playful'),
  ('Whimsical'),
  ('Uplifting'),
  ('Heroic'),
  ('Celebratory'),
  ('Energetic'),
  ('Ethereal'),
  ('Mysterious'),
  ('Haunting'),
  ('Cinematic'),
  ('Dreamy'),
  ('Emotional'),
  ('Romantic'),
  ('Nostalgic'),
  ('Inspirational')
ON CONFLICT (name) DO NOTHING;

