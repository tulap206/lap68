"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { displayMoney } from "@/lib/format-money"
import { ChartShell } from "./chart-primitives"
import { BarChart3 } from "lucide-react"
import type { BusinessSummary } from "@/lib/types"

export function BusinessComparisonChart({ summaries }: { summaries: BusinessSummary[] }) {
  const data = summaries.map((s) => ({
    name: s.business_name.length > 12 ? s.business_name.slice(0, 12) + "…" : s.business_name,
    thu: Number(s.total_income),
    chi: Number(s.total_expense),
    lai: Number(s.net_profit),
  }))

  return (
    <ChartShell title="So sánh việc kinh doanh" description="Thu chi lợi nhuận theo từng mảng" icon={<BarChart3 className="h-4 w-4" />} accent="blue">
      {data.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-8">Chưa có dữ liệu</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#71717a" }} />
            <YAxis tick={{ fontSize: 10, fill: "#71717a" }} />
            <Tooltip formatter={(v) => displayMoney(Number(v ?? 0))} />
            <Legend />
            <Bar dataKey="thu" name="Thu" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="chi" name="Chi" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartShell>
  )
}
