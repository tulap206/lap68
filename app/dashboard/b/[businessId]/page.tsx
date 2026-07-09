"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Plus, TrendingUp, TrendingDown, Wallet, PiggyBank, CalendarClock } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import {
  ModulePageShell,
  ModuleSubpageHeader,
  ModuleSectionCard,
  ModuleKpiCard,
  ModuleResponsiveTable,
  AccentButton,
} from "@/components/dashboard/module-shell"
import { MonthlyCashflowChart, CategoryPieChart } from "@/components/dashboard/cashflow-charts"
import { TransactionTypeBadge, PaymentMethodLabel } from "@/components/dashboard/cashflow-ui"
import { ReminderPanel } from "@/components/dashboard/reminder-panel"
import { SkeletonMetricCards } from "@/components/ui/skeleton-loader"
import {
  fetchBusiness,
  fetchTransactions,
  fetchSchedules,
  subscribeLap68Tables,
  syncScheduleStatuses,
} from "@/lib/supabase"
import { buildReminderItems } from "@/lib/schedule-engine"
import { displayMoney } from "@/lib/format-money"
import { formatDisplayDate } from "@/lib/format-date"
import type { Business, Schedule, Transaction } from "@/lib/types"

export default function BusinessDashboardPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const businessId = params.businessId as string
  const [business, setBusiness] = useState<Business | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    try {
      await syncScheduleStatuses(user.id)
      const [b, txs, sch] = await Promise.all([
        fetchBusiness(businessId),
        fetchTransactions(user.id, businessId),
        fetchSchedules(user.id, businessId),
      ])
      setBusiness(b)
      setTransactions(txs)
      setSchedules(sch)
    } catch {
      toast.error("Không tải được dữ liệu")
    } finally {
      setLoading(false)
    }
  }, [user, businessId])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!user) return
    return subscribeLap68Tables(user.id, load)
  }, [user, load])

  const stats = useMemo(() => {
    const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
    const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)
    return { income, expense, profit: income - expense, count: transactions.length }
  }, [transactions])

  const reminders = useMemo(() => buildReminderItems(schedules), [schedules])
  const recent = transactions.slice(0, 6)

  if (!business && !loading) return null

  return (
    <ModulePageShell module="cashflow">
      <ModuleSubpageHeader
        module="cashflow"
        title={business?.name || "..."}
        subtitle={business?.description || "Tổng quan dòng tiền việc kinh doanh"}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={`/dashboard/b/${businessId}/schedules`}>
              <AccentButton module="cashflow" type="button"><CalendarClock className="h-4 w-4" /> Lịch thu/chi</AccentButton>
            </Link>
            <Link href={`/dashboard/b/${businessId}/transactions`}>
              <AccentButton module="cashflow" type="button"><Plus className="h-4 w-4" /> Giao dịch</AccentButton>
            </Link>
          </div>
        }
      />

      {loading ? <SkeletonMetricCards /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <ModuleKpiCard module="cashflow" label="Tổng thu" value={displayMoney(stats.income)} icon={<TrendingUp className="h-5 w-5" />} tone="income" onClick={() => router.push(`/dashboard/b/${businessId}/transactions?type=income`)} />
          <ModuleKpiCard module="cashflow" label="Tổng chi" value={displayMoney(stats.expense)} icon={<TrendingDown className="h-5 w-5" />} tone="expense" onClick={() => router.push(`/dashboard/b/${businessId}/transactions?type=expense`)} />
          <ModuleKpiCard module="cashflow" label="Lợi nhuận" value={displayMoney(stats.profit)} icon={<PiggyBank className="h-5 w-5" />} tone="profit" />
          <ModuleKpiCard module="cashflow" label="Giao dịch" value={String(stats.count)} icon={<Wallet className="h-5 w-5" />} tone="neutral" />
        </div>
      )}

      {reminders.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-zinc-300 mb-2">Nhắc hẹn việc này</h3>
          <ReminderPanel items={reminders.slice(0, 3)} compact />
        </div>
      )}

      <div className="grid xl:grid-cols-2 gap-4">
        <MonthlyCashflowChart transactions={transactions} />
        <CategoryPieChart transactions={transactions} type="expense" />
      </div>

      <ModuleSectionCard title="Giao dịch gần đây">
        <ModuleResponsiveTable
          headers={["Ngày", "Loại", "Mô tả", "Số tiền"]}
          rows={recent.map((t) => [
            formatDisplayDate(t.transaction_date),
            <TransactionTypeBadge key="t" type={t.type} />,
            t.description || "—",
            <span key="a" className={t.type === "income" ? "text-income font-mono" : "text-expense font-mono"}>
              {t.type === "income" ? "+" : "-"}{displayMoney(t.amount)}
            </span>,
          ])}
        />
      </ModuleSectionCard>
    </ModulePageShell>
  )
}
