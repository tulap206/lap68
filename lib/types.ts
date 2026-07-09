export type TransactionType = "income" | "expense"
export type PaymentMethod = "cash" | "bank" | "card" | "other"
export type BusinessStatus = "active" | "paused" | "archived"
export type ScheduleDirection = "collect" | "pay"
export type ScheduleKind = "once" | "recurring"
export type ScheduleStatus = "pending" | "done" | "skipped" | "overdue" | "cancelled"
export type CounterpartyRole = "customer" | "supplier" | "both"

export interface AuthUser {
  id: string
  username: string
  password: string
  display_name: string
  role: "admin" | "staff"
  created_at: string
}

export interface Business {
  id: string
  user_id: string
  name: string
  code: string | null
  color: string
  icon: string
  description: string | null
  status: BusinessStatus
  sort_order: number
  ghi_chu: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface BusinessSummary {
  business_id: string
  user_id: string
  business_name: string
  color: string
  status: BusinessStatus
  total_income: number
  total_expense: number
  net_profit: number
  transaction_count: number
}

export interface Category {
  id: string
  user_id: string
  business_id: string | null
  name: string
  type: TransactionType
  color: string
  icon: string
  created_at: string
}

export interface Counterparty {
  id: string
  user_id: string
  business_id: string | null
  name: string
  phone: string | null
  email: string | null
  role: CounterpartyRole
  ghi_chu: Record<string, unknown>
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  business_id: string | null
  type: TransactionType
  amount: number
  category_id: string | null
  counterparty_id: string | null
  schedule_id: string | null
  description: string | null
  transaction_date: string
  payment_method: PaymentMethod
  ghi_chu: Record<string, unknown>
  created_at: string
  category?: Category | null
  counterparty?: Counterparty | null
  business?: Business | null
}

export interface ScheduleRecurrence {
  frequency?: "daily" | "weekly" | "monthly" | "yearly"
  interval?: number
  day_of_month?: number
  day_of_week?: number
  end_date?: string
}

export interface Schedule {
  id: string
  user_id: string
  business_id: string
  counterparty_id: string | null
  category_id: string | null
  direction: ScheduleDirection
  title: string
  description: string | null
  amount: number | null
  amount_is_estimate: boolean
  schedule_kind: ScheduleKind
  due_date: string
  next_due_date: string | null
  recurrence: ScheduleRecurrence
  reminder_days: number[]
  status: ScheduleStatus
  linked_transaction_id: string | null
  completed_at: string | null
  ghi_chu: Record<string, unknown>
  created_at: string
  updated_at: string
  business?: Business | null
  category?: Category | null
  counterparty?: Counterparty | null
}

export interface Budget {
  id: string
  user_id: string
  business_id: string
  month_key: string
  planned_income: number
  planned_expense: number
  ghi_chu: Record<string, unknown>
  created_at: string
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

export interface ReminderItem {
  schedule: Schedule
  dueDate: string
  daysUntil: number
  urgency: "overdue" | "today" | "soon" | "upcoming"
}

export interface ExportUserData {
  businesses: Business[]
  categories: Category[]
  transactions: Transaction[]
  schedules: Schedule[]
  counterparties: Counterparty[]
  budgets: Budget[]
  exportedAt: string
}

export interface Lap68Backup {
  id: string
  user_id: string
  file_path: string
  file_size: number | null
  tables_included: string[]
  label: string | null
  snapshot: ExportUserData | null
  created_at: string
}
