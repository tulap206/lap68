import { createClient } from "@supabase/supabase-js"
import { sanitizeItem } from "./dataTransform"
import {
  computeNextDueDate,
  computeScheduleStatus,
  getEffectiveDueDate,
  scheduleToTransactionType,
} from "./schedule-engine"
import { toStoredDateValue } from "./format-date"
import {
  buildPortfolioSettings,
  defaultLiquidAccounts,
  parseUserPortfolioSettings,
  PORTFOLIO_SETTINGS_COUNTERPARTY_NAME,
  type UserPortfolioSettings,
} from "./account-balance"
import {
  buildCapitalGhiChu,
  parseBusinessCapital,
  type CapitalAdjustType,
  type CapitalLedgerEntry,
} from "./capital"
import type {
  AccessLog,
  AuthUser,
  Budget,
  Business,
  BusinessSummary,
  Category,
  Counterparty,
  ExportUserData,
  Lap68Backup,
  Schedule,
  Transaction,
} from "./types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type {
  AccessLog,
  AuthUser,
  Budget,
  Business,
  BusinessSummary,
  Category,
  Counterparty,
  ExportUserData,
  Lap68Backup,
  Schedule,
  Transaction,
  TransactionType,
  PaymentMethod,
} from "./types"

export async function fetchAuthUser(username: string, password: string) {
  const { data, error } = await supabase
    .from("lap68_auth_users")
    .select("*")
    .eq("username", username)
    .eq("password", password)
    .maybeSingle()
  if (error) throw error
  return data as AuthUser | null
}

// --- Businesses ---
export async function fetchBusinesses(userId: string) {
  const { data, error } = await supabase
    .from("lap68_businesses")
    .select("*")
    .eq("user_id", userId)
    .neq("status", "archived")
    .order("sort_order")
  if (error) throw error
  return (data || []) as Business[]
}

export async function fetchBusinessSummaries(userId: string) {
  const { data, error } = await supabase
    .from("lap68_business_summary")
    .select("*")
    .eq("user_id", userId)
    .neq("status", "archived")
  if (error) throw error
  return (data || []) as BusinessSummary[]
}

export async function fetchBusiness(id: string) {
  const { data, error } = await supabase.from("lap68_businesses").select("*").eq("id", id).maybeSingle()
  if (error) throw error
  return data as Business | null
}

export async function insertBusiness(item: Omit<Business, "id" | "created_at" | "updated_at">) {
  const payload = sanitizeItem("lap68_businesses", item)
  const { data, error } = await supabase.from("lap68_businesses").insert(payload).select().single()
  if (error) throw error
  return data as Business
}

export async function updateBusiness(id: string, updates: Partial<Business>) {
  const payload = sanitizeItem("lap68_businesses", updates)
  const { data, error } = await supabase.from("lap68_businesses").update(payload).eq("id", id).select().single()
  if (error) throw error
  return data as Business
}

export async function setBusinessOpeningCapital(business: Business, openingCapital: number) {
  const meta = parseBusinessCapital(business.ghi_chu)
  const ghi_chu = buildCapitalGhiChu(business.ghi_chu, { ...meta, opening_capital: openingCapital })
  return updateBusiness(business.id, { ghi_chu })
}

export async function adjustBusinessCapital(
  business: Business,
  type: CapitalAdjustType,
  amount: number,
  note?: string
) {
  if (amount <= 0) throw new Error("Số tiền phải lớn hơn 0")
  const meta = parseBusinessCapital(business.ghi_chu)
  const entry: CapitalLedgerEntry = {
    id: crypto.randomUUID(),
    type,
    amount,
    note: note?.trim() || null,
    created_at: new Date().toISOString(),
  }
  const ghi_chu = buildCapitalGhiChu(business.ghi_chu, {
    ...meta,
    capital_ledger: [...meta.capital_ledger, entry],
  })
  return updateBusiness(business.id, { ghi_chu })
}

// --- Categories ---
export async function fetchCategories(userId: string, businessId?: string) {
  let q = supabase.from("lap68_categories").select("*").eq("user_id", userId).order("name")
  if (businessId) q = q.eq("business_id", businessId)
  const { data, error } = await q
  if (error) throw error
  return (data || []) as Category[]
}

export async function insertCategory(category: Omit<Category, "id" | "created_at">) {
  const payload = sanitizeItem("lap68_categories", category)
  const { data, error } = await supabase.from("lap68_categories").insert(payload).select().single()
  if (error) throw error
  return data as Category
}

export async function updateCategory(id: string, updates: Partial<Category>) {
  const payload = sanitizeItem("lap68_categories", updates)
  const { data, error } = await supabase.from("lap68_categories").update(payload).eq("id", id).select().single()
  if (error) throw error
  return data as Category
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from("lap68_categories").delete().eq("id", id)
  if (error) throw error
}

// --- Counterparties ---
export async function fetchCounterparties(userId: string, businessId?: string) {
  let q = supabase
    .from("lap68_counterparties")
    .select("*")
    .eq("user_id", userId)
    .neq("name", PORTFOLIO_SETTINGS_COUNTERPARTY_NAME)
    .order("name")
  if (businessId) q = q.eq("business_id", businessId)
  const { data, error } = await q
  if (error) throw error
  return (data || []) as Counterparty[]
}

export async function fetchPortfolioSettings(userId: string): Promise<UserPortfolioSettings> {
  const { data, error } = await supabase
    .from("lap68_counterparties")
    .select("*")
    .eq("user_id", userId)
    .eq("name", PORTFOLIO_SETTINGS_COUNTERPARTY_NAME)
    .maybeSingle()
  if (error) throw error
  if (!data) {
    return { liquid_accounts: defaultLiquidAccounts(), updated_at: null }
  }
  return parseUserPortfolioSettings(data.ghi_chu)
}

export async function savePortfolioSettings(userId: string, portfolio: UserPortfolioSettings) {
  const ghi_chu = {
    ...buildPortfolioSettings({}, { ...portfolio, updated_at: new Date().toISOString() }),
    _lap68_internal: true,
  }
  const { data: existing, error: fetchError } = await supabase
    .from("lap68_counterparties")
    .select("id")
    .eq("user_id", userId)
    .eq("name", PORTFOLIO_SETTINGS_COUNTERPARTY_NAME)
    .maybeSingle()
  if (fetchError) throw fetchError

  if (existing?.id) {
    return updateCounterparty(existing.id, { ghi_chu })
  }

  return insertCounterparty({
    user_id: userId,
    business_id: null,
    name: PORTFOLIO_SETTINGS_COUNTERPARTY_NAME,
    phone: null,
    email: null,
    role: "both",
    ghi_chu,
  })
}

export async function insertCounterparty(item: Omit<Counterparty, "id" | "created_at">) {
  const payload = sanitizeItem("lap68_counterparties", item)
  const { data, error } = await supabase.from("lap68_counterparties").insert(payload).select().single()
  if (error) throw error
  return data as Counterparty
}

export async function updateCounterparty(id: string, updates: Partial<Counterparty>) {
  const payload = sanitizeItem("lap68_counterparties", updates)
  const { data, error } = await supabase.from("lap68_counterparties").update(payload).eq("id", id).select().single()
  if (error) throw error
  return data as Counterparty
}

export async function deleteCounterparty(id: string) {
  const { error } = await supabase.from("lap68_counterparties").delete().eq("id", id)
  if (error) throw error
}

// --- Transactions ---
export async function fetchTransactions(userId: string, businessId?: string) {
  let q = supabase
    .from("lap68_transactions")
    .select("*, category:lap68_categories(*), counterparty:lap68_counterparties(*), business:lap68_businesses(*)")
    .eq("user_id", userId)
    .order("transaction_date", { ascending: false })
  if (businessId) q = q.eq("business_id", businessId)
  const { data, error } = await q
  if (error) throw error
  return (data || []) as Transaction[]
}

export async function insertTransaction(transaction: Omit<Transaction, "id" | "created_at" | "category" | "counterparty" | "business">) {
  const payload = sanitizeItem("lap68_transactions", transaction)
  const { data, error } = await supabase
    .from("lap68_transactions")
    .insert(payload)
    .select("*, category:lap68_categories(*), counterparty:lap68_counterparties(*)")
    .single()
  if (error) throw error
  return data as Transaction
}

export async function updateTransaction(id: string, updates: Partial<Omit<Transaction, "category" | "counterparty" | "business">>) {
  const payload = sanitizeItem("lap68_transactions", updates)
  const { data, error } = await supabase
    .from("lap68_transactions")
    .update(payload)
    .eq("id", id)
    .select("*, category:lap68_categories(*), counterparty:lap68_counterparties(*)")
    .single()
  if (error) throw error
  return data as Transaction
}

export async function deleteTransaction(id: string) {
  const { error } = await supabase.from("lap68_transactions").delete().eq("id", id)
  if (error) throw error
}

// --- Schedules ---
export async function fetchSchedules(userId: string, businessId?: string) {
  let q = supabase
    .from("lap68_schedules")
    .select("*, business:lap68_businesses(*), category:lap68_categories(*), counterparty:lap68_counterparties(*)")
    .eq("user_id", userId)
    .order("next_due_date", { ascending: true })
  if (businessId) q = q.eq("business_id", businessId)
  const { data, error } = await q
  if (error) throw error
  return (data || []) as Schedule[]
}

export async function insertSchedule(item: Omit<Schedule, "id" | "created_at" | "updated_at" | "business" | "category" | "counterparty">) {
  const nextDue = item.next_due_date || item.due_date
  const status = computeScheduleStatus({ ...item, next_due_date: nextDue } as Schedule)
  const payload = sanitizeItem("lap68_schedules", { ...item, next_due_date: nextDue, status })
  const { data, error } = await supabase
    .from("lap68_schedules")
    .insert(payload)
    .select("*, business:lap68_businesses(*), category:lap68_categories(*), counterparty:lap68_counterparties(*)")
    .single()
  if (error) throw error
  return data as Schedule
}

export async function updateSchedule(id: string, updates: Partial<Schedule>) {
  const payload = sanitizeItem("lap68_schedules", updates)
  const { data, error } = await supabase
    .from("lap68_schedules")
    .update(payload)
    .eq("id", id)
    .select("*, business:lap68_businesses(*), category:lap68_categories(*), counterparty:lap68_counterparties(*)")
    .single()
  if (error) throw error
  return data as Schedule
}

export async function deleteSchedule(id: string) {
  const { error } = await supabase.from("lap68_schedules").delete().eq("id", id)
  if (error) throw error
}

export async function syncScheduleStatuses(userId: string) {
  const schedules = await fetchSchedules(userId)
  const today = new Date()
  await Promise.all(
    schedules.map(async (s) => {
      const status = computeScheduleStatus(s, today)
      if (status !== s.status && !["done", "skipped", "cancelled"].includes(s.status)) {
        await updateSchedule(s.id, { status })
      }
    })
  )
}

export async function completeSchedule(schedule: Schedule, amount: number, paymentMethod: Transaction["payment_method"] = "cash") {
  const tx = await insertTransaction({
    user_id: schedule.user_id,
    business_id: schedule.business_id,
    type: scheduleToTransactionType(schedule.direction),
    amount,
    category_id: schedule.category_id,
    counterparty_id: schedule.counterparty_id,
    schedule_id: schedule.id,
    description: schedule.title + (schedule.description ? ` — ${schedule.description}` : ""),
    transaction_date: toStoredDateValue(new Date()),
    payment_method: paymentMethod,
    ghi_chu: {},
  })

  if (schedule.schedule_kind === "once") {
    await updateSchedule(schedule.id, {
      status: "done",
      linked_transaction_id: tx.id,
      completed_at: new Date().toISOString(),
    })
  } else {
    const next = computeNextDueDate(getEffectiveDueDate(schedule), schedule.recurrence, new Date())
    if (next) {
      await updateSchedule(schedule.id, {
        next_due_date: next,
        due_date: next,
        status: "pending",
        linked_transaction_id: tx.id,
        completed_at: new Date().toISOString(),
      })
    } else {
      await updateSchedule(schedule.id, {
        status: "done",
        linked_transaction_id: tx.id,
        completed_at: new Date().toISOString(),
      })
    }
  }

  return tx
}

// --- Budgets ---
export async function fetchBudgets(userId: string, businessId?: string) {
  let q = supabase.from("lap68_budgets").select("*").eq("user_id", userId)
  if (businessId) q = q.eq("business_id", businessId)
  const { data, error } = await q
  if (error) throw error
  return (data || []) as Budget[]
}

export async function upsertBudget(item: Omit<Budget, "id" | "created_at">) {
  const payload = sanitizeItem("lap68_budgets", item)
  const { data, error } = await supabase
    .from("lap68_budgets")
    .upsert(payload, { onConflict: "business_id,month_key" })
    .select()
    .single()
  if (error) throw error
  return data as Budget
}

// --- Access logs ---
export async function fetchAccessLogs(userId?: string, limit = 100) {
  let q = supabase
    .from("lap68_access_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)
  if (userId) q = q.eq("user_id", userId)
  const { data, error } = await q
  if (error) throw error
  return (data || []) as AccessLog[]
}

export async function insertAccessLog(log: Omit<AccessLog, "id" | "created_at">) {
  const { error } = await supabase.from("lap68_access_logs").insert(log)
  if (error) throw error
}

export async function exportUserData(userId: string): Promise<ExportUserData> {
  const [businesses, categories, transactions, schedules, counterparties, budgets] = await Promise.all([
    fetchBusinesses(userId),
    fetchCategories(userId),
    fetchTransactions(userId),
    fetchSchedules(userId),
    fetchCounterparties(userId),
    fetchBudgets(userId),
  ])
  return {
    businesses,
    categories,
    transactions,
    schedules,
    counterparties,
    budgets,
    exportedAt: new Date().toISOString(),
  }
}

const BACKUP_TABLES = [
  "lap68_businesses",
  "lap68_categories",
  "lap68_transactions",
  "lap68_schedules",
  "lap68_counterparties",
  "lap68_budgets",
] as const

const MAX_CLOUD_BACKUPS = 15

export async function fetchCloudBackups(userId: string) {
  const { data, error } = await supabase
    .from("lap68_backups")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(MAX_CLOUD_BACKUPS)
  if (error) throw error
  return (data || []) as Lap68Backup[]
}

async function pruneCloudBackups(userId: string) {
  const { data, error } = await supabase
    .from("lap68_backups")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  if (error) throw error
  const rows = data || []
  if (rows.length <= MAX_CLOUD_BACKUPS) return
  const toDelete = rows.slice(MAX_CLOUD_BACKUPS).map((r) => r.id)
  await supabase.from("lap68_backups").delete().in("id", toDelete)
}

export async function createCloudBackup(userId: string, label?: string) {
  const snapshot = await exportUserData(userId)
  const json = JSON.stringify(snapshot)
  const now = Date.now()
  const { data, error } = await supabase
    .from("lap68_backups")
    .insert({
      user_id: userId,
      file_path: `cloud/${userId}/${now}.json`,
      file_size: new TextEncoder().encode(json).length,
      tables_included: [...BACKUP_TABLES],
      label: label || `Sao lưu ${new Date().toLocaleString("vi-VN")}`,
      snapshot,
    })
    .select()
    .single()
  if (error) throw error
  await pruneCloudBackups(userId)
  return data as Lap68Backup
}

export async function deleteCloudBackup(id: string) {
  const { error } = await supabase.from("lap68_backups").delete().eq("id", id)
  if (error) throw error
}

export async function getCloudBackupSnapshot(backupId: string) {
  const { data, error } = await supabase
    .from("lap68_backups")
    .select("snapshot, label")
    .eq("id", backupId)
    .maybeSingle()
  if (error) throw error
  if (!data?.snapshot) throw new Error("Bản sao lưu không có dữ liệu")
  return { snapshot: data.snapshot as ExportUserData, label: data.label as string | null }
}

export function subscribeLap68Tables(userId: string, onChange: () => void) {
  const channel = supabase
    .channel(`lap68-${userId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "lap68_transactions" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "lap68_schedules" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "lap68_businesses" }, onChange)
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}
