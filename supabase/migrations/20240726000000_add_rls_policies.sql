-- Create a policy to allow public read access to the 'shows' table
CREATE POLICY "Allow public read access to shows" ON "shows"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

-- Create a policy to allow public read access to the 'tags' table
CREATE POLICY "Allow public read access to tags" ON "tags"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

-- Create a policy to allow public read access to the 'shows_to_tags' table
CREATE POLICY "Allow public read access to shows_to_tags" ON "shows_to_tags"
AS PERMISSIVE FOR SELECT
TO public
USING (true); 