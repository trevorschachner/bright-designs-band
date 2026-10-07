-- Per-IP rate limit for the public contact form.
--
-- The form previously had no effective limit: `checkRateLimit` in
-- lib/email/service.ts was never called, and as in-process memory it would not
-- have survived Netlify's per-request function instances anyway. Combined with
-- the confirmation email sent to whatever address was submitted, that made
-- /api/contact a relay for mail from our domain.
--
-- One row per (ip, window). `window_start` is the submission time truncated to
-- the window (lib/rate-limit.ts), and the route increments `count` with a
-- single INSERT ... ON CONFLICT DO UPDATE ... RETURNING count, so concurrent
-- requests cannot both read a stale count.
--
-- RLS is enabled with no policies: anon and authenticated JWTs can neither
-- read nor write this table through PostgREST. The route writes over
-- DATABASE_URL, whose role owns the table and so bypasses RLS.
--
-- Old windows are never read again. They can be pruned at any time with:
--   delete from public.contact_rate_limits where window_start < now() - interval '1 day';

begin;

create table if not exists public.contact_rate_limits (
  ip text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (ip, window_start)
);

alter table public.contact_rate_limits enable row level security;

commit;

-- rollback:
-- begin;
-- drop table if exists public.contact_rate_limits;
-- commit;
