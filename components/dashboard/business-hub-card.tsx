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
        "metric-card card-animate group relative block rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-card/90 dark:bg-card/95 backdrop-blur-xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)] active:scale-[0.98] transition-all duration-200",
      )}
      style={{
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span
              className="w-3 h-3 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: summary.color || "#007aff" }}
            />
            <h3 className="text-base font-bold text-foreground tracking-tight truncate group-hover:text-[#007aff] transition-colors">
              {summary.business_name}
            </h3>
          </div>
          <p className="text-[11px] font-medium text-muted-foreground mt-0.5 ml-5.5">
            {statusLabel}
          </p>
        </div>
        {overdueCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#ff3b30]/10 border border-[#ff3b30]/20 px-2.5 py-0.5 text-xs font-semibold text-[#ff3b30] shrink-0">
            <AlertTriangle className="h-3 w-3" />
            {overdueCount} quá hạn
          </span>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06]">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Thu
          </p>
          <p className="text-xs sm:text-sm font-mono font-semibold text-[#34c759] tabular-nums mt-0.5">
            {displayMoney(income)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Chi
          </p>
          <p className="text-xs sm:text-sm font-mono font-semibold text-[#ff3b30] tabular-nums mt-0.5">
            {displayMoney(expense)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            Lãi {isProfit ? <TrendingUp className="h-2.5 w-2.5 text-[#34c759]" /> : <TrendingDown className="h-2.5 w-2.5 text-[#ff3b30]" />}
          </p>
          <p
            className={cn(
              "text-xs sm:text-sm font-mono font-semibold tabular-nums mt-0.5",
              isProfit ? "text-[#34c759]" : "text-[#ff3b30]",
            )}
          >
            {displayMoney(profit)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Vốn
          </p>
          <p className="text-xs sm:text-sm font-mono font-semibold text-foreground/90 tabular-nums mt-0.5">
            {capital ? displayMoney(capital.base_capital) : "—"}
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between mt-3.5 pt-2.5 border-t border-black/[0.04] dark:border-white/[0.06] text-xs">
        <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
          <span>{summary.transaction_count} giao dịch</span>
          <span>•</span>
          <span>Tỷ suất: <strong className={isProfit ? "text-[#34c759]" : "text-[#ff3b30]"}>{margin.toFixed(1)}%</strong></span>
        </div>
        <span className="text-xs font-semibold text-[#007aff] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
          Chi tiết <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}

