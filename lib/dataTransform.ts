import { parseDisplayDate, toStoredDateValue } from "./format-date"

const LAP68_TABLE_FIELDS: Record<string, Set<string>> = {
  lap68_businesses: new Set([
    "id", "user_id", "name", "code", "color", "icon", "description", "status", "sort_order", "ghi_chu", "created_at", "updated_at",
  ]),
  lap68_categories: new Set([
    "id", "user_id", "business_id", "name", "type", "color", "icon", "created_at",
  ]),
  lap68_transactions: new Set([
    "id", "user_id", "business_id", "type", "amount", "category_id", "counterparty_id", "schedule_id",
    "description", "transaction_date", "payment_method", "ghi_chu", "created_at",
  ]),
  lap68_schedules: new Set([
    "id", "user_id", "business_id", "counterparty_id", "category_id", "direction", "title", "description",
    "amount", "amount_is_estimate", "schedule_kind", "due_date", "next_due_date", "recurrence", "reminder_days",
    "status", "linked_transaction_id", "completed_at", "ghi_chu", "created_at", "updated_at",
  ]),
  lap68_counterparties: new Set([
    "id", "user_id", "business_id", "name", "phone", "email", "role", "ghi_chu", "created_at",
  ]),
  lap68_budgets: new Set([
    "id", "user_id", "business_id", "month_key", "planned_income", "planned_expense", "ghi_chu", "created_at",
  ]),
}

const EXTRA_TO_GHI_CHU = ["bank_account", "contract_ref", "attachments", "notes"] as const

export function sanitizeItem<T extends Record<string, unknown>>(table: keyof typeof LAP68_TABLE_FIELDS, item: T) {
  const allowed = LAP68_TABLE_FIELDS[table]
  const payload: Record<string, unknown> = {}
  const ghiChu: Record<string, unknown> =
    item.ghi_chu && typeof item.ghi_chu === "object" ? { ...(item.ghi_chu as object) } : {}

  for (const [key, value] of Object.entries(item)) {
    if (key === "ghi_chu" || key === "category" || key === "business" || key === "counterparty") continue
    if (allowed.has(key)) {
      payload[key] = value
    } else if ((EXTRA_TO_GHI_CHU as readonly string[]).includes(key)) {
      ghiChu[key] = value
    }
  }

  if (Object.keys(ghiChu).length > 0) {
    payload.ghi_chu = ghiChu
  }

  return payload
}

export function deserializeItem<T extends { ghi_chu?: Record<string, unknown> }>(item: T): T {
  if (!item.ghi_chu) return item
  return { ...item, ...item.ghi_chu }
}

export function monthKeyFromDate(value: string | Date): string {
  const d = typeof value === "string" ? parseDisplayDate(value) : value
  if (!d) return ""
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export function todayKey(): string {
  return toStoredDateValue(new Date())
}
