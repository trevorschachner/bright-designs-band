-- Trim leading/trailing whitespace from titles.
--
-- 31 of 73 arrangement titles and 9 show titles carried stray whitespace as of
-- 2026-08-23. shows.slug is generated from title, exact-match filters compare
-- against it, and ordering treats 'Foo ' and 'Foo' as different values.
--
-- The write path is guarded separately: the zod schemas now .trim() titles, so
-- this is a one-time cleanup rather than a recurring chore.
--
-- Slugs are deliberately NOT regenerated. They are public URLs with inbound
-- links and sitemap entries, and generateSlug already strips whitespace when
-- building them, so existing slugs are unaffected by the untrimmed titles.

UPDATE "arrangements" SET "title" = btrim("title") WHERE "title" <> btrim("title");

UPDATE "shows" SET "title" = btrim("title") WHERE "title" <> btrim("title");
