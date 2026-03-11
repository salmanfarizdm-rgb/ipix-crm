-- ============================================================
-- Run this in Supabase → SQL Editor → New Query → Run
-- ============================================================

-- USERS TABLE
create table if not exists users (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text unique not null,
  name         text not null,
  role         text not null check (role in ('admin','sales_manager','sales_exec','marketing_manager','marketing_exec','project_manager','finance','hr')),
  active       boolean default true,
  phone        text default '',
  avatar       text default '',
  target       numeric default 0,
  last_login   timestamptz,
  created_at   timestamptz default now()
);

-- RLS
alter table users enable row level security;
create policy "Users can read all" on users for select using (true);
create policy "Users can update own" on users for update using (auth.uid() = id);
create policy "Admin full access" on users for all using (true) with check (true);

-- ============================================================
-- CREATE YOUR TEAM ACCOUNTS
-- Go to Supabase → Authentication → Users → Add User
-- Create each person's account there first, then run the
-- INSERT below with their actual UUIDs
-- ============================================================

-- STEP 1: Go to Supabase → Authentication → Users → "Add user" → "Create new user"
-- Create these accounts:
--   salman@ipixtechnologies.com  (admin)
--   alex@ipixtechnologies.com    (sales_exec)
--   priya@ipixtechnologies.com   (sales_exec)
--   tom@ipixtechnologies.com     (sales_exec)
--   sara@ipixtechnologies.com    (sales_exec)

-- STEP 2: After creating, copy each UUID and fill in below:

-- INSERT INTO users (id, email, name, role, target) VALUES
-- ('UUID-FROM-SUPABASE', 'salman@ipixtechnologies.com', 'Salman Fariz', 'admin', 0),
-- ('UUID-FROM-SUPABASE', 'alex@ipixtechnologies.com',   'Alex Morgan',  'sales_exec', 1500000),
-- ('UUID-FROM-SUPABASE', 'priya@ipixtechnologies.com',  'Priya Nair',   'sales_exec', 1500000),
-- ('UUID-FROM-SUPABASE', 'tom@ipixtechnologies.com',    'Tom Hank',     'sales_exec', 1200000),
-- ('UUID-FROM-SUPABASE', 'sara@ipixtechnologies.com',   'Sara Lee',     'sales_exec', 1500000);
