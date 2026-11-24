-- Encrypted API-key vault. Only the Edge Function's service role can access this table.
-- Never add client-facing policies or grant table access to anon/authenticated.
create table if not exists public.api_key_vault (
  user_id uuid primary key references auth.users(id) on delete cascade,
  encrypted_payload jsonb not null,
  updated_at timestamptz not null default now(),
  constraint api_key_vault_payload_object check (jsonb_typeof(encrypted_payload) = 'object'),
  constraint api_key_vault_payload_size check (pg_column_size(encrypted_payload) < 100000)
);

alter table public.api_key_vault enable row level security;
alter table public.api_key_vault force row level security;
revoke all on public.api_key_vault from public, anon, authenticated;
grant all on public.api_key_vault to service_role;

create or replace function public.api_key_vault_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists api_key_vault_touch on public.api_key_vault;
create trigger api_key_vault_touch
before update on public.api_key_vault
for each row execute function public.api_key_vault_touch_updated_at();
