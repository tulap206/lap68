"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ChartEmpty, ChartShell, MODULE_CHART_PALETTE, formatChartAxisValue } from "./chart-primitives"
import { displayMoney } from "@/lib/format-money"
import { TrendingUp, PieChart as PieIcon, BarChart3 } from "lucide-react"
import type { Transaction } from "@/lib/supabase"
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
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
}

export function MonthlyCashflowChart({ transactions }: { transactions: Transaction[] }) {
  const data = groupByMonth(transactions)

  return (
    <ChartShell
      title="Dòng tiền theo tháng"
      description="Thu và chi 6 tháng gần nhất"
      icon={<BarChart3 className="h-4 w-4" />}
    >
      {data.length === 0 ? (
        <ChartEmpty label="Chưa có giao dịch" />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#71717a" }} axisLine={{ stroke: "#3f3f46" }} />
            <YAxis tickFormatter={formatChartAxisValue} tick={{ fontSize: 11, fill: "#71717a" }} axisLine={{ stroke: "#3f3f46" }} />
            <Tooltip formatter={(v) => displayMoney(Number(v ?? 0))} />
            <Bar dataKey="income" name="Thu" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="Chi" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
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
  const data = groupByCategory(transactions, type)
  const title = type === "income" ? "Cơ cấu thu" : "Cơ cấu chi"

  return (
    <ChartShell title={title} description="Theo danh mục" icon={<PieIcon className="h-4 w-4" />} accent={type === "income" ? "emerald" : "red"}>
      {data.length === 0 ? (
        <ChartEmpty label="Chưa có dữ liệu" />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
              {data.map((_, i) => (
                <Cell key={i} fill={MODULE_CHART_PALETTE[i % MODULE_CHART_PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => displayMoney(Number(v ?? 0))} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartShell>
  )
}

export function ProfitTrendChart({ transactions }: { transactions: Transaction[] }) {
  const data = groupByMonth(transactions).map((d) => ({
    ...d,
    profit: d.income - d.expense,
  }))

  return (
    <ChartShell
      title="Lợi nhuận ròng"
      description="Thu trừ chi theo tháng"
      icon={<TrendingUp className="h-4 w-4" />}
      accent="blue"
    >
      {data.length === 0 ? (
        <ChartEmpty label="Chưa có dữ liệu" />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#71717a" }} axisLine={{ stroke: "#3f3f46" }} />
            <YAxis tickFormatter={formatChartAxisValue} tick={{ fontSize: 11, fill: "#71717a" }} axisLine={{ stroke: "#3f3f46" }} />
            <Tooltip formatter={(v) => displayMoney(Number(v ?? 0))} />
            <Bar dataKey="profit" name="Lợi nhuận" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.profit >= 0 ? "#22c55e" : "#ef4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartShell>
  )
}
