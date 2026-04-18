-- supabase/migrations/20260418000002_storage.sql
-- Public storage bucket for team/club logos.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('assets', 'assets', true, 2097152, array['image/png','image/jpeg','image/webp','image/svg+xml'])
on conflict (id) do nothing;

-- Public read
drop policy if exists "assets: public read" on storage.objects;
create policy "assets: public read"
  on storage.objects for select
  using (bucket_id = 'assets');

-- Authenticated users can upload
drop policy if exists "assets: authenticated insert" on storage.objects;
create policy "assets: authenticated insert"
  on storage.objects for insert
  with check (bucket_id = 'assets' and auth.role() = 'authenticated');

-- Anonymous upload permitted in v1 so drafts can attach logos before signup.
drop policy if exists "assets: anon draft insert" on storage.objects;
create policy "assets: anon draft insert"
  on storage.objects for insert
  with check (bucket_id = 'assets' and auth.role() = 'anon');
