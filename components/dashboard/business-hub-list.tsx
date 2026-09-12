"use client";

import Link from "next/link";
import { ArrowRight, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { displayMoney } from "@/lib/format-money";
import type { BusinessSummary } from "@/lib/types";
import type { CapitalSnapshot } from "@/lib/capital";
import { cn } from "@/lib/utils";

export function BusinessHubList({
  summaries,
  capitalMap,
  overdueMap,
}: {
  summaries: BusinessSummary[];
  capitalMap: Map<string, CapitalSnapshot>;
  overdueMap: Map<string, number>;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card shadow-xs overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/70">
      {/* DESKTOP HEADER */}
      <div className="hidden md:grid grid-cols-12 gap-4 items-center px-5 py-3 bg-zinc-50/80 dark:bg-zinc-900/50 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="col-span-5">Mảng kinh doanh & Vốn</div>
        <div className="col-span-3 text-right">Dòng tiền (Thu / Chi)</div>
        <div className="col-span-3 text-right">Lợi nhuận ròng & Tỷ suất</div>
        <div className="col-span-1 text-center" aria-label="Chi tiết" />
      </div>

      {/* ROWS */}
      {summaries.map((s) => {
        const income = Number(s.total_income) || 0;
        const expense = Number(s.total_expense) || 0;
        const profit = Number(s.net_profit) || 0;
        const margin = income > 0 ? (profit / income) * 100 : 0;
        const isProfit = profit >= 0;
        const capital = capitalMap.get(s.business_id);
        const overdueCount = overdueMap.get(s.business_id) || 0;
        const hasCapital = capital && capital.base_capital > 0;

        return (
          <div
            key={s.business_id}
            role="button"
            tabIndex={0}
            onClick={() => {
              window.location.href = `/dashboard/b/${s.business_id}`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                window.location.href = `/dashboard/b/${s.business_id}`;
              }
            }}
            className="group p-4 md:px-5 md:py-3.5 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer block"
          >
            {/* DESKTOP LAYOUT (12 COLS) */}
            <div className="hidden md:grid grid-cols-12 gap-4 items-center">
              {/* COL 1: TÊN MẢNG, DOT, VỐN & OVERDUE (5 COLS) */}
              <div className="col-span-5 flex items-center gap-3 min-w-0">
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-xs ring-2 ring-white dark:ring-zinc-900"
                  style={{ backgroundColor: s.color || "#18181b" }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 tracking-tight text-sm truncate group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                      {s.business_name}
                    </span>
                    {overdueCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:text-rose-400 shrink-0">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        {overdueCount} quá hạn
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 whitespace-nowrap">
                    <span>{s.transaction_count} giao dịch</span>
                    {hasCapital && (
                      <>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <span>
                          Vốn: <strong className="font-mono text-zinc-700 dark:text-zinc-300">{displayMoney(capital.base_capital)}</strong>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* COL 2: THU & CHI (3 COLS) */}
              <div className="col-span-3 text-right space-y-0.5 whitespace-nowrap tabular-nums">
                <div className="flex items-center justify-end gap-1.5 text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="text-[10px] uppercase text-zinc-400 font-sans">Thu</span>
                  <span>{income > 0 ? displayMoney(income) : "0 đ"}</span>
                </div>
                <div className="flex items-center justify-end gap-1.5 text-xs font-mono font-medium text-rose-600 dark:text-rose-400">
                  <span className="text-[10px] uppercase text-zinc-400 font-sans">Chi</span>
                  <span>{expense > 0 ? displayMoney(expense) : "0 đ"}</span>
                </div>
              </div>

              {/* COL 3: LỢI NHUẬN RÒNG & TỶ SUẤT (3 COLS) */}
              <div className="col-span-3 text-right space-y-1 whitespace-nowrap tabular-nums">
                <div
                  className={cn(
                    "text-sm font-mono font-bold tracking-tight",
                    isProfit
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400",
                  )}
                >
                  {displayMoney(profit)}
                </div>
                <div className="flex items-center justify-end gap-1">
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                      isProfit
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60"
                        : "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60",
                    )}
                  >
                    {isProfit ? (
                      <TrendingUp className="h-2.5 w-2.5" />
                    ) : (
                      <TrendingDown className="h-2.5 w-2.5" />
                    )}
                    {isProfit ? "+" : ""}
                    {margin.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* COL 4: ACTION LINK (1 COL) */}
              <div className="col-span-1 text-center">
                <Link
                  href={`/dashboard/b/${s.business_id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center justify-center p-1.5 rounded-lg text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 group-hover:bg-zinc-200/60 dark:group-hover:bg-zinc-700/60 transition-all"
                  aria-label={`Chi tiết ${s.business_name}`}
                >
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* MOBILE LAYOUT */}
            <div className="md:hidden flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 mt-1"
                  style={{ backgroundColor: s.color || "#18181b" }}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 tracking-tight text-sm truncate">
                      {s.business_name}
                    </span>
                    {overdueCount > 0 && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-[10px] font-semibold text-rose-700 dark:text-rose-400 px-1.5 py-0.2 border border-rose-200/60">
                        {overdueCount} quá hạn
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mt-0.5 whitespace-nowrap">
                    <span>{s.transaction_count} GD</span>
                    {hasCapital && (
                      <>
                        <span>•</span>
                        <span>Vốn {displayMoney(capital.base_capital)}</span>
                      </>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1 whitespace-nowrap">
                    Thu: <span className="font-mono text-emerald-600 font-medium">{displayMoney(income)}</span> · Chi: <span className="font-mono text-rose-600 font-medium">{displayMoney(expense)}</span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 whitespace-nowrap">
                <div
                  className={cn(
                    "font-mono font-bold text-sm tabular-nums",
                    isProfit
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400",
                  )}
                >
                  {displayMoney(profit)}
                </div>
                <div className="mt-0.5 flex justify-end">
                  <span
                    className={cn(
                      "inline-flex items-center text-[10px] font-semibold px-1.5 py-0.2 rounded-full border tabular-nums",
                      isProfit
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400"
                        : "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400",
                    )}
                  >
                    {isProfit ? "+" : ""}
                    {margin.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

