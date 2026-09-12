"use client";

import Link from "next/link";
import { ArrowRight, AlertTriangle, TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
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
    <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card shadow-xs overflow-hidden">
      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/75 dark:bg-zinc-900/50 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              <th className="py-3 px-4 font-semibold">Mảng kinh doanh</th>
              <th className="py-3 px-4 font-semibold text-right">Vốn</th>
              <th className="py-3 px-4 font-semibold text-right">Thu</th>
              <th className="py-3 px-4 font-semibold text-right">Chi</th>
              <th className="py-3 px-4 font-semibold text-right">Lợi nhuận</th>
              <th className="py-3 px-4 font-semibold text-right">Tỷ suất</th>
              <th className="py-3 px-4 font-semibold text-center w-12" aria-label="Hành động" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70 text-sm">
            {summaries.map((s) => {
              const income = Number(s.total_income) || 0;
              const expense = Number(s.total_expense) || 0;
              const profit = Number(s.net_profit) || 0;
              const margin = income > 0 ? (profit / income) * 100 : 0;
              const isProfit = profit >= 0;
              const capital = capitalMap.get(s.business_id);
              const overdueCount = overdueMap.get(s.business_id) || 0;

              return (
                <tr
                  key={s.business_id}
                  className="group hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
                  onClick={() => {
                    window.location.href = `/dashboard/b/${s.business_id}`;
                  }}
                >
                  {/* TÊN VIỆC & DOT & OVERDUE */}
                  <td className="py-3.5 px-4 min-w-[180px]">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: s.color || "#18181b" }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 tracking-tight group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors truncate">
                            {s.business_name}
                          </span>
                          {overdueCount > 0 && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 px-2 py-0.2 text-[10px] font-semibold text-rose-700 dark:text-rose-400 shrink-0">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              {overdueCount}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {s.transaction_count} giao dịch
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* VỐN */}
                  <td className="py-3.5 px-4 text-right font-mono text-zinc-600 dark:text-zinc-400 tabular-nums">
                    {capital ? displayMoney(capital.base_capital) : "—"}
                  </td>

                  {/* THU */}
                  <td className="py-3.5 px-4 text-right font-mono font-medium text-zinc-800 dark:text-zinc-200 tabular-nums">
                    {displayMoney(income)}
                  </td>

                  {/* CHI */}
                  <td className="py-3.5 px-4 text-right font-mono font-medium text-zinc-800 dark:text-zinc-200 tabular-nums">
                    {displayMoney(expense)}
                  </td>

                  {/* LỢI NHUẬN */}
                  <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums">
                    <span
                      className={
                        isProfit
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }
                    >
                      {displayMoney(profit)}
                    </span>
                  </td>

                  {/* TỶ SUẤT */}
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border tabular-nums",
                        isProfit
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400",
                      )}
                    >
                      {isProfit ? (
                        <TrendingUp className="h-2.5 w-2.5" />
                      ) : (
                        <TrendingDown className="h-2.5 w-2.5" />
                      )}
                      {margin.toFixed(1)}%
                    </span>
                  </td>

                  {/* ACTION */}
                  <td className="py-3.5 px-4 text-center">
                    <Link
                      href={`/dashboard/b/${s.business_id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center justify-center p-1.5 rounded-lg text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 group-hover:bg-zinc-200/50 transition-all"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MOBILE INSET GROUPED LIST VIEW */}
      <div className="md:hidden divide-y divide-zinc-100 dark:divide-zinc-800/80">
        {summaries.map((s) => {
          const income = Number(s.total_income) || 0;
          const expense = Number(s.total_expense) || 0;
          const profit = Number(s.net_profit) || 0;
          const margin = income > 0 ? (profit / income) * 100 : 0;
          const isProfit = profit >= 0;
          const capital = capitalMap.get(s.business_id);
          const overdueCount = overdueMap.get(s.business_id) || 0;

          return (
            <Link
              key={`m-${s.business_id}`}
              href={`/dashboard/b/${s.business_id}`}
              className="flex items-center justify-between p-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors active:scale-[0.99]"
            >
              <div className="flex items-start gap-3 min-w-0 pr-2">
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
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-50 text-[10px] font-semibold text-rose-700 px-1.5 py-0.2 border border-rose-200">
                        {overdueCount} quá hạn
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                    <span>{s.transaction_count} GD</span>
                    {capital && capital.base_capital > 0 && (
                      <>
                        <span>•</span>
                        <span>Vốn {displayMoney(capital.base_capital)}</span>
                      </>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Thu: {displayMoney(income)} · Chi: {displayMoney(expense)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 text-right">
                <div>
                  <p
                    className={cn(
                      "font-mono font-bold text-sm tabular-nums",
                      isProfit
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400",
                    )}
                  >
                    {displayMoney(profit)}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-semibold tabular-nums mt-0.5">
                    {isProfit ? "+" : ""}{margin.toFixed(1)}%
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-400" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
