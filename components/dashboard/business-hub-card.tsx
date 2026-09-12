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
        "metric-card card-animate group relative block rounded-2xl border border-border bg-card p-5 hover:border-foreground/25 hover:shadow-md transition-all duration-200",
      )}
      style={{
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Top accent border */}
      <div
        className="absolute top-0 inset-x-0 h-1 rounded-t-2xl"
        style={{ backgroundColor: summary.color || "var(--primary)" }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: summary.color || "currentColor" }}
            />
            <h3 className="text-base font-bold text-foreground truncate group-hover:text-income transition-colors">
              {summary.business_name}
            </h3>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 ml-4.5">
            {statusLabel}
          </p>
        </div>
        {overdueCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-expense shrink-0">
            <AlertTriangle className="h-3 w-3" />
            {overdueCount} quá hạn
          </span>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 p-3 rounded-xl bg-muted/40 border border-border/50">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Thu
          </p>
          <p className="text-xs sm:text-sm font-mono font-semibold text-income tabular-nums mt-0.5">
            {displayMoney(income)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Chi
          </p>
          <p className="text-xs sm:text-sm font-mono font-semibold text-expense tabular-nums mt-0.5">
            {displayMoney(expense)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            Lãi {isProfit ? <TrendingUp className="h-2.5 w-2.5 text-income" /> : <TrendingDown className="h-2.5 w-2.5 text-expense" />}
          </p>
          <p
            className={cn(
              "text-xs sm:text-sm font-mono font-semibold tabular-nums mt-0.5",
              isProfit ? "text-income" : "text-expense",
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
      <div className="flex items-center justify-between mt-3.5 pt-2.5 border-t border-border/60 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>{summary.transaction_count} giao dịch</span>
          <span>•</span>
          <span className="font-mono">Tỷ suất: <strong className={isProfit ? "text-income" : "text-expense"}>{margin.toFixed(1)}%</strong></span>
        </div>
        <span className="text-xs font-medium text-income flex items-center gap-1 opacity-90 group-hover:translate-x-0.5 transition-transform">
          Chi tiết <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}
