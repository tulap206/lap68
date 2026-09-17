"use client";

import { useMemo, useState } from "react";
import {
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Award,
  AlertCircle,
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
} from "lucide-react";
import {
  CombinedCashflowPanel,
  CombinedCategoryPanel,
} from "@/components/dashboard/cashflow-charts";
import { BusinessComparisonChart } from "@/components/dashboard/business-comparison-chart";
import { displayMoney } from "@/lib/format-money";
import { cn } from "@/lib/utils";
import type { BusinessSummary, Transaction } from "@/lib/types";

export function CashflowReportsSection({
  transactions,
  summaries = [],
  showComparison = true,
}: {
  transactions: Transaction[];
  summaries?: BusinessSummary[];
  showComparison?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"trend" | "structure" | "comparison">("trend");
  const hasComparison = showComparison && summaries && summaries.length > 0;

  // 1. SMART FINANCIAL INSIGHTS COMPUTATION
  const insights = useMemo(() => {
    const incomeTotal = transactions
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const expenseTotal = transactions
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    const netProfit = incomeTotal - expenseTotal;
    const profitMargin = incomeTotal > 0 ? (netProfit / incomeTotal) * 100 : 0;
    const expenseRatio = incomeTotal > 0 ? (expenseTotal / incomeTotal) * 100 : 0;

    // Top profitable business
    let topBiz: BusinessSummary | null = null;
    let topBizProfit = -Infinity;
    if (summaries && summaries.length > 0) {
      for (const s of summaries) {
        const p = Number(s.net_profit);
        if (p > topBizProfit) {
          topBizProfit = p;
          topBiz = s;
        }
      }
    }

    const topBizContribution =
      topBiz && netProfit > 0 && topBizProfit > 0
        ? Math.min(100, Math.round((topBizProfit / netProfit) * 100))
        : null;

    // Highest expense business
    let highestExpBiz: BusinessSummary | null = null;
    let highestExp = -Infinity;
    if (summaries && summaries.length > 0) {
      for (const s of summaries) {
        const exp = Number(s.total_expense);
        if (exp > highestExp) {
          highestExp = exp;
          highestExpBiz = s;
        }
      }
    }

    const highestExpPct =
      highestExpBiz && expenseTotal > 0 && highestExp > 0
        ? Math.round((highestExp / expenseTotal) * 100)
        : null;

    return {
      incomeTotal,
      expenseTotal,
      netProfit,
      profitMargin,
      expenseRatio,
      topBiz,
      topBizProfit,
      topBizContribution,
      highestExpBiz,
      highestExpPct,
    };
  }, [transactions, summaries]);

  if (transactions.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* 1. TOP CONTROLS & SWITCHER */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60">
        {/* Apple Segmented Switcher */}
        <div className="apple-segmented w-full sm:w-auto grid grid-cols-3 sm:flex">
          <button
            type="button"
            onClick={() => setActiveTab("trend")}
            className={cn(
              "apple-segmented-item text-center justify-center flex items-center gap-1.5",
              activeTab === "trend" && "active",
            )}
          >
            <TrendingUp className="h-3.5 w-3.5" /> Xu hướng
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("structure")}
            className={cn(
              "apple-segmented-item text-center justify-center flex items-center gap-1.5",
              activeTab === "structure" && "active",
            )}
          >
            <PieIcon className="h-3.5 w-3.5" /> Cơ cấu
          </button>
          {hasComparison && (
            <button
              type="button"
              onClick={() => setActiveTab("comparison")}
              className={cn(
                "apple-segmented-item text-center justify-center flex items-center gap-1.5",
                activeTab === "comparison" && "active",
              )}
            >
              <BarChart3 className="h-3.5 w-3.5" /> So sánh
            </button>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 text-xs text-muted-foreground font-medium">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <Sparkles className="h-3 w-3" /> Phân tích trực quan
          </span>
        </div>
      </div>

      {/* 2. SMART FINANCIAL INSIGHTS STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Insight 1: Sức khỏe dòng tiền & Biên lợi nhuận */}
        <div className="p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Activity className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
              Biên lợi nhuận ròng
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-base sm:text-lg font-mono font-bold text-foreground">
                {insights.profitMargin.toFixed(1)}%
              </span>
              <span className="text-[11px] text-muted-foreground truncate">
                Tỷ lệ chi/thu: {insights.expenseRatio.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Insight 2: Top mảng sinh lời */}
        <div className="p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
            <Award className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
              Mảng sinh lời cao nhất
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-sm sm:text-base font-bold text-foreground truncate">
                {insights.topBiz?.business_name || "Chưa có"}
              </span>
              {insights.topBizContribution != null && (
                <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 shrink-0">
                  {insights.topBizContribution}% lợi nhuận
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Insight 3: Điểm chi tiêu lớn */}
        <div className="p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shrink-0">
            <AlertCircle className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
              Chi tiêu nhiều nhất
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-sm sm:text-base font-bold text-foreground truncate">
                {insights.highestExpBiz?.business_name || "Chưa có"}
              </span>
              {insights.highestExpPct != null && (
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 shrink-0">
                  {insights.highestExpPct}% tổng chi
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. TAB CONTENT */}
      {activeTab === "trend" && (
        <div className="space-y-4">
          <CombinedCashflowPanel transactions={transactions} />
        </div>
      )}

      {activeTab === "structure" && (
        <div className="space-y-4">
          <CombinedCategoryPanel
            transactions={transactions}
            summaries={summaries}
            groupBy={summaries.length > 1 ? "business" : "category"}
          />
        </div>
      )}

      {activeTab === "comparison" && hasComparison && (
        <div className="space-y-4">
          <BusinessComparisonChart
            summaries={summaries}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}
