import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type TransactionType = "income" | "expense"
export type PaymentMethod = "cash" | "bank" | "card" | "other"

export interface AuthUser {
  id: string
  username: string
  password: string
  display_name: string
  role: "admin" | "staff"
  created_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  type: TransactionType
  color: string
  icon: string
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  category_id: string | null
  description: string | null
  transaction_date: string
  payment_method: PaymentMethod
  ghi_chu: Record<string, unknown>
  created_at: string
  category?: Category | null
}

export interface AccessLog {
  id: string
  user_id: string | null
  username: string | null
  display_name: string | null
  action: string
  module: string
  details: string | null
  ip_address: string | null
  created_at: string
}

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

export async function fetchCategories(userId: string) {
  const { data, error } = await supabase
    .from("lap68_categories")
    .select("*")
    .eq("user_id", userId)
    .order("name")

  if (error) throw error
  return (data || []) as Category[]
}

export async function insertCategory(category: Omit<Category, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("lap68_categories")
    .insert(category)
    .select()
    .single()

  if (error) throw error
  return data as Category
}

export async function updateCategory(id: string, updates: Partial<Category>) {
  const { data, error } = await supabase
    .from("lap68_categories")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Category
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from("lap68_categories").delete().eq("id", id)
  if (error) throw error
}

export async function fetchTransactions(userId: string) {
  const { data, error } = await supabase
    .from("lap68_transactions")
    .select("*, category:lap68_categories(*)")
    .eq("user_id", userId)
    .order("transaction_date", { ascending: false })

  if (error) throw error
  return (data || []) as Transaction[]
}

export async function insertTransaction(
  transaction: Omit<Transaction, "id" | "created_at" | "category">
) {
  const { data, error } = await supabase
    .from("lap68_transactions")
    .insert(transaction)
    .select("*, category:lap68_categories(*)")
    .single()

  if (error) throw error
  return data as Transaction
}

export async function updateTransaction(
  id: string,
  updates: Partial<Omit<Transaction, "category">>
) {
  const { data, error } = await supabase
    .from("lap68_transactions")
    .update(updates)
    .eq("id", id)
    .select("*, category:lap68_categories(*)")
    .single()

  if (error) throw error
  return data as Transaction
}

export async function deleteTransaction(id: string) {
  const { error } = await supabase.from("lap68_transactions").delete().eq("id", id)
  if (error) throw error
}

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
  const [categories, transactions] = await Promise.all([
    fetchCategories(userId),
    fetchTransactions(userId),
  ])
  return { categories, transactions, exportedAt: new Date().toISOString() }
}
