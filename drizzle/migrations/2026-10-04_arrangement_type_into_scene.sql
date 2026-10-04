-- Fold the legacy arrangements.type column into scene, then drop it (#51).
--
-- Replaces 2025-11-11_remove_arrangement_type.sql, which was never applied
-- (absent from public.__sql_migrations as of 2026-10-04) and dropped the
-- column without carrying anything across.
--
-- `type` exists in production but not in lib/database/schema.ts, so the
-- application cannot read it. It duplicates `scene`. Checked against
-- production on 2026-10-04 (read-only):
--
--   id | type     | scene
--   14 | 'opener' | 'Opener'
--   15 | 'ballad' | 'Ballad'
--   16 | 'Closer' | 'Closer'
--
-- Every row with `type` set already has a matching `scene`, so the update below
-- is expected to touch 0 rows. It is here so the drop can never lose a value:
-- a row with `type` set and `scene` null gets the normalised value
-- ('opener' -> 'Opener'). Anything that does not map cleanly, or that
-- disagrees with an existing `scene`, stops the migration for a human to look.
--
-- Not addressed here: arrangements 51, 53 and 58 have no scene and no type
-- either, so there is nothing to copy for them. That is issue #49.
--
-- Guarded on the column existing so a database that already dropped it
-- (e.g. by applying the old file by hand) runs this as a no-op.

do $$
declare
  has_type boolean;
  bad integer;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'arrangements' and column_name = 'type'
  ) into has_type;

  if not has_type then
    raise notice 'arrangements.type already gone; nothing to do';
    return;
  end if;

  execute $q$
    select count(*) from public.arrangements
    where type is not null
      and (lower(btrim(type)) not in ('opener', 'ballad', 'closer')
           or (scene is not null and scene::text <> initcap(lower(btrim(type)))))
  $q$ into bad;

  if bad > 0 then
    raise exception 'arrangements.type: % row(s) do not map to scene or disagree with it; resolve by hand', bad;
  end if;

  execute $q$
    update public.arrangements
    set scene = initcap(lower(btrim(type)))::public.arrangement_scene
    where scene is null and type is not null
  $q$;

  alter table public.arrangements drop column type;
end
$$;
