import { createClient } from "@supabase/supabase-js"
import { sanitizeItem } from "./dataTransform"
import {
  computeNextDueDate,
  computeScheduleStatus,
  getEffectiveDueDate,
  scheduleToTransactionType,
} from "./schedule-engine"
import { toStoredDateValue } from "./format-date"
import type {
  AccessLog,
  AuthUser,
  Budget,
  Business,
  BusinessSummary,
  Category,
  Counterparty,
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
  let q = supabase.from("lap68_counterparties").select("*").eq("user_id", userId).order("name")
  if (businessId) q = q.eq("business_id", businessId)
  const { data, error } = await q
  if (error) throw error
  return (data || []) as Counterparty[]
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
export async function fetchAccessLogs(limit = 100) {
  const { data, error } = await supabase
    .from("lap68_access_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data || []) as AccessLog[]
}

export async function insertAccessLog(log: Omit<AccessLog, "id" | "created_at">) {
  const { error } = await supabase.from("lap68_access_logs").insert(log)
  if (error) throw error
}

export async function exportUserData(userId: string) {
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
