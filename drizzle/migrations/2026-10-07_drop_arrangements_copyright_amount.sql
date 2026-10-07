-- Drop the vestigial arrangements.copyright_amount_usd column.
--
-- Copyright cost is an internal licensing figure. Since issue #51 the business
-- records it per piece (pieces.copyright_amount_usd, staff-only), so the
-- arrangements copy is redundant. It was also readable by anyone: the public
-- arrangement endpoints returned it, and the anon key can SELECT the column
-- through PostgREST under the table's public SELECT policy.
--
-- Data check before writing this (2026-10): exactly 1 arrangement row had a
-- non-null value. Confirm that figure is already on the matching piece before
-- applying:
--   select id, title, copyright_amount_usd from arrangements
--   where copyright_amount_usd is not null;
--
-- The application no longer reads or writes this column; deploy that code
-- before or together with applying this migration.

begin;

alter table public.arrangements drop column if exists copyright_amount_usd;

commit;

-- rollback (restores the column, not its data):
-- begin;
-- alter table public.arrangements add column if not exists copyright_amount_usd numeric(10, 2);
-- commit;
