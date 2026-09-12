"use client";

import Link from "next/link";
import { ArrowRight, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
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
  const income = Number(summary.total_income) || 0;
  const expense = Number(summary.total_expense) || 0;
  const profit = Number(summary.net_profit) || 0;
  const margin = income > 0 ? (profit / income) * 100 : 0;
  const isProfit = profit >= 0;

  const statusLabel =
    summary.status === "active"
      ? "Hoạt động"
      : summary.status === "paused"
        ? "Tạm dừng"
        : summary.status === "archived"
          ? "Đã lưu trữ"
          : summary.status;

  return (
    <Link
      href={`/dashboard/b/${summary.business_id}`}
      className={cn(
        "metric-card card-animate group relative block rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card p-5 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-[0.98] transition-all duration-150",
      )}
      style={{
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: summary.color || "#18181b" }}
            />
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight truncate group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
              {summary.business_name}
            </h3>
          </div>
          <p className="text-[11px] font-medium text-zinc-500 mt-0.5 ml-5">
            {statusLabel}
          </p>
        </div>
        {overdueCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/60 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:text-rose-400 shrink-0">
            <AlertTriangle className="h-3 w-3" />
            {overdueCount} quá hạn
          </span>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/80">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Thu
          </p>
          <p className="text-xs sm:text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums mt-0.5">
            {displayMoney(income)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Chi
          </p>
          <p className="text-xs sm:text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums mt-0.5">
            {displayMoney(expense)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
            Lãi {isProfit ? <TrendingUp className="h-2.5 w-2.5 text-emerald-600" /> : <TrendingDown className="h-2.5 w-2.5 text-rose-600" />}
          </p>
          <p
            className={cn(
              "text-xs sm:text-sm font-mono font-bold tabular-nums mt-0.5",
              isProfit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
            )}
          >
            {displayMoney(profit)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Vốn
          </p>
          <p className="text-xs sm:text-sm font-mono font-bold text-zinc-700 dark:text-zinc-300 tabular-nums mt-0.5">
            {capital ? displayMoney(capital.base_capital) : "—"}
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between mt-3.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
        <div className="flex items-center gap-2 text-zinc-500 text-[11px]">
          <span>{summary.transaction_count} giao dịch</span>
          <span>•</span>
          <span>Tỷ suất: <strong className={isProfit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>{margin.toFixed(1)}%</strong></span>
        </div>
        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
          Chi tiết <ArrowRight className="h-3 w-3 text-zinc-500 group-hover:text-zinc-900" />
        </span>
      </div>
    </Link>
  );
}


