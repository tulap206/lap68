-- LAP68: thêm cột snapshot cho sao lưu trực tuyến (chỉ bảng lap68_backups)
ALTER TABLE lap68_backups
  ADD COLUMN IF NOT EXISTS label TEXT,
  ADD COLUMN IF NOT EXISTS snapshot JSONB;
