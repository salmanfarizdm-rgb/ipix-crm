-- ============================================================
-- IPIX CRM - Electronics Retail Schema
-- Run in Supabase → SQL Editor → New Query → Run
-- ============================================================

-- STORES
create table if not exists stores (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  location   text default '',
  phone      text default '',
  email      text default '',
  created_at timestamptz default now()
);

-- USERS (extend existing if needed — add store_id)
alter table users add column if not exists store_id uuid references stores(id);

-- CUSTOMERS
create table if not exists customers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  phone      text not null,
  email      text default '',
  store_id   uuid references stores(id),
  source     text default 'walk-in' check (source in ('walk-in','online','whatsapp','referral')),
  tags       text default 'regular' check (tags in ('VIP','EMI','regular')),
  notes      text default '',
  created_at timestamptz default now()
);

-- RETAIL LEADS
create table if not exists retail_leads (
  id               uuid primary key default gen_random_uuid(),
  customer_name    text not null,
  phone            text not null,
  email            text default '',
  store_id         uuid references stores(id),
  assigned_to      uuid references users(id),
  status           text default 'new' check (status in ('new','contacted','quoted','won','lost')),
  product_interest text default '',
  source           text default 'walk-in',
  lost_reason      text default '',
  follow_up_date   date,
  notes            text default '',
  created_at       timestamptz default now()
);

-- PURCHASES
create table if not exists purchases (
  id             uuid primary key default gen_random_uuid(),
  customer_id    uuid references customers(id) on delete cascade,
  store_id       uuid references stores(id),
  product_name   text not null,
  brand          text default '',
  category       text default 'Other',
  amount         numeric not null default 0,
  payment_type   text default 'cash' check (payment_type in ('cash','card','emi','online')),
  purchase_date  date default current_date,
  invoice_number text default '',
  created_at     timestamptz default now()
);

-- EMI RECORDS
create table if not exists emi_records (
  id             uuid primary key default gen_random_uuid(),
  purchase_id    uuid references purchases(id) on delete cascade,
  customer_id    uuid references customers(id) on delete cascade,
  bank_name      text not null,
  tenure_months  integer not null,
  emi_amount     numeric not null,
  start_date     date not null,
  status         text default 'active' check (status in ('active','completed','defaulted')),
  created_at     timestamptz default now()
);

-- SERVICE REQUESTS
create table if not exists service_requests (
  id                   uuid primary key default gen_random_uuid(),
  customer_id          uuid references customers(id) on delete cascade,
  purchase_id          uuid references purchases(id),
  store_id             uuid references stores(id),
  type                 text default 'installation' check (type in ('installation','repair','replacement')),
  description          text not null,
  assigned_technician  text default '',
  status               text default 'pending' check (status in ('pending','in-progress','resolved')),
  scheduled_date       date,
  resolved_date        timestamptz,
  created_at           timestamptz default now()
);

-- FOLLOW-UPS
create table if not exists follow_ups (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid references retail_leads(id) on delete cascade,
  customer_id uuid references customers(id) on delete cascade,
  user_id     uuid references users(id),
  note        text not null,
  due_date    date not null,
  is_done     boolean default false,
  created_at  timestamptz default now()
);

-- INDEXES
create index if not exists customers_store_idx     on customers(store_id);
create index if not exists customers_tags_idx      on customers(tags);
create index if not exists retail_leads_status_idx on retail_leads(status);
create index if not exists retail_leads_store_idx  on retail_leads(store_id);
create index if not exists purchases_customer_idx  on purchases(customer_id);
create index if not exists emi_customer_idx        on emi_records(customer_id);
create index if not exists emi_status_idx          on emi_records(status);
create index if not exists service_status_idx      on service_requests(status);
create index if not exists followups_due_idx       on follow_ups(due_date);
create index if not exists followups_done_idx      on follow_ups(is_done);

-- RLS
alter table stores          enable row level security;
alter table customers       enable row level security;
alter table retail_leads    enable row level security;
alter table purchases       enable row level security;
alter table emi_records     enable row level security;
alter table service_requests enable row level security;
alter table follow_ups      enable row level security;

create policy "Allow all stores"    on stores           for all using (true) with check (true);
create policy "Allow all customers" on customers        for all using (true) with check (true);
create policy "Allow all retail_leads" on retail_leads  for all using (true) with check (true);
create policy "Allow all purchases" on purchases        for all using (true) with check (true);
create policy "Allow all emi"       on emi_records      for all using (true) with check (true);
create policy "Allow all service"   on service_requests for all using (true) with check (true);
create policy "Allow all followups" on follow_ups       for all using (true) with check (true);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Stores
insert into stores (id, name, location, phone, email) values
  ('11111111-1111-1111-1111-111111111111', 'Nikshan Calicut',  'Kozhikode, Kerala', '+91 495 2700000', 'calicut@nikshan.com'),
  ('22222222-2222-2222-2222-222222222222', 'Nikshan Kannur',   'Kannur, Kerala',    '+91 497 2700000', 'kannur@nikshan.com')
on conflict (id) do nothing;

-- Demo customers
insert into customers (name, phone, email, store_id, source, tags, notes, created_at) values
  ('Rahul Sharma',      '+91 9876543210', 'rahul@gmail.com',   '11111111-1111-1111-1111-111111111111', 'walk-in',  'VIP',     'High-value regular buyer', now() - interval '20 days'),
  ('Priya Nair',        '+91 9845231076', 'priya@gmail.com',   '11111111-1111-1111-1111-111111111111', 'whatsapp', 'EMI',     'Bought TV on EMI',        now() - interval '15 days'),
  ('Mohammed Ashraf',   '+91 9961234567', 'ashraf@gmail.com',  '22222222-2222-2222-2222-222222222222', 'online',   'regular', '',                        now() - interval '10 days'),
  ('Sunitha Menon',     '+91 9846123456', 'sunitha@gmail.com', '11111111-1111-1111-1111-111111111111', 'referral', 'VIP',     'Referred by Rahul',       now() - interval '5 days'),
  ('Anil Kumar',        '+91 9745678901', '',                  '22222222-2222-2222-2222-222222222222', 'walk-in',  'regular', '',                        now() - interval '2 days')
on conflict do nothing;

-- Demo retail leads
insert into retail_leads (customer_name, phone, email, store_id, status, product_interest, source, notes, created_at) values
  ('Rajan P',       '+91 9812345678', '', '11111111-1111-1111-1111-111111111111', 'new',       'Samsung 65" QLED TV',      'walk-in',  '', now() - interval '3 days'),
  ('Fathima K',     '+91 9898765432', '', '11111111-1111-1111-1111-111111111111', 'contacted', 'LG 5-star AC',             'whatsapp', 'Interested in 1.5 ton split AC', now() - interval '5 days'),
  ('Suresh Babu',   '+91 9745612345', '', '22222222-2222-2222-2222-222222222222', 'quoted',    'iPhone 15 Pro',            'online',   'Comparing with Samsung S24', now() - interval '7 days'),
  ('Meera Pillai',  '+91 9846789012', '', '22222222-2222-2222-2222-222222222222', 'won',       'Whirlpool Washing Machine', 'referral', 'Converted — purchase logged', now() - interval '2 days'),
  ('Vishnu Das',    '+91 9961122334', '', '11111111-1111-1111-1111-111111111111', 'lost',      'Sony Bravia TV',           'walk-in',  '', now() - interval '8 days')
on conflict do nothing;
