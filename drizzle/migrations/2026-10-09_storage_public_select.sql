-- migrate: manual
--
-- Storage policies, part 2 of 2: anyone (anon + authenticated) can select,
-- and so list(), the public bucket.
--
-- HELD BACK FROM `npm run db:migrate` (the `-- migrate: manual` line above):
-- it stays pending in `npm run db:migrate:status` until applied by hand.
-- Apply it only AFTER `npx tsx scripts/migrate-private-files.ts --apply` has
-- moved every is_public = false object out of the public bucket; before that,
-- this policy would let anyone list those private objects' keys and fetch
-- them. Then:
--
--   npx tsx scripts/apply-sql-migrations.ts --apply --only 2026-10-09_storage_public_select.sql
--
-- The app does not need this policy (public objects are served from their
-- public URLs without it); it restores listing for public tooling. Skipping
-- it is safe.
--
-- The bucket id is hard-coded: NEXT_PUBLIC_STORAGE_BUCKET must equal
-- 'Bright Designs' (its default), or edit this file. Raises (nothing
-- recorded) if the bucket does not exist.

do $$
begin
  if not exists (select 1 from storage.buckets where id = 'Bright Designs') then
    raise exception 'storage bucket "Bright Designs" does not exist: create the bucket in the Supabase dashboard first; db:migrate aborts until it exists';
  end if;
end
$$;

drop policy if exists "BD public bucket: anyone can read" on storage.objects;
create policy "BD public bucket: anyone can read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'Bright Designs');

-- Rollback (not applied automatically; run by hand if needed):
-- drop policy if exists "BD public bucket: anyone can read" on storage.objects;
