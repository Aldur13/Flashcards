-- ============================================================================
--  Flashcards: databas för konton och molnprogress
--  Kör HELA filen en gång: Supabase → SQL Editor → New query → klistra in → Run.
--  Det går bra att köra den igen, den ändrar inget som redan är rätt.
--
--  Vad den gör:
--   1. Skapar tabellen progress: en rad per konto med all progress som JSON.
--   2. Slår på radnivåsäkerhet (RLS): man kommer bara åt SIN egen rad.
--   3. Tar bort alla rättigheter för anon (alltså för den som inte är inloggad).
--   4. En trigger håller updated_at rätt och hindrer att en rad byter ägare.
--   5. Funktionen delete_my_account() låter en inloggad radera sitt eget konto.
-- ============================================================================

-- 1. Tabellen ---------------------------------------------------------------
create table if not exists public.progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint progress_data_ar_objekt check (jsonb_typeof(data) = 'object'),
  constraint progress_data_storlek   check (pg_column_size(data) < 500000)
);

-- 2. Radnivåsäkerhet ---------------------------------------------------------
alter table public.progress enable row level security;
alter table public.progress force  row level security;

drop policy if exists "progress_las_egen"    on public.progress;
drop policy if exists "progress_skapa_egen"  on public.progress;
drop policy if exists "progress_ändra_egen"  on public.progress;
drop policy if exists "progress_andra_egen"  on public.progress;

create policy "progress_las_egen" on public.progress
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "progress_skapa_egen" on public.progress
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "progress_andra_egen" on public.progress
  for update to authenticated
  using      (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Ingen delete-policy: raden försvinner bara när kontot raderas (on delete cascade).

-- 3. Rättigheter ------------------------------------------------------------
revoke all on public.progress from public;
revoke all on public.progress from anon;
revoke all on public.progress from authenticated;
grant select, insert, update on public.progress to authenticated;

-- 4. Trigger ----------------------------------------------------------------
create or replace function public.progress_fore_skrivning()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.user_id := old.user_id;   -- en rad kan aldrig byta ägare
  end if;
  return new;
end;
$$;

drop trigger if exists progress_fore_skrivning on public.progress;
create trigger progress_fore_skrivning
  before insert or update on public.progress
  for each row execute function public.progress_fore_skrivning();

-- 5. Radera sitt eget konto ---------------------------------------------------
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'inte inloggad' using errcode = '28000';
  end if;
  delete from auth.users where id = uid;   -- progress-raden följer med (cascade)
end;
$$;

revoke all on function public.delete_my_account() from public;
revoke all on function public.delete_my_account() from anon;
grant execute on function public.delete_my_account() to authenticated;
