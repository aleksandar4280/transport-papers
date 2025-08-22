-- Run this in Supabase SQL editor
-- Fix: no "IF NOT EXISTS" for CREATE POLICY (use DROP POLICY IF EXISTS + CREATE POLICY)

-- 0) Required extension for gen_random_uuid()
create extension if not exists pgcrypto;

-- 1) Table
create table if not exists public.paper_audit (
  id uuid primary key default gen_random_uuid(),
  paper_id uuid not null references public.papers(id) on delete cascade,
  action text not null check (action in ('create','update','delete')),
  actor_id uuid,
  actor_email text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

-- 2) Indexes
create index if not exists idx_paper_audit_paper on public.paper_audit(paper_id);
create index if not exists idx_paper_audit_action on public.paper_audit(action);
create index if not exists idx_paper_audit_created on public.paper_audit(created_at desc);

-- 3) RLS + admin-only SELECT policy
alter table public.paper_audit enable row level security;

-- recreate policy safely
drop policy if exists paper_audit_read_admin on public.paper_audit;
create policy paper_audit_read_admin
  on public.paper_audit
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Note: inserts are done via service role (supabaseAdmin), which bypasses RLS.
