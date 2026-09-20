-- Private inbox: authenticated users can submit; only service/admin can read.
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  category text not null check (category in ('idea', 'problem', 'other')),
  message text not null check (char_length(message) between 10 and 2000),
  page_path text not null check (char_length(page_path) <= 200),
  created_at timestamptz not null default now()
);
alter table public.feedback enable row level security;
revoke all on public.feedback from anon, authenticated;
grant insert on public.feedback to authenticated;
grant all on public.feedback to service_role;
create policy "Users submit their own feedback" on public.feedback
for insert to authenticated with check (auth.uid() = user_id);
