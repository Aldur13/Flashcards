-- Flashcards v4.1: anonymiserad offentlig matchhistorik.
-- Kör en gång i Supabase Dashboard -> SQL Editor.
-- Endast inloggade värdar får publicera. Publika läsare får endast se de
-- uttryckligen utvalda, anonymiserade kolumnerna i vyn nedan.

create table if not exists public.match_history (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  format text not null
    check (format in ('solo', '2v2', '4v4', '8v8', '12v12')),
  tournament boolean not null default false,
  players jsonb not null default '[]'::jsonb,
  rounds jsonb not null default '[]'::jsonb,
  constraint match_history_players_array check (
    case when jsonb_typeof(players) = 'array'
      then jsonb_array_length(players) <= 30 else false end
  ),
  constraint match_history_rounds_array check (
    case when jsonb_typeof(rounds) = 'array'
      then jsonb_array_length(rounds) <= 20 else false end
  ),
  constraint match_history_size_limit check (
    pg_column_size(players) + pg_column_size(rounds) <= 700000
  )
);

create index if not exists match_history_created_at_idx
  on public.match_history (created_at desc);

alter table public.match_history enable row level security;

-- Remove any older policies with these names before recreating the least-
-- privilege insert policy. No direct table SELECT is granted to the public.
drop policy if exists "authenticated hosts may publish match history"
  on public.match_history;
create policy "authenticated hosts may publish match history"
  on public.match_history
  for insert
  to authenticated
  with check (owner_id = auth.uid());

revoke all on table public.match_history from anon, authenticated;
grant insert (format, tournament, players, rounds)
  on table public.match_history to authenticated;

-- The view intentionally omits owner_id and all account identifiers.
-- The app writes only anonymised participant labels and redacted answer text.
create or replace view public.public_match_history
  with (security_barrier = true)
as
  select id, created_at, format, tournament, players, rounds
  from public.match_history;

grant select on public.public_match_history to anon, authenticated;

comment on table public.match_history is
  'Flashcards v4.1 match history; insert requires an authenticated host.';
comment on view public.public_match_history is
  'Public, anonymised match history. Does not expose owner_id.';
