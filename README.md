# LAP68 — Quản lý dòng tiền

Ứng dụng web **độc lập** theo dõi thu chi kinh doanh cá nhân — nhiều việc, nhiều dòng tiền.

> **LAP68 không thay đổi** codebase hay dữ liệu của 79moto / 3lmoto. Chỉ dùng bảng Supabase prefix `lap68_*`.

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
- Supabase (PostgreSQL) — schema `lap68_*` only

## Chạy local

```bash
npm install
cp .env.example .env.local
# Điền Supabase URL và anon key (project chứa bảng lap68_*)
npm run dev
```

Mở http://localhost:3000 — đăng nhập mặc định: `admin` / `Lap68@123`

## Supabase

- Schema: `setup.sql`, migration v2: `migrations/lap68_v2_multi_business.sql`
- **Chỉ** tạo/query bảng `lap68_*`
- Kế hoạch nâng cấp: [`docs/KE_HOACH_NANG_CAP.md`](docs/KE_HOACH_NANG_CAP.md)
- Nguyên tắc độc lập: [`docs/NGUYEN_TAC_DOC_LAP.md`](docs/NGUYEN_TAC_DOC_LAP.md)

## Triển khai Vercel

- Repo: https://github.com/tulap206/lap68
- Live: https://lap68.vercel.app
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
