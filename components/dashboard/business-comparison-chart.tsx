"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AXIS_TICK,
  CHART_COLORS,
  CHART_MARGIN,
  ChartEmpty,
  ChartLegendPills,
  ChartShell,
  ChartTooltipContent,
  GRID_HORIZONTAL,
  formatChartAxisValue,
} from "./chart-primitives";
import { displayMoney } from "@/lib/format-money";
import { cn } from "@/lib/utils";
import type { BusinessSummary } from "@/lib/types";

export function BusinessComparisonChart({
  summaries,
  className,
}: {
  summaries: BusinessSummary[];
  className?: string;
}) {
  const sortedSummaries = [...summaries].sort(
    (a, b) => Number(b.net_profit) - Number(a.net_profit),
  );

  const data = sortedSummaries.map((s) => {
    const inc = Number(s.total_income);
    const profit = Number(s.net_profit);
    const margin = inc > 0 ? (profit / inc) * 100 : 0;
    return {
      name:
        s.business_name.length > 14
          ? `${s.business_name.slice(0, 14)}…`
          : s.business_name,
      fullName: s.business_name,
      color: s.color,
      thu: inc,
      chi: Number(s.total_expense),
      profit,
      margin,
    };
  });

  return (
    <ChartShell
      title="So sánh & Xếp hạng hiệu quả kinh doanh"
      description="Thu, chi, lợi nhuận ròng và biên lợi nhuận của từng mảng"
      accent="blue"
      className={className}
      footer={
        data.length > 0 ? (
          <ChartLegendPills
            items={[
              { key: "thu", label: "Tổng thu", color: CHART_COLORS.income },
              { key: "chi", label: "Tổng chi", color: CHART_COLORS.expense },
            ]}
          />
        ) : undefined
      }
    >
      {data.length === 0 ? (
        <ChartEmpty label="Chưa có dữ liệu" />
      ) : (
        <div className="space-y-4">
          {/* Top Ranking Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {sortedSummaries.slice(0, 3).map((s, idx) => {
              const inc = Number(s.total_income);
              const profit = Number(s.net_profit);
              const margin = inc > 0 ? (profit / inc) * 100 : 0;
              const badge = idx === 0 ? "🥇 Top 1" : idx === 1 ? "🥈 Top 2" : "🥉 Top 3";
              return (
                <div
                  key={s.business_id}
                  className="p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {s.business_name}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0">
                      {badge}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className={cn(
                        "font-mono font-bold text-sm tabular-nums",
                        profit >= 0 ? "text-income" : "text-expense",
                      )}
                    >
                      {profit >= 0 ? "+" : ""}
                      {displayMoney(profit)}
                    </span>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Biên: {margin.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bar Chart */}
          <div className="pt-2">
            <ResponsiveContainer width="100%" height={Math.max(180, data.length * 48)}>
              <BarChart
                data={data}
                layout="vertical"
                margin={{ ...CHART_MARGIN, left: 4 }}
                barCategoryGap="18%"
                barGap={3}
              >
                <defs>
                  <linearGradient id="lap68BizIncome" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="#4ade80" stopOpacity={0.95} />
                  </linearGradient>
                  <linearGradient id="lap68BizExpense" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#dc2626" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="#f87171" stopOpacity={0.95} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  {...GRID_HORIZONTAL}
                  horizontal={false}
                  vertical
                  stroke={CHART_COLORS.grid}
                  strokeDasharray="4 6"
                />
                <XAxis
                  type="number"
                  tickFormatter={formatChartAxisValue}
                  tick={AXIS_TICK}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={AXIS_TICK}
                  axisLine={false}
                  tickLine={false}
                  width={84}
                />
                <Tooltip
                  content={<ChartTooltipContent />}
                  cursor={{ fill: "rgba(39, 39, 42, 0.3)", radius: 4 }}
                />
                <Bar
                  dataKey="thu"
                  name="Thu"
                  fill="url(#lap68BizIncome)"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={14}
                />
                <Bar
                  dataKey="chi"
                  name="Chi"
                  fill="url(#lap68BizExpense)"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={14}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </ChartShell>
  );
}
