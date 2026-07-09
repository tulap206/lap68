-- LAP68 Cash Flow Management Schema
-- Run on Supabase project

CREATE TABLE IF NOT EXISTS lap68_auth_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lap68_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES lap68_auth_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color TEXT NOT NULL DEFAULT '#059669',
  icon TEXT NOT NULL DEFAULT 'wallet',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lap68_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES lap68_auth_users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount BIGINT NOT NULL DEFAULT 0,
  category_id UUID REFERENCES lap68_categories(id) ON DELETE SET NULL,
  description TEXT,
  transaction_date TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  ghi_chu JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lap68_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  username TEXT,
  display_name TEXT,
  action TEXT NOT NULL,
  module TEXT NOT NULL DEFAULT 'cashflow',
  details TEXT,
  ip_address TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO lap68_auth_users (username, password, display_name, role)
VALUES ('admin', 'Lap68@123', 'Quản trị viên', 'admin')
ON CONFLICT (username) DO NOTHING;
