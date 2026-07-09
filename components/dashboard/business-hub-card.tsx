"use client"

import Link from "next/link"
import { ArrowRight, AlertTriangle } from "lucide-react"
import { displayMoney } from "@/lib/format-money"
import type { BusinessSummary } from "@/lib/types"
import type { CapitalSnapshot } from "@/lib/capital"
import { cn } from "@/lib/utils"

export function BusinessHubCard({
  summary,
  capital,
  overdueCount = 0,
  delay = 0,
}: {
  summary: BusinessSummary
  capital?: CapitalSnapshot
  overdueCount?: number
  delay?: number
}) {
  return (
    <Link
      href={`/dashboard/b/${summary.business_id}`}
      className={cn(
        "metric-card card-animate group block rounded-xl border border-zinc-800 bg-card/90 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.35)] hover:border-zinc-600 transition-all",
      )}
      style={{ animationDelay: `${delay}ms`, borderTopColor: summary.color, borderTopWidth: 3 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-zinc-100 truncate">{summary.business_name}</h3>
          <p className="text-xs text-zinc-500 mt-0.5 uppercase tracking-wider">{summary.status}</p>
        </div>
        {overdueCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-400">
            <AlertTriangle className="h-3 w-3" />
            {overdueCount}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Thu</p>
          <p className="text-sm font-mono font-semibold text-income tabular-nums">{displayMoney(Number(summary.total_income))}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Chi</p>
          <p className="text-sm font-mono font-semibold text-expense tabular-nums">{displayMoney(Number(summary.total_expense))}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Lãi</p>
          <p className="text-sm font-mono font-semibold text-zinc-100 tabular-nums">{displayMoney(Number(summary.net_profit))}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Vốn</p>
          <p className="text-sm font-mono font-semibold text-green-400 tabular-nums">
            {capital ? displayMoney(capital.available_capital) : "—"}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800">
        <span className="text-xs text-zinc-500">{summary.transaction_count} giao dịch</span>
        <span className="text-xs text-green-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          Mở <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  )
}
