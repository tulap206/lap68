"use client"

import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  AXIS_LINE,
  AXIS_TICK,
  CHART_COLORS,
  CHART_MARGIN,
  CHART_MARGIN_LEFT,
  ChartEmpty,
  ChartLegendPills,
  ChartShell,
  ChartTooltipContent,
  GRID_HORIZONTAL,
  expensePiePalette,
  formatChartAxisValue,
  formatChartPercent,
  incomePiePalette,
} from "./chart-primitives"
import type { Transaction } from "@/lib/types"
import { parseDisplayDate } from "@/lib/format-date"

function groupByMonth(transactions: Transaction[]) {
  const map = new Map<string, { month: string; income: number; expense: number }>()

  transactions.forEach((t) => {
    const date = parseDisplayDate(t.transaction_date)
    if (!date) return
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    const label = `T${date.getMonth() + 1}/${String(date.getFullYear()).slice(2)}`
    const row = map.get(key) || { month: label, income: 0, expense: 0 }
    if (t.type === "income") row.income += t.amount
    else row.expense += t.amount
    map.set(key, row)
  })

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([, v]) => v)
}

function groupByCategory(transactions: Transaction[], type: "income" | "expense") {
  const map = new Map<string, number>()
  transactions
    .filter((t) => t.type === type)
    .forEach((t) => {
      const name = t.category?.name || "Khác"
      map.set(name, (map.get(name) || 0) + t.amount)
    })
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

const CHART_HEIGHT = 208
const CHART_HEIGHT_COMPACT = 168

function MonthlyCashflowChartBody({ data, height = CHART_HEIGHT }: { data: ReturnType<typeof groupByMonth>; height?: number }) {
  if (data.length === 0) return <ChartEmpty label="Chưa có giao dịch" />
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={CHART_MARGIN_LEFT} barCategoryGap="22%" barGap={4}>
        <defs>
          <linearGradient id="lap68IncomeBar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ade80" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#16a34a" stopOpacity={0.55} />
          </linearGradient>
          <linearGradient id="lap68ExpenseBar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f87171" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#dc2626" stopOpacity={0.55} />
          </linearGradient>
        </defs>
        <CartesianGrid {...GRID_HORIZONTAL} />
        <XAxis dataKey="month" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} dy={6} />
        <YAxis tickFormatter={formatChartAxisValue} tick={AXIS_TICK} axisLine={false} tickLine={false} width={44} />
        <Tooltip content={<ChartTooltipContent />} cursor={{ fill: "rgba(39, 39, 42, 0.35)", radius: 6 }} />
        <Bar dataKey="income" name="Thu" fill="url(#lap68IncomeBar)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="expense" name="Chi" fill="url(#lap68ExpenseBar)" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function ProfitTrendChartBody({
  data,
  height = CHART_HEIGHT,
}: {
  data: ReturnType<typeof groupByMonth>
  height?: number
}) {
  const chartData = data.map((d) => ({ ...d, profit: d.income - d.expense }))
  if (chartData.length === 0) return <ChartEmpty label="Chưa có dữ liệu" />
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData} margin={CHART_MARGIN_LEFT}>
        <defs>
          <linearGradient id="lap68ProfitArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ade80" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#4ade80" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...GRID_HORIZONTAL} />
        <XAxis dataKey="month" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} dy={6} />
        <YAxis tickFormatter={formatChartAxisValue} tick={AXIS_TICK} axisLine={false} tickLine={false} width={44} />
        <ReferenceLine y={0} stroke={CHART_COLORS.axis} strokeDasharray="3 4" />
        <Tooltip content={<ChartTooltipContent />} cursor={{ fill: "rgba(39, 39, 42, 0.25)", radius: 6 }} />
        <Area type="monotone" dataKey="profit" fill="url(#lap68ProfitArea)" stroke="transparent" isAnimationActive={false} />
        <Bar dataKey="profit" name="Lợi nhuận" radius={[4, 4, 0, 0]} maxBarSize={32}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.profit >= 0 ? CHART_COLORS.incomeMuted : CHART_COLORS.expenseMuted} fillOpacity={0.85} />
          ))}
        </Bar>
      </ComposedChart>
    </ResponsiveContainer>
  )
}

function CategoryPieBody({
  transactions,
  type,
  compact = false,
}: {
  transactions: Transaction[]
  type: "income" | "expense"
  compact?: boolean
}) {
  const data = groupByCategory(transactions, type)
  const palette = type === "income" ? incomePiePalette() : expensePiePalette()
  const total = data.reduce((s, d) => s + d.value, 0)
  const topSlices = data.slice(0, compact ? 4 : 5)
  const otherValue = data.slice(compact ? 4 : 5).reduce((s, d) => s + d.value, 0)
  const chartData = otherValue > 0 ? [...topSlices, { name: "Khác", value: otherValue }] : topSlices
  const height = compact ? CHART_HEIGHT_COMPACT : CHART_HEIGHT
  const innerR = compact ? 38 : 52
  const outerR = compact ? 56 : 76

  if (chartData.length === 0) {
    return <ChartEmpty label="Chưa có dữ liệu" />
  }

  return (
    <div className={compact ? "flex flex-col items-center gap-2 min-h-0" : "flex flex-col sm:flex-row items-center gap-3 sm:gap-5"}>
      <div className={compact ? "w-full shrink-0" : "w-full sm:w-[52%] shrink-0"}>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={innerR}
              outerRadius={outerR}
              paddingAngle={2}
              stroke="transparent"
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={palette[i % palette.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltipContent />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className={compact ? "w-full space-y-1.5 min-w-0" : "flex-1 w-full space-y-2 min-w-0"}>
        {chartData.map((item, i) => (
          <li key={item.name} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-[3px] shrink-0" style={{ backgroundColor: palette[i % palette.length] }} />
            <span className="truncate text-zinc-400 flex-1">{item.name}</span>
            <span className="font-mono text-[11px] text-zinc-500 tabular-nums shrink-0">
              {formatChartPercent(item.value, total)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function CombinedCashflowPanel({ transactions }: { transactions: Transaction[] }) {
  const monthlyData = groupByMonth(transactions)
  const hasData = monthlyData.length > 0

  return (
    <ChartShell
      title="Thu chi & lợi nhuận"
      description="6 tháng gần nhất"
      footer={
        hasData ? (
          <ChartLegendPills
            items={[
              { key: "income", label: "Thu", color: CHART_COLORS.income },
              { key: "expense", label: "Chi", color: CHART_COLORS.expense },
              { key: "profit", label: "Lợi nhuận", color: CHART_COLORS.incomeMuted },
            ]}
          />
        ) : undefined
      }
    >
      {!hasData ? (
        <ChartEmpty label="Chưa có giao dịch" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div className="min-w-0 rounded-lg border border-zinc-800/50 bg-zinc-900/20 p-2 sm:p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2 px-0.5">Dòng tiền tháng</p>
            <MonthlyCashflowChartBody data={monthlyData} height={CHART_HEIGHT_COMPACT} />
          </div>
          <div className="min-w-0 rounded-lg border border-zinc-800/50 bg-zinc-900/20 p-2 sm:p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2 px-0.5">Lợi nhuận ròng</p>
            <ProfitTrendChartBody data={monthlyData} height={CHART_HEIGHT_COMPACT} />
          </div>
        </div>
      )}
    </ChartShell>
  )
}

export function CombinedCategoryPanel({ transactions }: { transactions: Transaction[] }) {
  return (
    <ChartShell title="Cơ cấu thu chi" description="Theo danh mục" accent="amber" className="h-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 h-full">
        <div className="min-w-0 rounded-lg border border-green-500/15 bg-green-500/[0.03] p-2 sm:p-3 flex flex-col">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-green-400/90 mb-2">Thu</p>
          <CategoryPieBody transactions={transactions} type="income" compact />
        </div>
        <div className="min-w-0 rounded-lg border border-red-500/15 bg-red-500/[0.03] p-2 sm:p-3 flex flex-col">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-red-400/90 mb-2">Chi</p>
          <CategoryPieBody transactions={transactions} type="expense" compact />
        </div>
      </div>
    </ChartShell>
  )
}

export function MonthlyCashflowChart({ transactions }: { transactions: Transaction[] }) {
  const data = groupByMonth(transactions)

  return (
    <ChartShell
      title="Dòng tiền theo tháng"
      description="6 tháng gần nhất"
      footer={
        data.length > 0 ? (
          <ChartLegendPills
            items={[
              { key: "income", label: "Thu", color: CHART_COLORS.income },
              { key: "expense", label: "Chi", color: CHART_COLORS.expense },
            ]}
          />
        ) : undefined
      }
    >
      <MonthlyCashflowChartBody data={data} />
    </ChartShell>
  )
}

export function CategoryPieChart({
  transactions,
  type,
}: {
  transactions: Transaction[]
  type: "income" | "expense"
}) {
  const title = type === "income" ? "Cơ cấu thu" : "Cơ cấu chi"
  return (
    <ChartShell title={title} description="Theo danh mục" accent={type === "income" ? "emerald" : "red"}>
      <CategoryPieBody transactions={transactions} type={type} />
    </ChartShell>
  )
}

export function ProfitTrendChart({ transactions }: { transactions: Transaction[] }) {
  const data = groupByMonth(transactions)

  return (
    <ChartShell
      title="Lợi nhuận ròng"
      description="Thu trừ chi theo tháng"
      accent="blue"
      footer={
        data.length > 0 ? (
          <ChartLegendPills
            items={[
              { key: "pos", label: "Dương", color: CHART_COLORS.income },
              { key: "neg", label: "Âm", color: CHART_COLORS.expense },
            ]}
          />
        ) : undefined
      }
    >
      <ProfitTrendChartBody data={data} />
    </ChartShell>
  )
}
