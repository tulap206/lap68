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
import { cn } from "@/lib/utils"

type CategoryRow = { name: string; value: number; color?: string; count: number }

type CategorySlice = { name: string; value: number; color: string; percent: number }

function groupByCategory(transactions: Transaction[], type: "income" | "expense"): CategoryRow[] {
  const map = new Map<string, CategoryRow>()
  transactions
    .filter((t) => t.type === type)
    .forEach((t) => {
      const name = t.category?.name?.trim() || "Chưa phân loại"
      const row = map.get(name) || { name, value: 0, color: t.category?.color, count: 0 }
      row.value += t.amount
      row.count += 1
      if (t.category?.color) row.color = t.category.color
      map.set(name, row)
    })
  return Array.from(map.values()).sort((a, b) => b.value - a.value)
}

function buildCategorySlices(
  transactions: Transaction[],
  type: "income" | "expense",
  maxSlices = 4
): { slices: CategorySlice[]; total: number; txCount: number } {
  const palette = type === "income" ? incomePiePalette() : expensePiePalette()
  const raw = groupByCategory(transactions, type)
  const total = raw.reduce((s, d) => s + d.value, 0)
  const txCount = raw.reduce((s, d) => s + d.count, 0)

  if (total <= 0) return { slices: [], total: 0, txCount: 0 }

  const slices: CategorySlice[] = []
  let otherValue = 0
  let otherCount = 0

  raw.forEach((item, index) => {
    const percent = (item.value / total) * 100
    const color = item.color || palette[slices.length % palette.length]
    const fitsTop = index < maxSlices && (percent >= 3 || slices.length < 2)
    if (fitsTop && item.name !== "Khác") {
      slices.push({ name: item.name, value: item.value, color, percent })
    } else {
      otherValue += item.value
      otherCount += item.count
    }
  })

  if (otherValue > 0) {
    slices.push({
      name: otherCount > 1 ? `Khác (${otherCount} DM)` : "Khác",
      value: otherValue,
      color: palette[palette.length - 1],
      percent: (otherValue / total) * 100,
    })
  }

  return { slices, total, txCount }
}

function formatCenterMoney(value: number) {
  const s = formatChartAxisValue(value)
  return s.includes("k") || s.includes("Tr") || s.includes("T") ? s : `${s} đ`
}

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
  const { slices, total, txCount } = buildCategorySlices(transactions, type, compact ? 4 : 5)
  const height = compact ? 140 : CHART_HEIGHT_COMPACT
  const innerR = compact ? 42 : 48
  const outerR = compact ? 62 : 70
  const accent = type === "income" ? "text-green-400" : "text-red-400"
  const accentMuted = type === "income" ? "text-green-400/70" : "text-red-400/70"

  if (slices.length === 0 || total <= 0) {
    return <ChartEmpty label={type === "income" ? "Chưa có khoản thu" : "Chưa có khoản chi"} />
  }

  const topSlice = slices[0]

  return (
    <div className="flex flex-col gap-3 min-h-0 h-full">
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className={cn("font-semibold uppercase tracking-wider", accentMuted)}>
          {txCount} giao dịch · {slices.length} danh mục
        </span>
        {topSlice && (
          <span className="text-zinc-500 truncate max-w-[48%]">
            Lớn nhất: <span className={accent}>{formatChartPercent(topSlice.value, total)}</span>
          </span>
        )}
      </div>

      <div className="relative mx-auto w-full max-w-[200px] shrink-0">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={innerR}
              outerRadius={outerR}
              paddingAngle={slices.length > 1 ? 2 : 0}
              stroke="transparent"
            >
              {slices.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltipContent />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-2 text-center">
          <span className="text-[9px] uppercase tracking-wider text-zinc-500">Tổng</span>
          <span className={cn("text-sm font-mono font-bold tabular-nums leading-tight", accent)}>
            {formatCenterMoney(total)}
          </span>
        </div>
      </div>

      <ul className="flex-1 w-full space-y-2.5 min-h-0 overflow-y-auto max-h-[180px] pr-0.5">
        {slices.map((item) => (
          <li key={item.name}>
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="flex items-center gap-1.5 min-w-0">
                <span className="h-2.5 w-2.5 rounded-[3px] shrink-0" style={{ backgroundColor: item.color }} />
                <span className="truncate text-xs text-zinc-300">{item.name}</span>
              </span>
              <span className="font-mono text-[11px] tabular-nums text-zinc-400 shrink-0">
                {formatChartPercent(item.value, total)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-zinc-800/90 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.max(item.percent, 2)}%`, backgroundColor: item.color }}
                />
              </div>
              <span className="text-[10px] font-mono text-zinc-500 tabular-nums shrink-0 w-[72px] text-right">
                {formatChartAxisValue(item.value)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function CategorySummaryStrip({
  incomeTotal,
  expenseTotal,
}: {
  incomeTotal: number
  expenseTotal: number
}) {
  const grand = incomeTotal + expenseTotal
  const incomePct = grand > 0 ? (incomeTotal / grand) * 100 : 50
  const expensePct = grand > 0 ? 100 - incomePct : 50
  const expenseRatio = incomeTotal > 0 ? (expenseTotal / incomeTotal) * 100 : 0

  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-3 space-y-2.5">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Tổng thu</p>
          <p className="text-sm font-mono font-bold text-green-400 tabular-nums mt-0.5">{formatCenterMoney(incomeTotal)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Tỷ lệ chi/thu</p>
          <p className={cn(
            "text-sm font-mono font-bold tabular-nums mt-0.5",
            expenseRatio > 100 ? "text-red-400" : expenseRatio > 80 ? "text-amber-400" : "text-zinc-200"
          )}>
            {incomeTotal > 0 ? `${expenseRatio.toFixed(0)}%` : "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Tổng chi</p>
          <p className="text-sm font-mono font-bold text-red-400 tabular-nums mt-0.5">{formatCenterMoney(expenseTotal)}</p>
        </div>
      </div>
      {grand > 0 && (
        <div className="flex h-2 rounded-full overflow-hidden bg-zinc-800">
          <div className="bg-green-500/80 transition-all" style={{ width: `${incomePct}%` }} title="Thu" />
          <div className="bg-red-500/80 transition-all" style={{ width: `${expensePct}%` }} title="Chi" />
        </div>
      )}
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
  const incomeTotal = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const expenseTotal = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)
  const hasAny = incomeTotal > 0 || expenseTotal > 0

  return (
    <ChartShell
      title="Cơ cấu thu chi"
      description="Phân bổ theo danh mục · đồng bộ toàn bộ giao dịch"
      accent="amber"
      className="h-full"
      footer={
        hasAny ? (
          <p className="text-[10px] text-zinc-600 leading-relaxed">
            Màu theo danh mục · nhóm nhỏ &lt;3% gộp vào Khác · số tiền là tổng thực tế
          </p>
        ) : undefined
      }
    >
      {!hasAny ? (
        <ChartEmpty label="Chưa có giao dịch để phân tích" />
      ) : (
        <div className="space-y-3">
          <CategorySummaryStrip incomeTotal={incomeTotal} expenseTotal={expenseTotal} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="min-w-0 rounded-lg border border-green-500/20 bg-green-500/[0.04] p-3 flex flex-col min-h-[320px]">
              <p className="text-xs font-bold text-green-400 mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                Cơ cấu thu
              </p>
              <CategoryPieBody transactions={transactions} type="income" compact />
            </div>
            <div className="min-w-0 rounded-lg border border-red-500/20 bg-red-500/[0.04] p-3 flex flex-col min-h-[320px]">
              <p className="text-xs font-bold text-red-400 mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                Cơ cấu chi
              </p>
              <CategoryPieBody transactions={transactions} type="expense" compact />
            </div>
          </div>
        </div>
      )}
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
