-- Restrict RLS write policies to staff.
--
-- Every content table granted INSERT/UPDATE/DELETE to the `authenticated`
-- role with `USING (true) WITH CHECK (true)` — no further predicate. Because
-- Supabase exposes PostgREST directly and the anon key ships in the client
-- bundle, any account holder could write to these tables with a plain HTTP
-- request, bypassing the application's API routes entirely.
--
-- The predicate below is the one already working correctly on
-- `files."Staff can manage files"` and `contact_submissions."Admin can view
-- submissions"`. It is wrapped in a scalar subquery so Postgres evaluates it
-- once per statement rather than once per row.
--
-- Note on `files`: it already had a correct staff-only ALL policy, but
-- permissive policies are OR'd together, so the unqualified INSERT/UPDATE/
-- DELETE policies beside it nullified that protection.
--
-- Public SELECT policies are deliberately untouched: the site depends on
-- anonymous reads. `contact_submissions` is untouched — its SELECT is already
-- staff-gated, its UPDATE/DELETE are USING (false), and its INSERT is used by
-- the public contact form.
--
-- Writes performed by Drizzle over DATABASE_URL are unaffected: that role owns
-- the tables and so bypasses RLS. This changes only what a user's own JWT can
-- do through PostgREST.

begin;

-- shows -----------------------------------------------------------------
drop policy if exists "Allow authenticated users to insert shows" on public.shows;
drop policy if exists "Allow authenticated users to update shows" on public.shows;
drop policy if exists "Allow authenticated users to delete shows" on public.shows;

create policy "Staff can insert shows" on public.shows
  for insert to authenticated
  with check ((select auth.email()) like '%@brightdesigns.band');
create policy "Staff can update shows" on public.shows
  for update to authenticated
  using ((select auth.email()) like '%@brightdesigns.band')
  with check ((select auth.email()) like '%@brightdesigns.band');
create policy "Staff can delete shows" on public.shows
  for delete to authenticated
  using ((select auth.email()) like '%@brightdesigns.band');

-- arrangements ----------------------------------------------------------
drop policy if exists "Allow authenticated users to insert arrangements" on public.arrangements;
drop policy if exists "Allow authenticated users to update arrangements" on public.arrangements;
drop policy if exists "Allow authenticated users to delete arrangements" on public.arrangements;

create policy "Staff can insert arrangements" on public.arrangements
  for insert to authenticated
  with check ((select auth.email()) like '%@brightdesigns.band');
create policy "Staff can update arrangements" on public.arrangements
  for update to authenticated
  using ((select auth.email()) like '%@brightdesigns.band')
  with check ((select auth.email()) like '%@brightdesigns.band');
create policy "Staff can delete arrangements" on public.arrangements
  for delete to authenticated
  using ((select auth.email()) like '%@brightdesigns.band');

-- tags ------------------------------------------------------------------
drop policy if exists "Allow authenticated users to insert tags" on public.tags;
drop policy if exists "Allow authenticated users to update tags" on public.tags;
drop policy if exists "Allow authenticated users to delete tags" on public.tags;

create policy "Staff can insert tags" on public.tags
  for insert to authenticated
  with check ((select auth.email()) like '%@brightdesigns.band');
create policy "Staff can update tags" on public.tags
  for update to authenticated
  using ((select auth.email()) like '%@brightdesigns.band')
  with check ((select auth.email()) like '%@brightdesigns.band');
create policy "Staff can delete tags" on public.tags
  for delete to authenticated
  using ((select auth.email()) like '%@brightdesigns.band');

-- files -----------------------------------------------------------------
-- "Staff can manage files" (ALL) already carries the correct predicate; these
-- three permissive siblings were what defeated it.
drop policy if exists "Allow authenticated users to insert files" on public.files;
drop policy if exists "Allow authenticated users to update files" on public.files;
drop policy if exists "Allow authenticated users to delete files" on public.files;

-- resources -------------------------------------------------------------
drop policy if exists "Allow authenticated users to manage resources" on public.resources;

create policy "Staff can manage resources" on public.resources
  for all to authenticated
  using ((select auth.email()) like '%@brightdesigns.band')
  with check ((select auth.email()) like '%@brightdesigns.band');

-- show_arrangements -----------------------------------------------------
drop policy if exists "Allow authenticated users to insert show_arrangements" on public.show_arrangements;
drop policy if exists "Allow authenticated users to update show_arrangements" on public.show_arrangements;
drop policy if exists "Allow authenticated users to delete show_arrangements" on public.show_arrangements;

create policy "Staff can manage show_arrangements" on public.show_arrangements
  for all to authenticated
  using ((select auth.email()) like '%@brightdesigns.band')
  with check ((select auth.email()) like '%@brightdesigns.band');

-- shows_to_tags ---------------------------------------------------------
drop policy if exists "Allow authenticated users to insert shows_to_tags" on public.shows_to_tags;
drop policy if exists "Allow authenticated users to delete shows_to_tags" on public.shows_to_tags;

create policy "Staff can manage shows_to_tags" on public.shows_to_tags
  for all to authenticated
  using ((select auth.email()) like '%@brightdesigns.band')
  with check ((select auth.email()) like '%@brightdesigns.band');

-- arrangements_to_tags --------------------------------------------------
drop policy if exists "Allow authenticated users to insert arrangements_to_tags" on public.arrangements_to_tags;
drop policy if exists "Allow authenticated users to delete arrangements_to_tags" on public.arrangements_to_tags;

create policy "Staff can manage arrangements_to_tags" on public.arrangements_to_tags
  for all to authenticated
  using ((select auth.email()) like '%@brightdesigns.band')
  with check ((select auth.email()) like '%@brightdesigns.band');

commit;
