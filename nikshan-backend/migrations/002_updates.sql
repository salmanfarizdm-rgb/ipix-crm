-- ============================================================
-- Migration 002: Products, Invoices, Purchase updates, Service updates
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. PRODUCTS master table
CREATE TABLE IF NOT EXISTS nk_products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_number  TEXT UNIQUE,
  serial_number TEXT,
  product_name  TEXT NOT NULL,
  brand         TEXT,
  category      TEXT,
  actual_price  NUMERIC(12,2),
  image_url     TEXT,
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. INVOICES table — groups cart line items into one transaction
CREATE TABLE IF NOT EXISTS nk_invoices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE,
  customer_id   UUID REFERENCES nk_customers(id),
  store_id      UUID REFERENCES nk_stores(id),
  sold_by       UUID REFERENCES nk_users(id),
  payment_type  TEXT DEFAULT 'cash' CHECK (payment_type IN ('cash','card','upi','emi','exchange')),
  emi_bank      TEXT,
  subtotal      NUMERIC(12,2) DEFAULT 0,
  total_discount NUMERIC(12,2) DEFAULT 0,
  grand_total   NUMERIC(12,2) DEFAULT 0,
  notes         TEXT,
  status        TEXT DEFAULT 'active' CHECK (status IN ('active','cancelled','returned')),
  cancel_reason TEXT,
  purchase_date DATE DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 3. UPDATE nk_purchases to support cart line items
ALTER TABLE nk_purchases
  ADD COLUMN IF NOT EXISTS invoice_id    UUID REFERENCES nk_invoices(id),
  ADD COLUMN IF NOT EXISTS product_id    UUID REFERENCES nk_products(id),
  ADD COLUMN IF NOT EXISTS actual_price  NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS discount_type TEXT CHECK (discount_type IN ('percentage','fixed','seasonal','none')),
  ADD COLUMN IF NOT EXISTS discount_value NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS final_price   NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS quantity      INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_gift       BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS status        TEXT DEFAULT 'active' CHECK (status IN ('active','cancelled','returned')),
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
  ADD COLUMN IF NOT EXISTS category      TEXT;

-- 4. UPDATE nk_stores — add address, email columns
ALTER TABLE nk_stores
  ADD COLUMN IF NOT EXISTS address   TEXT,
  ADD COLUMN IF NOT EXISTS email     TEXT,
  ADD COLUMN IF NOT EXISTS active    BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 5. UPDATE nk_service_requests — new request types (drop and recreate constraint)
ALTER TABLE nk_service_requests
  DROP CONSTRAINT IF EXISTS nk_service_requests_request_type_check;

ALTER TABLE nk_service_requests
  ADD CONSTRAINT nk_service_requests_request_type_check
  CHECK (request_type IN ('installation','repair','complaint','return','replacement','demo_request','warranty','general'));

-- Update existing 'warranty' and 'general' to be valid in new schema (already in constraint above)

-- 6. Add customer_phone to service requests for walk-ins (no prior customer record)
ALTER TABLE nk_service_requests
  ADD COLUMN IF NOT EXISTS walk_in_name  TEXT,
  ADD COLUMN IF NOT EXISTS walk_in_phone TEXT,
  ADD COLUMN IF NOT EXISTS walk_in_product TEXT;

-- Make customer_id optional (walk-ins may not have a customer record yet)
ALTER TABLE nk_service_requests
  ALTER COLUMN customer_id DROP NOT NULL;

-- ============================================================
-- Seed some products for demo
-- ============================================================
INSERT INTO nk_products (model_number, product_name, brand, category, actual_price) VALUES
  ('SAM-QN55Q80C',   'Samsung 55" QLED 4K Smart TV',     'Samsung',  'Television',         89990),
  ('LG-OLED55C3',    'LG 55" OLED evo 4K Smart TV',      'LG',       'Television',         149990),
  ('SAM-AC18T',      'Samsung 1.5 Ton 5-Star Inverter AC','Samsung',  'Air Conditioner',    45990),
  ('VOLTAS-185DZW',  'Voltas 1.5 Ton 5-Star Inverter AC', 'Voltas',   'Air Conditioner',    41990),
  ('WHIRL-WTW5000',  'Whirlpool 7.5kg Front Load Washer', 'Whirlpool','Washing Machine',    38990),
  ('LG-WM3400',      'LG 8kg Front Load Washing Machine', 'LG',       'Washing Machine',    45990),
  ('SAM-RT42M553',   'Samsung 415L Double Door Refrigerator','Samsung','Refrigerator',      42990),
  ('GODREJ-RF328B',  'Godrej 328L 3-Star Double Door Ref','Godrej',   'Refrigerator',       32990),
  ('IPH-15PRO',      'Apple iPhone 15 Pro',               'Apple',    'Smartphone',         134900),
  ('SAM-S24U',       'Samsung Galaxy S24 Ultra',          'Samsung',  'Smartphone',         129999),
  ('VIVO-V30PRO',    'Vivo V30 Pro 5G',                   'Vivo',     'Smartphone',         49999),
  ('DELL-INS15',     'Dell Inspiron 15 Core i5',          'Dell',     'Laptop',             65990),
  ('HP-PAV15',       'HP Pavilion 15 Core i7',            'HP',       'Laptop',             79990),
  ('SON-WFXB910',    'Sony WF-1000XM5 True Wireless',     'Sony',     'Audio',              24990),
  ('BOA-QC45',       'Bose QuietComfort 45',              'Bose',     'Audio',              29900)
ON CONFLICT (model_number) DO NOTHING;
