-- Named admin allowlist with owner/editor roles; RLS via is_admin_user().
--
-- Until now "staff" meant any address ending in @brightdesigns.band, both in
-- the app (lib/auth/roles.ts) and in every RLS write policy. That made every
-- mailbox on the domain an admin, with no way to grant or revoke one person.
-- Access is now a row in `admin_users`:
--
--   owner  - every content permission plus managing this table (/admin/users)
--   editor - every content permission
--
-- The app reads this table over DATABASE_URL (lib/auth/roles.ts getUserRole),
-- so a change applies on the next request. RLS policies call the two
-- functions below, which are SECURITY DEFINER so they can read `admin_users`
-- regardless of the caller's own RLS on it.
--
-- Emails compare case-insensitively: the column is citext, and the functions
-- compare lower(email::text) = lower(auth.email()) so they never depend on
-- where the citext extension's operators live (Supabase may install it in the
-- `extensions` schema, outside the functions' search_path).
--
-- Every policy below previously used `(select auth.email()) like
-- '%@brightdesigns.band'`. Each keeps its name, table, command and role; only
-- the predicate changes. The first fifteen come from
-- 2026-08-19_restrict_rls_writes_to_staff.sql and 2026-10-04_pieces_rls.sql.
-- The last two ("Staff can manage files", "Admin can view submissions") were
-- created outside this track; their shape here (ALL / SELECT, to
-- authenticated) is taken from the description in the 2026-08-19 migration.
--
-- AFTER THIS RUNS, ONLY ADDRESSES IN admin_users HAVE ADMIN ACCESS. Anyone
-- else on the domain loses it, in the app and through PostgREST.
--
-- Idempotent: safe to run twice. Rollback is at the bottom, commented out
-- (the runner executes the whole file).

begin;

create extension if not exists citext;

create table if not exists public.admin_users (
  email citext primary key,
  role text not null check (role in ('owner', 'editor')),
  added_by citext,
  created_at timestamptz not null default now()
);

insert into public.admin_users (email, role, added_by) values
  ('trevor@brightdesigns.band', 'owner', null),
  ('brighton@brightdesigns.band', 'owner', null),
  ('ryan@brightdesigns.band', 'owner', null)
on conflict do nothing;

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where lower(email::text) = lower(auth.email())
  )
$$;

create or replace function public.is_admin_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where lower(email::text) = lower(auth.email())
      and role = 'owner'
  )
$$;

-- admin_users itself ----------------------------------------------------
-- A signed-in admin may see their own row; owners see and change all rows.
-- The app writes over DATABASE_URL (table owner, bypasses RLS); these only
-- bound what a user's JWT can do through PostgREST.
alter table public.admin_users enable row level security;

drop policy if exists "Admins can read own row; owners read all" on public.admin_users;
create policy "Admins can read own row; owners read all" on public.admin_users
  for select to authenticated
  using (lower(email::text) = lower((select auth.email())) or (select public.is_admin_owner()));

drop policy if exists "Owners can insert admin_users" on public.admin_users;
create policy "Owners can insert admin_users" on public.admin_users
  for insert to authenticated
  with check ((select public.is_admin_owner()));

drop policy if exists "Owners can update admin_users" on public.admin_users;
create policy "Owners can update admin_users" on public.admin_users
  for update to authenticated
  using ((select public.is_admin_owner()))
  with check ((select public.is_admin_owner()));

drop policy if exists "Owners can delete admin_users" on public.admin_users;
create policy "Owners can delete admin_users" on public.admin_users
  for delete to authenticated
  using ((select public.is_admin_owner()));

-- Content policies: suffix rule -> is_admin_user() -----------------------

drop policy if exists "Staff can insert shows" on public.shows;
create policy "Staff can insert shows" on public.shows
  for insert to authenticated
  with check ((select public.is_admin_user()));

drop policy if exists "Staff can update shows" on public.shows;
create policy "Staff can update shows" on public.shows
  for update to authenticated
  using ((select public.is_admin_user()))
  with check ((select public.is_admin_user()));

drop policy if exists "Staff can delete shows" on public.shows;
create policy "Staff can delete shows" on public.shows
  for delete to authenticated
  using ((select public.is_admin_user()));

drop policy if exists "Staff can insert arrangements" on public.arrangements;
create policy "Staff can insert arrangements" on public.arrangements
  for insert to authenticated
  with check ((select public.is_admin_user()));

drop policy if exists "Staff can update arrangements" on public.arrangements;
create policy "Staff can update arrangements" on public.arrangements
  for update to authenticated
  using ((select public.is_admin_user()))
  with check ((select public.is_admin_user()));

drop policy if exists "Staff can delete arrangements" on public.arrangements;
create policy "Staff can delete arrangements" on public.arrangements
  for delete to authenticated
  using ((select public.is_admin_user()));

drop policy if exists "Staff can insert tags" on public.tags;
create policy "Staff can insert tags" on public.tags
  for insert to authenticated
  with check ((select public.is_admin_user()));

drop policy if exists "Staff can update tags" on public.tags;
create policy "Staff can update tags" on public.tags
  for update to authenticated
  using ((select public.is_admin_user()))
  with check ((select public.is_admin_user()));

drop policy if exists "Staff can delete tags" on public.tags;
create policy "Staff can delete tags" on public.tags
  for delete to authenticated
  using ((select public.is_admin_user()));

drop policy if exists "Staff can manage resources" on public.resources;
create policy "Staff can manage resources" on public.resources
  for all to authenticated
  using ((select public.is_admin_user()))
  with check ((select public.is_admin_user()));

drop policy if exists "Staff can manage show_arrangements" on public.show_arrangements;
create policy "Staff can manage show_arrangements" on public.show_arrangements
  for all to authenticated
  using ((select public.is_admin_user()))
  with check ((select public.is_admin_user()));

drop policy if exists "Staff can manage shows_to_tags" on public.shows_to_tags;
create policy "Staff can manage shows_to_tags" on public.shows_to_tags
  for all to authenticated
  using ((select public.is_admin_user()))
  with check ((select public.is_admin_user()));

drop policy if exists "Staff can manage arrangements_to_tags" on public.arrangements_to_tags;
create policy "Staff can manage arrangements_to_tags" on public.arrangements_to_tags
  for all to authenticated
  using ((select public.is_admin_user()))
  with check ((select public.is_admin_user()));

drop policy if exists "Staff can manage pieces" on public.pieces;
create policy "Staff can manage pieces" on public.pieces
  for all to authenticated
  using ((select public.is_admin_user()))
  with check ((select public.is_admin_user()));

drop policy if exists "Staff can manage arrangement_pieces" on public.arrangement_pieces;
create policy "Staff can manage arrangement_pieces" on public.arrangement_pieces
  for all to authenticated
  using ((select public.is_admin_user()))
  with check ((select public.is_admin_user()));

drop policy if exists "Staff can manage files" on public.files;
create policy "Staff can manage files" on public.files
  for all to authenticated
  using ((select public.is_admin_user()))
  with check ((select public.is_admin_user()));

drop policy if exists "Admin can view submissions" on public.contact_submissions;
create policy "Admin can view submissions" on public.contact_submissions
  for select to authenticated
  using ((select public.is_admin_user()));

commit;

-- rollback:
-- Restores the @brightdesigns.band suffix policies, then drops the allowlist.
-- The policies must be restored before the functions are dropped, since they
-- reference them. The citext extension is left installed.
--
-- begin;
--
-- drop policy if exists "Staff can insert shows" on public.shows;
-- create policy "Staff can insert shows" on public.shows
--   for insert to authenticated
--   with check ((select auth.email()) like '%@brightdesigns.band');
--
-- drop policy if exists "Staff can update shows" on public.shows;
-- create policy "Staff can update shows" on public.shows
--   for update to authenticated
--   using ((select auth.email()) like '%@brightdesigns.band')
--   with check ((select auth.email()) like '%@brightdesigns.band');
--
-- drop policy if exists "Staff can delete shows" on public.shows;
-- create policy "Staff can delete shows" on public.shows
--   for delete to authenticated
--   using ((select auth.email()) like '%@brightdesigns.band');
--
-- drop policy if exists "Staff can insert arrangements" on public.arrangements;
-- create policy "Staff can insert arrangements" on public.arrangements
--   for insert to authenticated
--   with check ((select auth.email()) like '%@brightdesigns.band');
--
-- drop policy if exists "Staff can update arrangements" on public.arrangements;
-- create policy "Staff can update arrangements" on public.arrangements
--   for update to authenticated
--   using ((select auth.email()) like '%@brightdesigns.band')
--   with check ((select auth.email()) like '%@brightdesigns.band');
--
-- drop policy if exists "Staff can delete arrangements" on public.arrangements;
-- create policy "Staff can delete arrangements" on public.arrangements
--   for delete to authenticated
--   using ((select auth.email()) like '%@brightdesigns.band');
--
-- drop policy if exists "Staff can insert tags" on public.tags;
-- create policy "Staff can insert tags" on public.tags
--   for insert to authenticated
--   with check ((select auth.email()) like '%@brightdesigns.band');
--
-- drop policy if exists "Staff can update tags" on public.tags;
-- create policy "Staff can update tags" on public.tags
--   for update to authenticated
--   using ((select auth.email()) like '%@brightdesigns.band')
--   with check ((select auth.email()) like '%@brightdesigns.band');
--
-- drop policy if exists "Staff can delete tags" on public.tags;
-- create policy "Staff can delete tags" on public.tags
--   for delete to authenticated
--   using ((select auth.email()) like '%@brightdesigns.band');
--
-- drop policy if exists "Staff can manage resources" on public.resources;
-- create policy "Staff can manage resources" on public.resources
--   for all to authenticated
--   using ((select auth.email()) like '%@brightdesigns.band')
--   with check ((select auth.email()) like '%@brightdesigns.band');
--
-- drop policy if exists "Staff can manage show_arrangements" on public.show_arrangements;
-- create policy "Staff can manage show_arrangements" on public.show_arrangements
--   for all to authenticated
--   using ((select auth.email()) like '%@brightdesigns.band')
--   with check ((select auth.email()) like '%@brightdesigns.band');
--
-- drop policy if exists "Staff can manage shows_to_tags" on public.shows_to_tags;
-- create policy "Staff can manage shows_to_tags" on public.shows_to_tags
--   for all to authenticated
--   using ((select auth.email()) like '%@brightdesigns.band')
--   with check ((select auth.email()) like '%@brightdesigns.band');
--
-- drop policy if exists "Staff can manage arrangements_to_tags" on public.arrangements_to_tags;
-- create policy "Staff can manage arrangements_to_tags" on public.arrangements_to_tags
--   for all to authenticated
--   using ((select auth.email()) like '%@brightdesigns.band')
--   with check ((select auth.email()) like '%@brightdesigns.band');
--
-- drop policy if exists "Staff can manage pieces" on public.pieces;
-- create policy "Staff can manage pieces" on public.pieces
--   for all to authenticated
--   using ((select auth.email()) like '%@brightdesigns.band')
--   with check ((select auth.email()) like '%@brightdesigns.band');
--
-- drop policy if exists "Staff can manage arrangement_pieces" on public.arrangement_pieces;
-- create policy "Staff can manage arrangement_pieces" on public.arrangement_pieces
--   for all to authenticated
--   using ((select auth.email()) like '%@brightdesigns.band')
--   with check ((select auth.email()) like '%@brightdesigns.band');
--
-- drop policy if exists "Staff can manage files" on public.files;
-- create policy "Staff can manage files" on public.files
--   for all to authenticated
--   using ((select auth.email()) like '%@brightdesigns.band')
--   with check ((select auth.email()) like '%@brightdesigns.band');
--
-- drop policy if exists "Admin can view submissions" on public.contact_submissions;
-- create policy "Admin can view submissions" on public.contact_submissions
--   for select to authenticated
--   using ((select auth.email()) like '%@brightdesigns.band');
--
-- drop policy if exists "Admins can read own row; owners read all" on public.admin_users;
-- drop policy if exists "Owners can insert admin_users" on public.admin_users;
-- drop policy if exists "Owners can update admin_users" on public.admin_users;
-- drop policy if exists "Owners can delete admin_users" on public.admin_users;
-- drop function if exists public.is_admin_owner();
-- drop function if exists public.is_admin_user();
-- drop table if exists public.admin_users;
--
-- commit;
