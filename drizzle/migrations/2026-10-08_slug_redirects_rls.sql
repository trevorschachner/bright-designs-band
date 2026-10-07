-- Row-level security for public.slug_redirects (old show slug -> show id).
--
-- The table comes from drizzle/0003_slug_redirects_updated_at.sql, which
-- `npm run db:migrate` applies before this track. Run on its own before that,
-- this fails (table does not exist) and is not recorded, which is the point.
-- Sorts after 2026-10-08_admin_users.sql, which defines is_admin_user().
--
-- Reads are public: an old slug is a URL that was public, and the show page
-- resolves it. Writes are admin-only through a user's JWT. The app itself
-- writes over DATABASE_URL (table owner, bypasses RLS) from
-- lib/actions/shows.ts; these policies only bound what PostgREST allows.

alter table public.slug_redirects enable row level security;

drop policy if exists "Anyone can read slug_redirects" on public.slug_redirects;
create policy "Anyone can read slug_redirects" on public.slug_redirects
  for select to anon, authenticated
  using (true);

drop policy if exists "Staff can insert slug_redirects" on public.slug_redirects;
create policy "Staff can insert slug_redirects" on public.slug_redirects
  for insert to authenticated
  with check ((select public.is_admin_user()));

drop policy if exists "Staff can update slug_redirects" on public.slug_redirects;
create policy "Staff can update slug_redirects" on public.slug_redirects
  for update to authenticated
  using ((select public.is_admin_user()))
  with check ((select public.is_admin_user()));

drop policy if exists "Staff can delete slug_redirects" on public.slug_redirects;
create policy "Staff can delete slug_redirects" on public.slug_redirects
  for delete to authenticated
  using ((select public.is_admin_user()));

-- Rollback (not applied automatically; run by hand if needed). Drops the
-- policies only; the table itself belongs to drizzle/0003.
-- drop policy if exists "Anyone can read slug_redirects" on public.slug_redirects;
-- drop policy if exists "Staff can insert slug_redirects" on public.slug_redirects;
-- drop policy if exists "Staff can update slug_redirects" on public.slug_redirects;
-- drop policy if exists "Staff can delete slug_redirects" on public.slug_redirects;
-- To remove the table as well (loses every recorded old slug):
-- drop table if exists public.slug_redirects;
