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
      ? "from-red-500 to-red-700"
      : accent === "blue"
        ? "from-zinc-500 to-zinc-700"
        : accent === "amber"
          ? "from-amber-500 to-amber-700"
          : "from-green-500 to-green-700"

  return (
    <div className="relative flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-card/80 backdrop-blur-sm shadow-[0_4px_24px_rgba(0,0,0,0.35)] h-full">
      <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${accentClass}`} />
      <div className="px-4 pt-4 pb-2 border-b border-zinc-800">
        <div className="flex items-start gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800/80 border border-zinc-700 text-zinc-400">
            {icon}
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-100 tracking-tight">{title}</h3>
            <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
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
      <div className="h-12 w-12 rounded-full border border-dashed border-zinc-700 flex items-center justify-center mb-3">
        <div className="h-2 w-2 rounded-full bg-zinc-600" />
      </div>
      <p className="text-sm text-zinc-500 font-medium">{label}</p>
    </div>
  )
}

export { MODULE_CHART_PALETTE }
