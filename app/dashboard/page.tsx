"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Plus, LayoutGrid, Landmark, SlidersHorizontal } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { ModulePageShell, ModuleBrandHeader, AccentButton } from "@/components/dashboard/module-shell"
import { BusinessHubCard } from "@/components/dashboard/business-hub-card"
import { ReminderPanel } from "@/components/dashboard/reminder-panel"
import { BusinessComparisonChart } from "@/components/dashboard/business-comparison-chart"
import { CapitalAdjustDialog } from "@/components/dashboard/capital-adjust-dialog"
import { CapitalOverviewCard } from "@/components/dashboard/capital-overview-card"
import { SkeletonMetricCards } from "@/components/ui/skeleton-loader"
import {
  fetchBusinessSummaries,
  fetchBusinesses,
  fetchSchedules,
  subscribeLap68Tables,
  syncScheduleStatuses,
} from "@/lib/supabase"
import { buildReminderItems } from "@/lib/schedule-engine"
import { computeCapitalSnapshot, computePortfolioCapital, parseBusinessCapital } from "@/lib/capital"
import type { Business, BusinessSummary, Schedule } from "@/lib/types"
import { displayMoney } from "@/lib/format-money"

export default function DashboardHubPage() {
  const { user } = useAuth()
  const [summaries, setSummaries] = useState<BusinessSummary[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [capitalOpen, setCapitalOpen] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    try {
      await syncScheduleStatuses(user.id)
      const [s, biz, sch] = await Promise.all([
        fetchBusinessSummaries(user.id),
        fetchBusinesses(user.id),
        fetchSchedules(user.id),
      ])
      setSummaries(s)
      setBusinesses(biz)
      setSchedules(sch)
    } catch {
      toast.error("Không tải được dữ liệu")
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    load()
  }, [load])

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
    const income = summaries.reduce((a, s) => a + Number(s.total_income), 0)
    const expense = summaries.reduce((a, s) => a + Number(s.total_expense), 0)
    return { income, expense, profit: income - expense }
  }, [summaries])

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
      <ModuleBrandHeader
        module="cashflow"
        subtitle="Quản lý đa dòng tiền — chọn việc kinh doanh để vào chi tiết"
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

      {loading ? (
        <SkeletonMetricCards />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="rounded-xl border border-zinc-800 bg-card/90 p-4">
            <p className="text-xs uppercase text-zinc-500">Tổng thu</p>
            <p className="text-xl font-black font-mono text-income">{displayMoney(portfolio.income)}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-card/90 p-4">
            <p className="text-xs uppercase text-zinc-500">Tổng chi</p>
            <p className="text-xl font-black font-mono text-expense">{displayMoney(portfolio.expense)}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-card/90 p-4">
            <p className="text-xs uppercase text-zinc-500">Lợi nhuận</p>
            <p className="text-xl font-black font-mono text-zinc-100">{displayMoney(portfolio.profit)}</p>
          </div>
          <div className="rounded-xl border border-green-500/20 bg-card/90 p-4 col-span-2 lg:col-span-1">
            <p className="text-xs uppercase text-zinc-500 flex items-center gap-1">
              <Landmark className="h-3 w-3" /> Vốn hiện tại
            </p>
            <p className="text-xl font-black font-mono text-green-400">{displayMoney(capitalSnapshot.available_capital)}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-card/90 p-4 col-span-2 lg:col-span-1">
            <p className="text-xs uppercase text-zinc-500">Việc KD</p>
            <p className="text-xl font-black text-zinc-100">{summaries.length}</p>
          </div>
        </div>
      )}

      {!loading && summaries.length > 0 && (
        <CapitalOverviewCard snapshot={capitalSnapshot} />
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-zinc-100">Việc kinh doanh</h2>
          <Link href="/dashboard/businesses" className="text-xs text-green-400 hover:underline flex items-center gap-1">
            <Plus className="h-3 w-3" /> Thêm việc
          </Link>
        </div>
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
      </div>

      <div className="grid xl:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-zinc-100">Nhắc hẹn sắp tới</h2>
            <Link href="/dashboard/reminders" className="text-xs text-zinc-500 hover:text-green-400">Xem tất cả</Link>
          </div>
          <ReminderPanel items={reminders.slice(0, 5)} compact />
        </div>
        <BusinessComparisonChart summaries={summaries} />
      </div>

      <CapitalAdjustDialog
        open={capitalOpen}
        onOpenChange={setCapitalOpen}
        businesses={businesses}
        onSuccess={load}
      />
    </ModulePageShell>
  )
}
