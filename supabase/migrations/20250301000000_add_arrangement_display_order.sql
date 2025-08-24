-- Add display_order to arrangements for show sequencing
alter table if exists public.arrangements
  add column if not exists display_order integer not null default 0;

-- Backfill existing rows with sequential order within each show
with ranked as (
  select id, show_id, row_number() over (partition by show_id order by id) as rn
  from public.arrangements
)
update public.arrangements a
set display_order = r.rn
from ranked r
where a.id = r.id;

-- Helpful index for ordering
create index if not exists arrangements_show_id_display_order_idx
  on public.arrangements (show_id, display_order);

