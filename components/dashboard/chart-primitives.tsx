"use client"

import { MODULE_CHART_PALETTE } from "@/lib/module-theme"

export function formatChartAxisValue(val: number) {
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}T`
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)}Tr`
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`
  return val.toLocaleString("vi-VN")
}

export function ChartShell({
  title,
  description,
  icon,
  accent = "emerald",
  children,
}: {
  title: string
  description: string
  icon: React.ReactNode
  accent?: "emerald" | "red" | "blue" | "amber"
  children: React.ReactNode
}) {
  const accentClass =
    accent === "red"
      ? "from-red-400 to-red-600"
      : accent === "blue"
        ? "from-blue-400 to-blue-600"
        : accent === "amber"
          ? "from-amber-400 to-amber-600"
          : "from-emerald-400 to-emerald-600"

  return (
    <div className="relative flex flex-col overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)] h-full">
      <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${accentClass}`} />
      <div className="px-4 pt-4 pb-2 border-b border-slate-100/80">
        <div className="flex items-start gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 border border-slate-100 text-slate-600">
            {icon}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">{children}</div>
    </div>
  )
}

export function ChartEmpty({ label }: { label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
      <p className="text-sm text-slate-500 font-medium">{label}</p>
    </div>
  )
}

export { MODULE_CHART_PALETTE }
