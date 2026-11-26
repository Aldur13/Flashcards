-- ============================================================================
--  Flashcards v4.6: meritvärdesräknare (betyg sparas per konto)
--  Klistra in i Supabase SQL Editor och kör. Går att köra flera gånger.
--
--   * En rad per konto. Kolumnen grades är ett JSON-objekt, t.ex.
--     {"Matematik":"B","Fysik":"A","Språkval":"C"}.
--   * Row Level Security: du kan bara se och ändra din egen rad.
--   * Raden raderas om kontot raderas.
-- ============================================================================

create table if not exists public.merit_grades (
  user_id    uuid primary key default auth.uid()
             references auth.users (id) on delete cascade,
  grades     jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint merit_grades_objekt check (jsonb_typeof(grades) = 'object'),
  constraint merit_grades_storlek check (length(grades::text) <= 2000)
);

alter table public.merit_grades enable row level security;

drop policy if exists "merit_las" on public.merit_grades;
drop policy if exists "merit_skapa" on public.merit_grades;
drop policy if exists "merit_andra" on public.merit_grades;
drop policy if exists "merit_ta_bort" on public.merit_grades;

create policy "merit_las" on public.merit_grades
  for select to authenticated using (user_id = (select auth.uid()));

create policy "merit_skapa" on public.merit_grades
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "merit_andra" on public.merit_grades
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "merit_ta_bort" on public.merit_grades
  for delete to authenticated using (user_id = (select auth.uid()));

revoke all on public.merit_grades from public, anon, authenticated;
grant select (user_id, grades, updated_at) on public.merit_grades to authenticated;
grant insert (user_id, grades, updated_at) on public.merit_grades to authenticated;
grant update (grades, updated_at) on public.merit_grades to authenticated;
grant delete on public.merit_grades to authenticated;

create or replace function public.merit_grades_fore_skrivning()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists merit_grades_tid on public.merit_grades;
create trigger merit_grades_tid
  before insert or update on public.merit_grades
  for each row execute function public.merit_grades_fore_skrivning();
