"use client"

import { CombinedCashflowPanel, CombinedCategoryPanel } from "@/components/dashboard/cashflow-charts"
import { BusinessComparisonChart } from "@/components/dashboard/business-comparison-chart"
import { cn } from "@/lib/utils"
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
  const hasComparison = showComparison && summaries && summaries.length > 0

  return (
    <div className="space-y-4">
      <CombinedCashflowPanel transactions={transactions} />

      <div
        className={cn(
          "grid gap-4 items-stretch",
          hasComparison ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1"
        )}
      >
        <CombinedCategoryPanel transactions={transactions} summaries={summaries} groupBy="business" />
        {hasComparison && <BusinessComparisonChart summaries={summaries} className="h-full min-h-0" />}
      </div>
    </div>
  )
}
