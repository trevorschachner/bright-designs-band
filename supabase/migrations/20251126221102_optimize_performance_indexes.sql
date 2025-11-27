-- Add indexes for Shows table
CREATE INDEX IF NOT EXISTS idx_shows_featured ON shows(featured);
CREATE INDEX IF NOT EXISTS idx_shows_display_order ON shows(display_order);
CREATE INDEX IF NOT EXISTS idx_shows_created_at ON shows(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shows_slug ON shows(slug);

-- Add indexes for Arrangements table
CREATE INDEX IF NOT EXISTS idx_arrangements_title ON arrangements(title);
CREATE INDEX IF NOT EXISTS idx_arrangements_composer ON arrangements(composer);
CREATE INDEX IF NOT EXISTS idx_arrangements_created_at ON arrangements(created_at DESC);

-- Add indexes for Resources table
CREATE INDEX IF NOT EXISTS idx_resources_is_active ON resources(is_active);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources(created_at DESC);

-- Add indexes for Files table (filtering public files)
CREATE INDEX IF NOT EXISTS idx_files_is_public ON files(is_public);
CREATE INDEX IF NOT EXISTS idx_files_file_type ON files(file_type);

