-- Draft edit tokens must never be available through anonymous table reads.
drop policy if exists "matches: public read" on public.matches;
create policy "matches: published or owner read"
  on public.matches for select
  using (
    (status in ('published', 'finished') and draft_token is null)
    or auth.uid() = owner_id
  );

drop policy if exists "match_events: public read" on public.match_events;
create policy "match_events: visible match read"
  on public.match_events for select
  using (exists (
    select 1 from public.matches m where m.id = match_id
      and ((m.status in ('published', 'finished') and m.draft_token is null) or m.owner_id = auth.uid())
  ));

-- Logo uploads use the existing server endpoint and validate draft/owner access.
drop policy if exists "assets: anon draft insert" on storage.objects;
