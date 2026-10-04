-- Row-level security for the pieces tables (#51).
--
-- The tables themselves come from drizzle/0001_pieces_and_drop_length_seconds.sql,
-- which `npm run db:migrate` applies before this track. Run on its own before
-- that, this fails (table does not exist) and is not recorded, which is the
-- point: it must not be marked applied without the policies existing.
--
-- Supabase exposes the public schema through PostgREST and the anon key ships
-- in the client bundle, so a new table without RLS is writable by anyone.
-- Same predicate as 2026-08-19_restrict_rls_writes_to_staff.sql.
--
-- Reads are staff-only too, unlike the other content tables: pieces carry
-- copyright cost and licensing status, which are internal. The site and the
-- admin read through Drizzle over DATABASE_URL, which owns the tables and
-- bypasses RLS, so this does not affect them. If the public site later lists
-- source pieces through the anon client, add a SELECT policy then.

alter table public.pieces enable row level security;
alter table public.arrangement_pieces enable row level security;

drop policy if exists "Staff can manage pieces" on public.pieces;
create policy "Staff can manage pieces" on public.pieces
  for all to authenticated
  using ((select auth.email()) like '%@brightdesigns.band')
  with check ((select auth.email()) like '%@brightdesigns.band');

drop policy if exists "Staff can manage arrangement_pieces" on public.arrangement_pieces;
create policy "Staff can manage arrangement_pieces" on public.arrangement_pieces
  for all to authenticated
  using ((select auth.email()) like '%@brightdesigns.band')
  with check ((select auth.email()) like '%@brightdesigns.band');
