-- supabase/migrations/20260418000000_initial_schema.sql
-- Padelboard v1 — initial schema: profiles, matches, match_events.

-- ── profiles ────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null,
  role text not null check (role in ('player','club','organizer','federation')),
  created_at timestamptz default now()
);

-- ── matches ─────────────────────────────────────────────────
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  short_code text unique not null,
  owner_id uuid references public.profiles(id),
  draft_token text,
  status text not null default 'draft' check (status in ('draft','published','finished','abandoned')),
  config jsonb not null default '{}'::jsonb,
  state jsonb not null default '{}'::jsonb,
  teams jsonb not null default '{}'::jsonb,
  overlay jsonb not null default '{}'::jsonb,
  tournament_label text,
  published_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists matches_owner_created_idx on public.matches (owner_id, created_at desc);
create index if not exists matches_short_code_idx on public.matches (short_code);
create index if not exists matches_status_draft_idx on public.matches (status, created_at) where status = 'draft';

-- Enable realtime on the matches table so the overlay can subscribe to UPDATEs.
alter publication supabase_realtime add table public.matches;

-- ── match_events (event log) ────────────────────────────────
create table if not exists public.match_events (
  id bigserial primary key,
  match_id uuid not null references public.matches(id) on delete cascade,
  kind text not null,
  payload jsonb,
  state_after jsonb not null,
  created_at timestamptz default now()
);

create index if not exists match_events_match_idx on public.match_events (match_id, id);

-- ── updated_at trigger ──────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists matches_updated_at on public.matches;
create trigger matches_updated_at
  before update on public.matches
  for each row execute function public.set_updated_at();
