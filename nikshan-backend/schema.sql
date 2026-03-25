-- Nikshan CRM Schema (all tables prefixed nk_)

CREATE TABLE IF NOT EXISTS nk_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  manager_id UUID,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nk_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','branch_manager','sales_manager','sales_exec','technician')),
  store_id UUID REFERENCES nk_stores(id),
  phone TEXT,
  active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nk_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  address TEXT,
  store_id UUID REFERENCES nk_stores(id),
  source TEXT DEFAULT 'walk-in',
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_by UUID REFERENCES nk_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nk_customer_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES nk_customers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES nk_users(id),
  interaction_type TEXT DEFAULT 'visit',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nk_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  product_interest TEXT,
  source TEXT DEFAULT 'walk-in',
  status TEXT DEFAULT 'new' CHECK (status IN ('new','contacted','quoted','negotiating','won','lost')),
  assigned_to UUID REFERENCES nk_users(id),
  converted_by UUID REFERENCES nk_users(id),
  store_id UUID REFERENCES nk_stores(id),
  customer_id UUID REFERENCES nk_customers(id),
  estimated_value NUMERIC(12,2),
  notes TEXT,
  lost_reason TEXT,
  won_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nk_lead_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES nk_leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES nk_users(id),
  notes TEXT,
  attended_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nk_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES nk_customers(id),
  lead_id UUID REFERENCES nk_leads(id),
  store_id UUID REFERENCES nk_stores(id),
  sold_by UUID REFERENCES nk_users(id),
  product_name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  amount NUMERIC(12,2) NOT NULL,
  payment_type TEXT DEFAULT 'cash' CHECK (payment_type IN ('cash','card','upi','emi','exchange')),
  emi_bank TEXT,
  purchase_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nk_emi_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES nk_purchases(id),
  customer_id UUID REFERENCES nk_customers(id),
  bank_name TEXT NOT NULL,
  loan_amount NUMERIC(12,2) NOT NULL,
  monthly_emi NUMERIC(12,2) NOT NULL,
  tenure_months INTEGER NOT NULL,
  start_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','closed','defaulted')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nk_service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES nk_customers(id),
  purchase_id UUID REFERENCES nk_purchases(id),
  store_id UUID REFERENCES nk_stores(id),
  assigned_to UUID REFERENCES nk_users(id),
  created_by UUID REFERENCES nk_users(id),
  request_type TEXT DEFAULT 'repair' CHECK (request_type IN ('repair','installation','replacement','warranty','general')),
  product_name TEXT NOT NULL,
  issue_description TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','resolved','cancelled')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  resolved_date DATE,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nk_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES nk_customers(id),
  lead_id UUID REFERENCES nk_leads(id),
  assigned_to UUID REFERENCES nk_users(id),
  created_by UUID REFERENCES nk_users(id),
  follow_up_type TEXT DEFAULT 'call',
  due_date DATE NOT NULL,
  notes TEXT,
  done BOOLEAN DEFAULT false,
  done_at TIMESTAMPTZ,
  outcome TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
