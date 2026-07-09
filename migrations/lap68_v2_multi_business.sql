-- =============================================================================
-- LAP68 v2 — Multi-business cash flow + reminders
-- Supabase project: 3lmoto / 79moto (fpiupgmknsydqrihqdbo)
-- Chạy trong Supabase SQL Editor. KHÔNG đụng bảng rental: transactions, customers, vehicles...
-- Prefix bắt buộc: lap68_*
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Việc kinh doanh / Lĩnh vực (multi cashflow streams)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lap68_businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES lap68_auth_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  color TEXT NOT NULL DEFAULT '#22c55e',
  icon TEXT NOT NULL DEFAULT 'briefcase',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'archived')),
  sort_order INT NOT NULL DEFAULT 0,
  ghi_chu JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lap68_businesses_user ON lap68_businesses(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_lap68_businesses_user_code
  ON lap68_businesses(user_id, code) WHERE code IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 2. Đối tác (khách thu / nhà cung cấp chi) theo từng việc
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lap68_counterparties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES lap68_auth_users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES lap68_businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'both'
    CHECK (role IN ('customer', 'supplier', 'both')),
  ghi_chu JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lap68_counterparties_business ON lap68_counterparties(business_id);

-- -----------------------------------------------------------------------------
-- 3. Mở rộng danh mục & giao dịch — gắn việc kinh doanh
-- -----------------------------------------------------------------------------
ALTER TABLE lap68_categories
  ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES lap68_businesses(id) ON DELETE CASCADE;

ALTER TABLE lap68_transactions
  ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES lap68_businesses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS counterparty_id UUID REFERENCES lap68_counterparties(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS schedule_id UUID;

CREATE INDEX IF NOT EXISTS idx_lap68_categories_business ON lap68_categories(business_id);
CREATE INDEX IF NOT EXISTS idx_lap68_transactions_business ON lap68_transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_lap68_transactions_counterparty ON lap68_transactions(counterparty_id);

-- -----------------------------------------------------------------------------
-- 4. Lịch thu/chi & nhắc hẹn
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lap68_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES lap68_auth_users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES lap68_businesses(id) ON DELETE CASCADE,
  counterparty_id UUID REFERENCES lap68_counterparties(id) ON DELETE SET NULL,
  category_id UUID REFERENCES lap68_categories(id) ON DELETE SET NULL,

  direction TEXT NOT NULL CHECK (direction IN ('collect', 'pay')),
  -- collect = phải thu tiền | pay = phải chi/đóng tiền

  title TEXT NOT NULL,
  description TEXT,
  amount BIGINT,
  amount_is_estimate BOOLEAN NOT NULL DEFAULT false,

  schedule_kind TEXT NOT NULL DEFAULT 'once'
    CHECK (schedule_kind IN ('once', 'recurring')),

  -- Ngày đến hạn (lần đầu / lần tiếp theo) — format DD/MM/YYYY
  due_date TEXT NOT NULL,
  next_due_date TEXT,

  -- Lặp: {"frequency":"monthly","interval":1,"day_of_month":5,"end_date":"31/12/2026"}
  recurrence JSONB NOT NULL DEFAULT '{}',

  -- Nhắc trước bao nhiêu ngày: [7,3,1,0]
  reminder_days INT[] NOT NULL DEFAULT ARRAY[3, 1, 0],

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'done', 'skipped', 'overdue', 'cancelled')),

  linked_transaction_id UUID REFERENCES lap68_transactions(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,

  ghi_chu JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FK ngược: transaction -> schedule (sau khi lap68_schedules tồn tại)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lap68_transactions_schedule_id_fkey'
  ) THEN
    ALTER TABLE lap68_transactions
      ADD CONSTRAINT lap68_transactions_schedule_id_fkey
      FOREIGN KEY (schedule_id) REFERENCES lap68_schedules(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_lap68_schedules_user ON lap68_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_lap68_schedules_business ON lap68_schedules(business_id);
CREATE INDEX IF NOT EXISTS idx_lap68_schedules_status ON lap68_schedules(status);
CREATE INDEX IF NOT EXISTS idx_lap68_schedules_next_due ON lap68_schedules(next_due_date);

-- -----------------------------------------------------------------------------
-- 5. Nhật ký nhắc đã gửi (tránh trùng, audit)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lap68_reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES lap68_schedules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES lap68_auth_users(id) ON DELETE CASCADE,
  remind_on_date TEXT NOT NULL,
  days_before INT NOT NULL DEFAULT 0,
  channel TEXT NOT NULL DEFAULT 'in_app'
    CHECK (channel IN ('in_app', 'browser', 'email', 'telegram')),
  status TEXT NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent', 'read', 'dismissed', 'failed')),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lap68_reminder_unique
  ON lap68_reminder_logs(schedule_id, remind_on_date, days_before, channel);

-- -----------------------------------------------------------------------------
-- 6. Kế hoạch ngân sách theo tháng (tùy chọn, phase 2)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lap68_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES lap68_auth_users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES lap68_businesses(id) ON DELETE CASCADE,
  month_key TEXT NOT NULL,
  planned_income BIGINT NOT NULL DEFAULT 0,
  planned_expense BIGINT NOT NULL DEFAULT 0,
  ghi_chu JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, month_key)
);

-- -----------------------------------------------------------------------------
-- 7. Sao lưu JSON (metadata — file lưu Storage bucket lap68-backups)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lap68_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES lap68_auth_users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  tables_included TEXT[] NOT NULL DEFAULT ARRAY[
    'lap68_businesses','lap68_categories','lap68_transactions',
    'lap68_schedules','lap68_counterparties','lap68_budgets'
  ],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 8. Trigger cập nhật updated_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION lap68_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lap68_businesses_updated ON lap68_businesses;
CREATE TRIGGER trg_lap68_businesses_updated
  BEFORE UPDATE ON lap68_businesses
  FOR EACH ROW EXECUTE FUNCTION lap68_set_updated_at();

DROP TRIGGER IF EXISTS trg_lap68_schedules_updated ON lap68_schedules;
CREATE TRIGGER trg_lap68_schedules_updated
  BEFORE UPDATE ON lap68_schedules
  FOR EACH ROW EXECUTE FUNCTION lap68_set_updated_at();

-- -----------------------------------------------------------------------------
-- 9. View tổng hợp nhanh theo việc (dashboard)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW lap68_business_summary AS
SELECT
  b.id AS business_id,
  b.user_id,
  b.name AS business_name,
  b.color,
  b.status,
  COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) AS total_income,
  COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS total_expense,
  COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END), 0) AS net_profit,
  COUNT(t.id) AS transaction_count
FROM lap68_businesses b
LEFT JOIN lap68_transactions t ON t.business_id = b.id
GROUP BY b.id, b.user_id, b.name, b.color, b.status;

-- -----------------------------------------------------------------------------
-- 10. Seed việc mẫu cho admin (chạy 1 lần)
-- -----------------------------------------------------------------------------
INSERT INTO lap68_businesses (user_id, name, code, color, icon, description, sort_order)
SELECT u.id, v.name, v.code, v.color, v.icon, v.description, v.sort_order
FROM lap68_auth_users u
CROSS JOIN (VALUES
  ('Cho thuê xe', 'THUEXE', '#22c55e', 'car', 'Dòng tiền cho thuê phương tiện', 1),
  ('Mua bán', 'MUABAN', '#ef4444', 'shopping-bag', 'Thu chi mua bán hàng hóa', 2),
  ('Dịch vụ khác', 'DICHVU', '#71717a', 'briefcase', 'Các khoản thu chi linh hoạt', 3)
) AS v(name, code, color, icon, description, sort_order)
WHERE u.username = 'admin'
  AND NOT EXISTS (SELECT 1 FROM lap68_businesses WHERE user_id = u.id);

-- Gán business_id mặc định cho giao dịch cũ (việc đầu tiên của user theo sort_order)
UPDATE lap68_transactions t
SET business_id = fb.id
FROM (
  SELECT DISTINCT ON (user_id) user_id, id
  FROM lap68_businesses
  ORDER BY user_id, sort_order ASC, created_at ASC
) fb
WHERE t.user_id = fb.user_id
  AND t.business_id IS NULL;

UPDATE lap68_categories c
SET business_id = fb.id
FROM (
  SELECT DISTINCT ON (user_id) user_id, id
  FROM lap68_businesses
  ORDER BY user_id, sort_order ASC, created_at ASC
) fb
WHERE c.user_id = fb.user_id
  AND c.business_id IS NULL;

-- -----------------------------------------------------------------------------
-- LƯU Ý BẢO MẬT (đọc trước khi production)
-- Hiện tại lap68_* chưa bật RLS. Khi bật RLS, thêm policy theo user_id.
-- KHÔNG dùng chung bảng transactions / auth_users của 79moto/3lmoto.
-- =============================================================================
