-- Storage policies (storage.objects), part 1 of 2: admin access to both
-- file buckets. Part 2 (2026-10-09_storage_public_select.sql) opens the
-- public bucket's listing to everyone and is applied by hand later.
--
-- BUCKETS ARE CREATED IN THE SUPABASE DASHBOARD, not here:
--   "Bright Designs"  public bucket   (NEXT_PUBLIC_STORAGE_BUCKET)  isPublic = true files
--   "private"         private bucket  (STORAGE_PRIVATE_BUCKET)      isPublic = false files
-- The bucket ids are hard-coded below. STORAGE_PRIVATE_BUCKET must equal
-- 'private' and NEXT_PUBLIC_STORAGE_BUCKET 'Bright Designs' (their defaults),
-- or this file (and part 2) must be edited to match before it is applied.
--
-- If either bucket does not exist this raises, so `npm run db:migrate`
-- aborts (nothing recorded) until it is created. That is deliberate: the
-- app's private-bucket delete trusts list() (lib/storage.ts), which is only
-- sound once these policies exist.
--
-- Sorts after 2026-10-08_admin_users.sql, which defines is_admin_user().
--
-- Who can do what after this file:
--   admins (is_admin_user())  select / insert / update / delete in both buckets
--   everyone else             nothing in the private bucket (deny by omission:
--                             no other policy here names it)
-- Public-bucket objects are still served from their public URLs (a public
-- bucket bypasses RLS for object GETs); listing it is part 2.
--
-- The app uses the signed-in admin's JWT for Storage (lib/actions/uploads.ts,
-- lib/storage.ts, /api/files/<id>/download): signing an upload needs insert,
-- verifying it and confirming a delete need select, deleting needs delete.
-- Scripts use the service role, which bypasses these.
--
-- These policies are additive. Policies created earlier in the dashboard
-- (unknown here) still apply: a broad one (e.g. any authenticated user on
-- every bucket) would also open the private bucket. Review
-- `select * from pg_policies where schemaname = 'storage'` after applying.

do $$
begin
  if not exists (select 1 from storage.buckets where id = 'Bright Designs') then
    raise exception 'storage bucket "Bright Designs" does not exist: create the bucket in the Supabase dashboard first; db:migrate aborts until it exists';
  end if;
  if not exists (select 1 from storage.buckets where id = 'private') then
    raise exception 'storage bucket "private" does not exist: create the bucket in the Supabase dashboard first; db:migrate aborts until it exists';
  end if;
end
$$;

-- Public bucket: admins write.
drop policy if exists "BD public bucket: admins can read" on storage.objects;
create policy "BD public bucket: admins can read" on storage.objects
  for select to authenticated
  using (bucket_id = 'Bright Designs' and (select public.is_admin_user()));

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

-- Private bucket: admins only.
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

-- Rollback (not applied automatically; run by hand if needed). Drops only the
-- policies this file creates; the buckets and their objects are untouched.
-- drop policy if exists "BD public bucket: admins can read" on storage.objects;
-- drop policy if exists "BD public bucket: admins can insert" on storage.objects;
-- drop policy if exists "BD public bucket: admins can update" on storage.objects;
-- drop policy if exists "BD public bucket: admins can delete" on storage.objects;
-- drop policy if exists "BD private bucket: admins can read" on storage.objects;
-- drop policy if exists "BD private bucket: admins can insert" on storage.objects;
-- drop policy if exists "BD private bucket: admins can update" on storage.objects;
-- drop policy if exists "BD private bucket: admins can delete" on storage.objects;
