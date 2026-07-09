"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { ModulePageShell, ModuleSubpageHeader, ModuleKpiCard } from "@/components/dashboard/module-shell"
import { MonthlyCashflowChart, CategoryPieChart, ProfitTrendChart } from "@/components/dashboard/cashflow-charts"
import { fetchTransactions, type Transaction } from "@/lib/supabase"
import { displayMoney } from "@/lib/format-money"
import { SkeletonMetricCards } from "@/components/ui/skeleton-loader"
import { TrendingUp, TrendingDown, PiggyBank, BarChart3 } from "lucide-react"
import { toast } from "sonner"

export default function ReportsPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!user) return
    try {
      setTransactions(await fetchTransactions(user.id))
    } catch {
      toast.error("Không tải được báo cáo")
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { loadData() }, [loadData])

  const stats = useMemo(() => {
    const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
    const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)
    const margin = income > 0 ? ((income - expense) / income) * 100 : 0
    return { income, expense, profit: income - expense, margin }
  }, [transactions])

  return (
    <ModulePageShell module="cashflow">
      <ModuleSubpageHeader module="cashflow" title="Báo cáo tài chính" subtitle="Phân tích thu chi và xu hướng dòng tiền" />

      {loading ? (
        <SkeletonMetricCards />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <ModuleKpiCard module="cashflow" label="Tổng thu" value={displayMoney(stats.income)} icon={<TrendingUp className="h-5 w-5" />} />
          <ModuleKpiCard module="cashflow" label="Tổng chi" value={displayMoney(stats.expense)} icon={<TrendingDown className="h-5 w-5" />} />
          <ModuleKpiCard module="cashflow" label="Lợi nhuận ròng" value={displayMoney(stats.profit)} icon={<PiggyBank className="h-5 w-5" />} />
          <ModuleKpiCard module="cashflow" label="Tỷ suất lợi nhuận" value={`${stats.margin.toFixed(1)}%`} icon={<BarChart3 className="h-5 w-5" />} />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <MonthlyCashflowChart transactions={transactions} />
        <ProfitTrendChart transactions={transactions} />
        <CategoryPieChart transactions={transactions} type="income" />
        <CategoryPieChart transactions={transactions} type="expense" />
      </div>
    </ModulePageShell>
  )
}
