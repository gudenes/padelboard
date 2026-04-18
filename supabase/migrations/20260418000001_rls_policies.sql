-- supabase/migrations/20260418000001_rls_policies.sql
-- Row-level security policies.
--
-- Key idea: all draft writes go through server API routes using the service key
-- and verify draft_token server-side, so there is NO direct anon write policy.
-- Supabase RLS denies by default when no policy matches, so clients cannot
-- write to `matches` directly. The overlay needs public READ — that policy
-- is below. Owner-only writes are enforced for published matches.

alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.match_events enable row level security;

-- ── profiles ────────────────────────────────────────────────
drop policy if exists "profiles: self read" on public.profiles;
create policy "profiles: self read"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles: self insert" on public.profiles;
create policy "profiles: self insert"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles: self update" on public.profiles;
create policy "profiles: self update"
  on public.profiles for update
  using (auth.uid() = id);

-- ── matches ─────────────────────────────────────────────────
drop policy if exists "matches: public read" on public.matches;
create policy "matches: public read"
  on public.matches for select
  using (true);

drop policy if exists "matches: owner update" on public.matches;
create policy "matches: owner update"
  on public.matches for update
  using (auth.uid() = owner_id);

drop policy if exists "matches: owner delete" on public.matches;
create policy "matches: owner delete"
  on public.matches for delete
  using (auth.uid() = owner_id);

-- No INSERT policy: all match creation routed through service-role API.

-- ── match_events ────────────────────────────────────────────
drop policy if exists "match_events: public read" on public.match_events;
create policy "match_events: public read"
  on public.match_events for select
  using (true);

drop policy if exists "match_events: owner insert" on public.match_events;
create policy "match_events: owner insert"
  on public.match_events for insert
  with check (
    auth.uid() = (select owner_id from public.matches where id = match_id)
  );
