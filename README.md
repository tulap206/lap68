# LAP68 — Quản lý dòng tiền

Ứng dụng web theo dõi thu chi kinh doanh cá nhân, giao diện admin dashboard theo phong cách 79moto.

## Tính năng

- Dashboard tổng quan: KPI thu/chi/lợi nhuận, biểu đồ dòng tiền
- Quản lý giao dịch thu/chi (CRUD, lọc, tìm kiếm)
- Danh mục thu chi tùy chỉnh
- Báo cáo tài chính và phân tích
- Lịch sử hoạt động
- Sao lưu/khôi phục JSON

## Tech stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Recharts
- Supabase (PostgreSQL)

## Chạy local

```bash
npm install
cp .env.example .env.local
# Điền Supabase URL và anon key
npm run dev
```

Mở http://localhost:3000 — đăng nhập mặc định: `admin` / `Lap68@123`

## Supabase

Schema trong `setup.sql`. Bảng dùng prefix `lap68_` trên project Supabase. Kế hoạch nâng cấp v2: [`docs/KE_HOACH_NANG_CAP.md`](docs/KE_HOACH_NANG_CAP.md).

## Triển khai Vercel

1. Push repo lên GitHub
2. Import project trên Vercel
3. Thêm env vars `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY`
