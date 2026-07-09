"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
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
} from "./chart-primitives"
import type { BusinessSummary } from "@/lib/types"

const CHART_HEIGHT = 220

export function BusinessComparisonChart({ summaries }: { summaries: BusinessSummary[] }) {
  const data = summaries.map((s) => ({
    name: s.business_name.length > 14 ? `${s.business_name.slice(0, 14)}…` : s.business_name,
    fullName: s.business_name,
    color: s.color,
    thu: Number(s.total_income),
    chi: Number(s.total_expense),
  }))

  return (
    <ChartShell
      title="So sánh việc kinh doanh"
      description="Thu và chi theo từng mảng"
      accent="blue"
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
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={data} layout="vertical" margin={{ ...CHART_MARGIN, left: 4 }} barCategoryGap="18%" barGap={3}>
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
            <CartesianGrid {...GRID_HORIZONTAL} horizontal={false} vertical stroke={CHART_COLORS.grid} strokeDasharray="4 6" />
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
              width={76}
            />
            <Tooltip
              content={<ChartTooltipContent />}
              cursor={{ fill: "rgba(39, 39, 42, 0.3)", radius: 4 }}
            />
            <Bar dataKey="thu" name="Thu" fill="url(#lap68BizIncome)" radius={[0, 4, 4, 0]} maxBarSize={14} />
            <Bar dataKey="chi" name="Chi" fill="url(#lap68BizExpense)" radius={[0, 4, 4, 0]} maxBarSize={14} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartShell>
  )
}
