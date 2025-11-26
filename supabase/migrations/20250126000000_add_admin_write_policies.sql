-- Add RLS policies for authenticated users to manage shows, arrangements, files, and tags
-- 
-- SAFETY NOTE: This migration only modifies Row Level Security (RLS) policies.
-- It does NOT delete any data from shows, arrangements, files, or any other table.
-- DROP POLICY only removes permission rules, not data.
-- 
-- Drop existing policies if they exist and recreate them

DROP POLICY IF EXISTS "Allow public read access to show_arrangements" ON "show_arrangements";
DROP POLICY IF EXISTS "Allow public read access to arrangements" ON "arrangements";
DROP POLICY IF EXISTS "Allow authenticated users to read all files" ON "files";
DROP POLICY IF EXISTS "Allow public read access to public files" ON "files";

-- Shows: Allow authenticated users to INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS "Allow authenticated users to insert shows" ON "shows";
CREATE POLICY "Allow authenticated users to insert shows" ON "shows"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update shows" ON "shows";
CREATE POLICY "Allow authenticated users to update shows" ON "shows"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete shows" ON "shows";
CREATE POLICY "Allow authenticated users to delete shows" ON "shows"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (true);

-- Arrangements: Allow authenticated users to INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS "Allow authenticated users to insert arrangements" ON "arrangements";
CREATE POLICY "Allow authenticated users to insert arrangements" ON "arrangements"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update arrangements" ON "arrangements";
CREATE POLICY "Allow authenticated users to update arrangements" ON "arrangements"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete arrangements" ON "arrangements";
CREATE POLICY "Allow authenticated users to delete arrangements" ON "arrangements"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (true);

-- Show Arrangements: Allow authenticated users to INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS "Allow authenticated users to insert show_arrangements" ON "show_arrangements";
CREATE POLICY "Allow authenticated users to insert show_arrangements" ON "show_arrangements"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update show_arrangements" ON "show_arrangements";
CREATE POLICY "Allow authenticated users to update show_arrangements" ON "show_arrangements"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete show_arrangements" ON "show_arrangements";
CREATE POLICY "Allow authenticated users to delete show_arrangements" ON "show_arrangements"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (true);

-- Shows to Tags: Allow authenticated users to INSERT, DELETE
DROP POLICY IF EXISTS "Allow authenticated users to insert shows_to_tags" ON "shows_to_tags";
CREATE POLICY "Allow authenticated users to insert shows_to_tags" ON "shows_to_tags"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete shows_to_tags" ON "shows_to_tags";
CREATE POLICY "Allow authenticated users to delete shows_to_tags" ON "shows_to_tags"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (true);

-- Tags: Allow authenticated users to INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS "Allow authenticated users to insert tags" ON "tags";
CREATE POLICY "Allow authenticated users to insert tags" ON "tags"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update tags" ON "tags";
CREATE POLICY "Allow authenticated users to update tags" ON "tags"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete tags" ON "tags";
CREATE POLICY "Allow authenticated users to delete tags" ON "tags"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (true);

-- Files: Allow authenticated users to INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS "Allow authenticated users to insert files" ON "files";
CREATE POLICY "Allow authenticated users to insert files" ON "files"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update files" ON "files";
CREATE POLICY "Allow authenticated users to update files" ON "files"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete files" ON "files";
CREATE POLICY "Allow authenticated users to delete files" ON "files"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (true);

-- Re-create read policies
CREATE POLICY "Allow public read access to public files" ON "files"
AS PERMISSIVE FOR SELECT
TO public
USING (is_public = true);

CREATE POLICY "Allow authenticated users to read all files" ON "files"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow public read access to arrangements" ON "arrangements"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow public read access to show_arrangements" ON "show_arrangements"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

