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
grant select, insert on table public.consultations to anon;
grant select, insert on table public.consultations to authenticated;

drop policy if exists "Anyone can insert consultations" on public.consultations;
drop policy if exists "Anyone can select consultations" on public.consultations;

drop policy if exists "Allow public insert on consultations" on public.consultations;
drop policy if exists "Allow public select on consultations" on public.consultations;

create policy "Anyone can insert consultations"
  on public.consultations
  for insert
  with check (true);

create policy "Anyone can select consultations"
  on public.consultations
  for select
  using (true);
