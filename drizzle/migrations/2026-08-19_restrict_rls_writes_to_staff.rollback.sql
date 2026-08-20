-- Rollback for 2026-08-19_restrict_rls_writes_to_staff.sql
--
-- Restores the previous permissive policies. Only run this if the staff
-- predicate is denying legitimate writes and you need the site working while
-- the cause is investigated — it reopens write access to every authenticated
-- account, so treat it as temporary.

begin;

drop policy if exists "Staff can insert shows" on public.shows;
drop policy if exists "Staff can update shows" on public.shows;
drop policy if exists "Staff can delete shows" on public.shows;
create policy "Allow authenticated users to insert shows" on public.shows for insert to authenticated with check (true);
create policy "Allow authenticated users to update shows" on public.shows for update to authenticated using (true) with check (true);
create policy "Allow authenticated users to delete shows" on public.shows for delete to authenticated using (true);

drop policy if exists "Staff can insert arrangements" on public.arrangements;
drop policy if exists "Staff can update arrangements" on public.arrangements;
drop policy if exists "Staff can delete arrangements" on public.arrangements;
create policy "Allow authenticated users to insert arrangements" on public.arrangements for insert to authenticated with check (true);
create policy "Allow authenticated users to update arrangements" on public.arrangements for update to authenticated using (true) with check (true);
create policy "Allow authenticated users to delete arrangements" on public.arrangements for delete to authenticated using (true);

drop policy if exists "Staff can insert tags" on public.tags;
drop policy if exists "Staff can update tags" on public.tags;
drop policy if exists "Staff can delete tags" on public.tags;
create policy "Allow authenticated users to insert tags" on public.tags for insert to authenticated with check (true);
create policy "Allow authenticated users to update tags" on public.tags for update to authenticated using (true) with check (true);
create policy "Allow authenticated users to delete tags" on public.tags for delete to authenticated using (true);

create policy "Allow authenticated users to insert files" on public.files for insert to authenticated with check (true);
create policy "Allow authenticated users to update files" on public.files for update to authenticated using (true) with check (true);
create policy "Allow authenticated users to delete files" on public.files for delete to authenticated using (true);

drop policy if exists "Staff can manage resources" on public.resources;
create policy "Allow authenticated users to manage resources" on public.resources for all to authenticated using (true) with check (true);

drop policy if exists "Staff can manage show_arrangements" on public.show_arrangements;
create policy "Allow authenticated users to insert show_arrangements" on public.show_arrangements for insert to authenticated with check (true);
create policy "Allow authenticated users to update show_arrangements" on public.show_arrangements for update to authenticated using (true) with check (true);
create policy "Allow authenticated users to delete show_arrangements" on public.show_arrangements for delete to authenticated using (true);

drop policy if exists "Staff can manage shows_to_tags" on public.shows_to_tags;
create policy "Allow authenticated users to insert shows_to_tags" on public.shows_to_tags for insert to authenticated with check (true);
create policy "Allow authenticated users to delete shows_to_tags" on public.shows_to_tags for delete to authenticated using (true);

drop policy if exists "Staff can manage arrangements_to_tags" on public.arrangements_to_tags;
create policy "Allow authenticated users to insert arrangements_to_tags" on public.arrangements_to_tags for insert to authenticated with check (true);
create policy "Allow authenticated users to delete arrangements_to_tags" on public.arrangements_to_tags for delete to authenticated using (true);

commit;
