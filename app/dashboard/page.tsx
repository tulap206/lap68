"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Plus, LayoutGrid, Landmark, SlidersHorizontal, TrendingUp, TrendingDown, PiggyBank, BarChart3 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { ModulePageShell, ModuleBrandHeader, ModuleKpiCard, AccentButton } from "@/components/dashboard/module-shell"
import { BusinessHubCard } from "@/components/dashboard/business-hub-card"
import { ReminderPanel } from "@/components/dashboard/reminder-panel"
import { CashflowReportsSection } from "@/components/dashboard/cashflow-reports-section"
import { CapitalAdjustDialog } from "@/components/dashboard/capital-adjust-dialog"
import { CapitalOverviewCard } from "@/components/dashboard/capital-overview-card"
import { SkeletonMetricCards } from "@/components/ui/skeleton-loader"
import {
  fetchBusinessSummaries,
  fetchBusinesses,
  fetchSchedules,
  fetchTransactions,
  subscribeLap68Tables,
  syncScheduleStatuses,
} from "@/lib/supabase"
import { buildReminderItems } from "@/lib/schedule-engine"
import { computeCapitalSnapshot, computePortfolioCapital, parseBusinessCapital } from "@/lib/capital"
import type { Business, BusinessSummary, Schedule, Transaction } from "@/lib/types"
import { displayMoney } from "@/lib/format-money"

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
      <h2 className="text-base sm:text-lg font-bold text-zinc-100">{children}</h2>
      {action}
    </div>
  )
}

export default function DashboardHubPage() {
  const { user } = useAuth()
  const [summaries, setSummaries] = useState<BusinessSummary[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [capitalOpen, setCapitalOpen] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    try {
      await syncScheduleStatuses(user.id)
      const [s, biz, txs, sch] = await Promise.all([
        fetchBusinessSummaries(user.id),
        fetchBusinesses(user.id),
        fetchTransactions(user.id),
        fetchSchedules(user.id),
      ])
      setSummaries(s)
      setBusinesses(biz)
      setTransactions(txs)
      setSchedules(sch)
    } catch {
      toast.error("Không tải được dữ liệu")
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!user) return
    return subscribeLap68Tables(user.id, load)
  }, [user, load])

  const reminders = useMemo(() => buildReminderItems(schedules), [schedules])
  const overdueByBusiness = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of schedules) {
      if (s.status === "overdue" || buildReminderItems([s])[0]?.urgency === "overdue") {
        map.set(s.business_id, (map.get(s.business_id) || 0) + 1)
      }
    }
    return map
  }, [schedules])

  const portfolio = useMemo(() => {
    const income = transactions.filter((t) => t.type === "income").reduce((a, t) => a + t.amount, 0)
    const expense = transactions.filter((t) => t.type === "expense").reduce((a, t) => a + t.amount, 0)
    const margin = income > 0 ? ((income - expense) / income) * 100 : 0
    return { income, expense, profit: income - expense, margin }
  }, [transactions])

  const capitalSnapshot = useMemo(
    () => computePortfolioCapital(businesses, summaries),
    [businesses, summaries]
  )

  const capitalByBusiness = useMemo(() => {
    const map = new Map<string, ReturnType<typeof computeCapitalSnapshot>>()
    for (const s of summaries) {
      const b = businesses.find((x) => x.id === s.business_id)
      if (!b) continue
      map.set(s.business_id, computeCapitalSnapshot(parseBusinessCapital(b.ghi_chu), Number(s.net_profit)))
    }
    return map
  }, [summaries, businesses])

  return (
    <ModulePageShell module="cashflow">
      <div className="space-y-8">
        <ModuleBrandHeader
          module="cashflow"
          subtitle="Tổng quan thu chi, vốn và phân tích toàn bộ việc kinh doanh"
          actions={
            <div className="flex flex-wrap gap-2">
              <AccentButton module="cashflow" type="button" onClick={() => setCapitalOpen(true)}>
                <SlidersHorizontal className="h-4 w-4" /> Tinh chỉnh vốn
              </AccentButton>
              <Link href="/dashboard/businesses">
                <AccentButton module="cashflow" type="button">
                  <LayoutGrid className="h-4 w-4" /> Quản lý việc
                </AccentButton>
              </Link>
            </div>
          }
        />

        {/* 1. Chỉ số tài chính */}
        <section>
          <SectionTitle>Chỉ số tài chính</SectionTitle>
          {loading ? (
            <SkeletonMetricCards />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
              <ModuleKpiCard module="cashflow" label="Tổng thu" value={displayMoney(portfolio.income)} icon={<TrendingUp className="h-5 w-5" />} tone="income" />
              <ModuleKpiCard module="cashflow" label="Tổng chi" value={displayMoney(portfolio.expense)} icon={<TrendingDown className="h-5 w-5" />} tone="expense" />
              <ModuleKpiCard module="cashflow" label="Lợi nhuận" value={displayMoney(portfolio.profit)} icon={<PiggyBank className="h-5 w-5" />} tone="profit" />
              <ModuleKpiCard module="cashflow" label="Tỷ suất LN" value={`${portfolio.margin.toFixed(1)}%`} icon={<BarChart3 className="h-5 w-5" />} tone="neutral" />
              <ModuleKpiCard
                module="cashflow"
                label="Vốn hiện tại"
                value={displayMoney(capitalSnapshot.available_capital)}
                icon={<Landmark className="h-5 w-5" />}
                tone="profit"
                onClick={() => setCapitalOpen(true)}
              />
              <ModuleKpiCard module="cashflow" label="Việc KD" value={String(summaries.length)} icon={<LayoutGrid className="h-5 w-5" />} tone="neutral" />
            </div>
          )}
        </section>

        {/* 2. Vốn + nhắc hẹn (ưu tiên hành động) */}
        {!loading && (
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {summaries.length > 0 && <CapitalOverviewCard snapshot={capitalSnapshot} compact />}
            <div className={summaries.length === 0 ? "xl:col-span-2" : ""}>
              <SectionTitle
                action={<Link href="/dashboard/reminders" className="text-xs text-zinc-500 hover:text-green-400">Xem tất cả</Link>}
              >
                Nhắc hẹn sắp tới
              </SectionTitle>
              <ReminderPanel items={reminders.slice(0, 5)} compact />
            </div>
          </section>
        )}

        {/* 3. Việc kinh doanh */}
        <section>
          <SectionTitle
            action={
              <Link href="/dashboard/businesses" className="text-xs text-green-400 hover:underline flex items-center gap-1">
                <Plus className="h-3 w-3" /> Thêm việc
              </Link>
            }
          >
            Việc kinh doanh
          </SectionTitle>
          {loading ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-40 rounded-xl bg-zinc-800/50 animate-pulse" />)}
            </div>
          ) : summaries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-700 p-8 text-center">
              <p className="text-zinc-500 mb-3">Chưa có việc kinh doanh</p>
              <Link href="/dashboard/businesses"><AccentButton module="cashflow">Tạo việc đầu tiên</AccentButton></Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {summaries.map((s, i) => (
                <BusinessHubCard
                  key={s.business_id}
                  summary={s}
                  capital={capitalByBusiness.get(s.business_id)}
                  overdueCount={overdueByBusiness.get(s.business_id) || 0}
                  delay={i * 60}
                />
              ))}
            </div>
          )}
        </section>

        {/* 4. Báo cáo & phân tích */}
        {!loading && transactions.length > 0 && (
          <section id="bao-cao">
            <SectionTitle>Báo cáo & phân tích</SectionTitle>
            <p className="text-xs text-zinc-500 mb-4 -mt-1">Dòng tiền, cơ cấu thu chi và so sánh giữa các việc kinh doanh</p>
            <CashflowReportsSection transactions={transactions} summaries={summaries} />
          </section>
        )}
      </div>

      <CapitalAdjustDialog open={capitalOpen} onOpenChange={setCapitalOpen} businesses={businesses} onSuccess={load} />
    </ModulePageShell>
  )
}
