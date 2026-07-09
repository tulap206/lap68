# Nguyên tắc dự án độc lập — LAP68

Tài liệu này ghi ràng buộc khi phát triển LAP68. Mọi agent/developer phải tuân thủ.

## Phạm vi

| Thuộc LAP68 | Không thuộc LAP68 |
|-------------|-------------------|
| Repo `github.com/tulap206/lap68` | `79moto`, `3lmoto` / `3lmotohue` |
| Deploy `lap68.vercel.app` | Deploy 79moto / 3lmoto |
| Bảng DB `lap68_*` | `customers`, `vehicles`, `rentals`, `transactions`, `auth_users`, … |
| Bucket `lap68-backups` | `backups`, `customer-documents`, … |
| User `lap68_auth_users` | `auth_users` (app khác) |

## Cấm

1. Sửa file trong thư mục `Code/79moto` hoặc `Code/3lmotohue` khi làm task LAP68
2. SQL `ALTER/DROP/INSERT/UPDATE` trên bảng không prefix `lap68_`
3. Import hoặc sync dữ liệu từ app khác vào LAP68
4. Dùng chung bảng `transactions` — LAP68 dùng `lap68_transactions`
5. Phụ thuộc runtime (import code) từ repo 79moto/3lmoto

## Được phép

1. Dùng chung **Supabase instance** (cùng URL/API key) nếu chưa có project riêng — miễn chỉ đụng `lap68_*`
2. Tham khảo ý tưởng UI (layout admin) — code đã nằm trong repo `lap68`
3. Tạo Supabase project riêng `lap68` sau này và migrate chỉ bảng `lap68_*`

## Code

- Mọi query Supabase: `.from('lap68_...')` only
- Migration mới: file trong `lap68/migrations/`, prefix bảng `lap68_`
- API routes: chỉ trong `lap68/app/api/`

## Kiểm tra trước khi merge

- [ ] Diff chỉ nằm trong repo `lap68`
- [ ] Không có `.from('transactions')` hay bảng không prefix
- [ ] SQL migration không chứa tên bảng ngoài `lap68_*`
