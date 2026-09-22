create extension if not exists pgcrypto;

create table if not exists public.consultations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  phone text,
  situation text,
  goal text,
  message text,
  status text default 'pending',
  created_at timestamptz default now()
);

alter table public.consultations enable row level security;

grant usage on schema public to anon;
grant usage on schema public to authenticated;
grant insert on table public.consultations to anon;
grant select, insert, update on table public.consultations to authenticated;

drop policy if exists "Anyone can insert consultations" on public.consultations;
create policy "Anyone can insert consultations"
  on public.consultations
  for insert
  with check (true);

-- 읽기/상태 변경은 관리자만 (supabase-security-fix.sql 참고)
create policy "Admin can read consultations"
  on public.consultations
  for select
  to authenticated
  using ((auth.jwt() ->> 'email') = 'joshim3472@gmail.com');

create policy "Admin can update consultations"
  on public.consultations
  for update
  to authenticated
  using ((auth.jwt() ->> 'email') = 'joshim3472@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'joshim3472@gmail.com');
