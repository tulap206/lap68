"use client"

import { MonthlyCashflowChart, CategoryPieChart, ProfitTrendChart } from "@/components/dashboard/cashflow-charts"
import { BusinessComparisonChart } from "@/components/dashboard/business-comparison-chart"
import type { BusinessSummary, Transaction } from "@/lib/types"

export function CashflowReportsSection({
  transactions,
  summaries,
  showComparison = true,
}: {
  transactions: Transaction[]
  summaries?: BusinessSummary[]
  showComparison?: boolean
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <MonthlyCashflowChart transactions={transactions} />
        <ProfitTrendChart transactions={transactions} />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <CategoryPieChart transactions={transactions} type="income" />
        <CategoryPieChart transactions={transactions} type="expense" />
      </div>
      {showComparison && summaries && summaries.length > 0 && (
        <BusinessComparisonChart summaries={summaries} />
      )}
    </div>
  )
}
