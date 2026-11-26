-- ============================================================================
--  Flashcards v4.7: prognos (provresultat sparas per konto)
--  Klistra in i Supabase SQL Editor och kör, EFTER v4.6-merit.sql.
--  Går att köra flera gånger. Lägger bara till en kolumn, rör inga betyg.
--
--   * tests är ett JSON-objekt, t.ex.
--     {"Fysik":[{"poang":8,"max":10,"vikt":1,"datum":"2026-10-01"}]}
--   * Samma regler som förut: du ser och ändrar bara din egen rad.
--   * Utan den här filen fungerar Prognos ändå, men proven sparas bara lokalt.
-- ============================================================================

alter table public.merit_grades
  add column if not exists tests jsonb not null default '{}'::jsonb;

alter table public.merit_grades drop constraint if exists merit_grades_tests_objekt;
alter table public.merit_grades drop constraint if exists merit_grades_tests_storlek;

alter table public.merit_grades
  add constraint merit_grades_tests_objekt check (jsonb_typeof(tests) = 'object');
alter table public.merit_grades
  add constraint merit_grades_tests_storlek check (length(tests::text) <= 30000);

grant select (tests) on public.merit_grades to authenticated;
grant insert (tests) on public.merit_grades to authenticated;
grant update (tests) on public.merit_grades to authenticated;
