-- Delete the placeholder tag named 'tag' (id 1), only if nothing uses it (#51).
--
-- Checked against production on 2026-10-04 (read-only): 0 rows in
-- shows_to_tags and 0 in arrangements_to_tags reference it. The FKs from both
-- join tables cascade, so an unconditional delete would silently untag
-- anything that picked it up in the meantime. The NOT EXISTS guards make this
-- a no-op in that case instead.

delete from public.tags t
where t.id = 1
  and t.name = 'tag'
  and not exists (select 1 from public.shows_to_tags s where s.tag_id = t.id)
  and not exists (select 1 from public.arrangements_to_tags a where a.tag_id = t.id);
