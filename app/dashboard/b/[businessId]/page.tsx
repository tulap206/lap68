"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Plus, TrendingUp, TrendingDown, PiggyBank, CalendarClock, Landmark, SlidersHorizontal, BarChart3 } from "lucide-react"
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
import { MonthlyCashflowChart, CategoryPieChart, ProfitTrendChart } from "@/components/dashboard/cashflow-charts"
import { TransactionTypeBadge, PaymentMethodLabel } from "@/components/dashboard/cashflow-ui"
import { ReminderPanel } from "@/components/dashboard/reminder-panel"
import { CapitalAdjustDialog } from "@/components/dashboard/capital-adjust-dialog"
import { CapitalOverviewCard } from "@/components/dashboard/capital-overview-card"
import { SkeletonMetricCards } from "@/components/ui/skeleton-loader"
import {
  fetchBusiness,
  fetchBusinesses,
  fetchTransactions,
  fetchSchedules,
  subscribeLap68Tables,
  syncScheduleStatuses,
} from "@/lib/supabase"
import { buildReminderItems } from "@/lib/schedule-engine"
import { computeCapitalSnapshot, parseBusinessCapital, capitalAdjustLabel } from "@/lib/capital"
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
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [capitalOpen, setCapitalOpen] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    try {
      await syncScheduleStatuses(user.id)
      const [b, txs, sch, biz] = await Promise.all([
        fetchBusiness(businessId),
        fetchTransactions(user.id, businessId),
        fetchSchedules(user.id, businessId),
        fetchBusinesses(user.id),
      ])
      setBusiness(b)
      setTransactions(txs)
      setSchedules(sch)
      setAllBusinesses(biz)
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
    const margin = income > 0 ? ((income - expense) / income) * 100 : 0
    return { income, expense, profit: income - expense, margin, count: transactions.length }
  }, [transactions])

  const reminders = useMemo(() => buildReminderItems(schedules), [schedules])
  const recent = transactions.slice(0, 6)

  const capitalSnapshot = useMemo(() => {
    if (!business) return null
    const meta = parseBusinessCapital(business.ghi_chu)
    return computeCapitalSnapshot(meta, stats.profit)
  }, [business, stats.profit])

  const capitalLedger = useMemo(() => {
    if (!business) return []
    return [...parseBusinessCapital(business.ghi_chu).capital_ledger].reverse().slice(0, 5)
  }, [business])

  if (!business && !loading) return null

  return (
    <ModulePageShell module="cashflow">
      <ModuleSubpageHeader
        module="cashflow"
        title={business?.name || "..."}
        subtitle={business?.description || "Tổng quan dòng tiền việc kinh doanh"}
        actions={
          <div className="flex flex-wrap gap-2">
            <AccentButton module="cashflow" type="button" onClick={() => setCapitalOpen(true)}>
              <SlidersHorizontal className="h-4 w-4" /> Tinh chỉnh vốn
            </AccentButton>
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
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <ModuleKpiCard module="cashflow" label="Tổng thu" value={displayMoney(stats.income)} icon={<TrendingUp className="h-5 w-5" />} tone="income" onClick={() => router.push(`/dashboard/b/${businessId}/transactions?type=income`)} />
          <ModuleKpiCard module="cashflow" label="Tổng chi" value={displayMoney(stats.expense)} icon={<TrendingDown className="h-5 w-5" />} tone="expense" onClick={() => router.push(`/dashboard/b/${businessId}/transactions?type=expense`)} />
          <ModuleKpiCard module="cashflow" label="Lợi nhuận" value={displayMoney(stats.profit)} icon={<PiggyBank className="h-5 w-5" />} tone="profit" />
          <ModuleKpiCard module="cashflow" label="Tỷ suất LN" value={`${stats.margin.toFixed(1)}%`} icon={<BarChart3 className="h-5 w-5" />} tone="neutral" />
          <ModuleKpiCard
            module="cashflow"
            label="Vốn hiện tại"
            value={capitalSnapshot ? displayMoney(capitalSnapshot.available_capital) : "—"}
            hint={capitalSnapshot ? `Gốc ${displayMoney(capitalSnapshot.base_capital)}` : undefined}
            icon={<Landmark className="h-5 w-5" />}
            tone="profit"
            onClick={() => setCapitalOpen(true)}
          />
        </div>
      )}

      {capitalSnapshot && <CapitalOverviewCard snapshot={capitalSnapshot} compact />}

      {reminders.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-zinc-300 mb-2">Nhắc hẹn việc này</h3>
          <ReminderPanel items={reminders.slice(0, 3)} compact />
        </div>
      )}

      <div>
        <h3 className="text-sm font-bold text-zinc-300 mb-3">Phân tích dòng tiền</h3>
        <div className="grid xl:grid-cols-2 gap-4">
          <MonthlyCashflowChart transactions={transactions} />
          <ProfitTrendChart transactions={transactions} />
          <CategoryPieChart transactions={transactions} type="income" />
          <CategoryPieChart transactions={transactions} type="expense" />
        </div>
      </div>

      <ModuleSectionCard title="Giao dịch gần đây" description={`${stats.count} giao dịch`}>
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

      {capitalLedger.length > 0 && (
        <ModuleSectionCard title="Điều chỉnh vốn gần đây">
          <div className="divide-y divide-zinc-800">
            {capitalLedger.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className={entry.type === "deposit" ? "text-green-400 font-medium" : "text-red-400 font-medium"}>
                    {capitalAdjustLabel(entry.type)}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">{entry.note || "—"}</p>
                </div>
                <span className="font-mono font-semibold text-zinc-200 tabular-nums shrink-0">
                  {entry.type === "deposit" ? "+" : "-"}{displayMoney(entry.amount)}
                </span>
              </div>
            ))}
          </div>
        </ModuleSectionCard>
      )}

      <CapitalAdjustDialog
        open={capitalOpen}
        onOpenChange={setCapitalOpen}
        businesses={allBusinesses}
        defaultBusinessId={businessId}
        onSuccess={load}
      />
    </ModulePageShell>
  )
}
