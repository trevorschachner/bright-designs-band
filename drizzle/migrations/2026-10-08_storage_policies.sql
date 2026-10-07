-- Storage policies (storage.objects) for the two file buckets.
--
-- BUCKETS ARE CREATED IN THE SUPABASE DASHBOARD, not here:
--   "Bright Designs"  public bucket  (NEXT_PUBLIC_STORAGE_BUCKET)  isPublic = true files
--   "private"         private bucket (STORAGE_PRIVATE_BUCKET)      isPublic = false files
-- The names below are the defaults. If either env var names another bucket,
-- edit the bucket ids in this file before applying it.
--
-- Each bucket's policies are created only if that bucket exists, so this is
-- safe to apply before Trevor creates "private": that section does nothing
-- and the file can be re-run (every policy is drop-if-exists + create) once
-- the bucket exists. Re-running after creating the bucket requires removing
-- this file's row from public.__sql_migrations (or applying the private
-- section by hand), because the runner records a file once.
--
-- Sorts after 2026-10-08_admin_users.sql, which defines is_admin_user().
--
-- Who can do what:
--   admins (is_admin_user())  select / insert / update / delete in both buckets
--   anon + authenticated      select in the public bucket only
--   everyone else             nothing in the private bucket
--
-- The app uses the signed-in admin's JWT for Storage (lib/actions/uploads.ts,
-- lib/storage.ts, /api/files/<id>/download): creating a signed upload URL
-- needs insert, verifying the object needs select, deleting needs delete
-- (and select, for the confirmation). Scripts use the service role, which
-- bypasses these.
--
-- These policies are additive. Policies created earlier in the dashboard
-- (unknown here) still apply: a broad one (e.g. any authenticated user on
-- every bucket) would also open the private bucket. Review
-- `select * from pg_policies where schemaname = 'storage'` after applying.

do $$
begin
  if exists (select 1 from storage.buckets where id = 'Bright Designs') then
    drop policy if exists "BD public bucket: anyone can read" on storage.objects;
    create policy "BD public bucket: anyone can read" on storage.objects
      for select to anon, authenticated
      using (bucket_id = 'Bright Designs');

    drop policy if exists "BD public bucket: admins can insert" on storage.objects;
    create policy "BD public bucket: admins can insert" on storage.objects
      for insert to authenticated
      with check (bucket_id = 'Bright Designs' and (select public.is_admin_user()));

    drop policy if exists "BD public bucket: admins can update" on storage.objects;
    create policy "BD public bucket: admins can update" on storage.objects
      for update to authenticated
      using (bucket_id = 'Bright Designs' and (select public.is_admin_user()))
      with check (bucket_id = 'Bright Designs' and (select public.is_admin_user()));

    drop policy if exists "BD public bucket: admins can delete" on storage.objects;
    create policy "BD public bucket: admins can delete" on storage.objects
      for delete to authenticated
      using (bucket_id = 'Bright Designs' and (select public.is_admin_user()));
  else
    raise notice 'storage bucket "Bright Designs" does not exist; public bucket policies skipped';
  end if;

  if exists (select 1 from storage.buckets where id = 'private') then
    drop policy if exists "BD private bucket: admins can read" on storage.objects;
    create policy "BD private bucket: admins can read" on storage.objects
      for select to authenticated
      using (bucket_id = 'private' and (select public.is_admin_user()));

    drop policy if exists "BD private bucket: admins can insert" on storage.objects;
    create policy "BD private bucket: admins can insert" on storage.objects
      for insert to authenticated
      with check (bucket_id = 'private' and (select public.is_admin_user()));

    drop policy if exists "BD private bucket: admins can update" on storage.objects;
    create policy "BD private bucket: admins can update" on storage.objects
      for update to authenticated
      using (bucket_id = 'private' and (select public.is_admin_user()))
      with check (bucket_id = 'private' and (select public.is_admin_user()));

    drop policy if exists "BD private bucket: admins can delete" on storage.objects;
    create policy "BD private bucket: admins can delete" on storage.objects
      for delete to authenticated
      using (bucket_id = 'private' and (select public.is_admin_user()));
  else
    raise notice 'storage bucket "private" does not exist; private bucket policies skipped (create it in the dashboard, then re-apply)';
  end if;
end
$$;

-- Rollback (not applied automatically; run by hand if needed). Drops only the
-- policies this file creates; the buckets and their objects are untouched.
-- drop policy if exists "BD public bucket: anyone can read" on storage.objects;
-- drop policy if exists "BD public bucket: admins can insert" on storage.objects;
-- drop policy if exists "BD public bucket: admins can update" on storage.objects;
-- drop policy if exists "BD public bucket: admins can delete" on storage.objects;
-- drop policy if exists "BD private bucket: admins can read" on storage.objects;
-- drop policy if exists "BD private bucket: admins can insert" on storage.objects;
-- drop policy if exists "BD private bucket: admins can update" on storage.objects;
-- drop policy if exists "BD private bucket: admins can delete" on storage.objects;
