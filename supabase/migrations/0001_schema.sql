-- =========================================================
-- Transport Papers — kompletna inicijalna šema + RLS
-- Bez "IF NOT EXISTS" u CREATE POLICY (kompatibilno sa Supabase)
-- Sigurno je pokretati više puta (DROP policy, ON CONFLICT, IF NOT EXISTS na tabelama)
-- =========================================================

-- 1) Ekstenzije (za UUID i trigram pretragu)
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- 2) Tabele
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  role text not null default 'user',
  created_at timestamptz default now()
);

create table if not exists public.categories (
  id serial primary key,
  name text unique not null
);

create table if not exists public.papers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  year int,
  keywords_text text,
  authors_text text,
  category_id int references public.categories(id) on delete set null,
  storage_path text not null,
  content_text text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.authors (
  id serial primary key,
  full_name text unique not null
);

create table if not exists public.paper_authors (
  paper_id uuid references public.papers(id) on delete cascade,
  author_id int references public.authors(id) on delete cascade,
  primary key (paper_id, author_id)
);

create table if not exists public.favorites (
  user_id uuid references public.profiles(id) on delete cascade,
  paper_id uuid references public.papers(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, paper_id)
);

-- 3) Trigger za sinhronizaciju profila sa auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4) Uključi RLS
alter table public.papers enable row level security;
alter table public.favorites enable row level security;
alter table public.categories enable row level security;
alter table public.authors enable row level security;
alter table public.paper_authors enable row level security;
alter table public.profiles enable row level security;

-- 5) POLITIKE (DROP pa CREATE)

-- categories: svi mogu select; insert/update/delete samo admin
drop policy if exists categories_read on public.categories;
create policy categories_read on public.categories
  for select using (true);

drop policy if exists categories_write on public.categories;
create policy categories_write on public.categories
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- papers: svi mogu select; insert/update/delete samo admin
drop policy if exists papers_read on public.papers;
create policy papers_read on public.papers
  for select using (true);

drop policy if exists papers_write on public.papers;
create policy papers_write on public.papers
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- authors: svi mogu select; write samo admin
drop policy if exists authors_read on public.authors;
create policy authors_read on public.authors
  for select using (true);

drop policy if exists authors_write on public.authors;
create policy authors_write on public.authors
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- paper_authors (M:N): svi mogu select; write samo admin
drop policy if exists pa_read on public.paper_authors;
create policy pa_read on public.paper_authors
  for select using (true);

drop policy if exists pa_write on public.paper_authors;
create policy pa_write on public.paper_authors
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- favorites: vlasnik samo (select/insert/update/delete)
drop policy if exists fav_select on public.favorites;
create policy fav_select on public.favorites
  for select using (user_id = auth.uid());

drop policy if exists fav_ins on public.favorites;
create policy fav_ins on public.favorites
  for insert with check (user_id = auth.uid());

drop policy if exists fav_upd on public.favorites;
create policy fav_upd on public.favorites
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists fav_del on public.favorites;
create policy fav_del on public.favorites
  for delete using (user_id = auth.uid());

-- profiles: korisnik može da vidi samo svoj red (nije neophodno za app, ali korisno)
drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles
  for select using (id = auth.uid());

-- 6) Indeksi za bržu pretragu (trigram na tekst kolonama)
create index if not exists idx_papers_title_trgm on public.papers using gin (title gin_trgm_ops);
create index if not exists idx_papers_keywords_trgm on public.papers using gin (keywords_text gin_trgm_ops);
create index if not exists idx_papers_authors_trgm on public.papers using gin (authors_text gin_trgm_ops);
create index if not exists idx_papers_content_trgm on public.papers using gin (content_text gin_trgm_ops);

-- 7) Seed osnovnih kategorija
insert into public.categories (name) values
  ('Bezbednost saobraćaja'),
  ('Saobraćajno projektovanje'),
  ('Parkiranje'),
  ('Javni prevoz')
on conflict do nothing;

-- KRAJ
