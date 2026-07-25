"use client";

import Link from "next/link";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { displayMoney } from "@/lib/format-money";
import type { BusinessSummary } from "@/lib/types";
import type { CapitalSnapshot } from "@/lib/capital";
import { cn } from "@/lib/utils";

export function BusinessHubCard({
  summary,
  capital,
  overdueCount = 0,
  delay = 0,
}: {
  summary: BusinessSummary;
  capital?: CapitalSnapshot;
  overdueCount?: number;
  delay?: number;
}) {
  return (
    <Link
      href={`/dashboard/b/${summary.business_id}`}
      className={cn(
        "metric-card card-animate group block rounded-xl border border-border bg-card p-5 hover:border-foreground/20 transition-all",
      )}
      style={{
        animationDelay: `${delay}ms`,
        borderTopColor: summary.color,
        borderTopWidth: 3,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-foreground truncate">
            {summary.business_name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wider">
            {summary.status}
          </p>
        </div>
        {overdueCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-md border border-transparent bg-[var(--pale-red)] px-2 py-0.5 text-xs font-semibold text-expense">
            <AlertTriangle className="h-3 w-3" />
            {overdueCount}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Thu
          </p>
          <p className="text-sm font-mono font-semibold text-income tabular-nums">
            {displayMoney(Number(summary.total_income))}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Chi
          </p>
          <p className="text-sm font-mono font-semibold text-expense tabular-nums">
            {displayMoney(Number(summary.total_expense))}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Lãi
          </p>
          <p className="text-sm font-mono font-semibold text-foreground tabular-nums">
            {displayMoney(Number(summary.net_profit))}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Vốn
          </p>
          <p className="text-sm font-mono font-semibold text-income tabular-nums">
            {capital ? displayMoney(capital.base_capital) : "—"}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground">
          {summary.transaction_count} giao dịch
        </span>
        <span className="text-xs text-income flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          Mở <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}
