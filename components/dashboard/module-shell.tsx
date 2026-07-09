"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import {
  type ModuleId,
  ACCENT_BTN_CLASS,
  ACCENT_KPI_HOVER_CLASS,
  ACCENT_TITLE_CLASS,
  getModuleTheme,
} from "@/lib/module-theme"

export const moduleTableHeadClass =
  "py-3 px-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider"

export const moduleTableBodyClass = "text-sm text-zinc-300"

export const moduleBadgeClass =
  "inline-flex items-center justify-center text-xs font-semibold px-2.5 py-0.5 rounded-md border whitespace-nowrap"

export function ModulePageShell({
  module,
  children,
  className,
}: {
  module: ModuleId
  children: React.ReactNode
  className?: string
}) {
  const theme = getModuleTheme(module)
  return <div className={cn(theme.adminClass, "space-y-6 w-full max-w-[1600px] mx-auto relative z-10", className)}>{children}</div>
}

export function ModuleBrandHeader({
  module,
  subtitle,
  actions,
}: {
  module: ModuleId
  subtitle: string
  actions?: React.ReactNode
}) {
  const theme = getModuleTheme(module)
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-5">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-100 italic uppercase text-balance">
          QUẢN TRỊ{" "}
          <span className={ACCENT_TITLE_CLASS[theme.accent]}>{theme.titleSuffix}</span>
        </h1>
        <p className="text-zinc-500 text-sm mt-1">{subtitle}</p>
      </div>
      {actions && <div className="w-full md:w-auto flex flex-wrap gap-2 shrink-0">{actions}</div>}
    </div>
  )
}

export function ModuleSubpageHeader({
  title,
  subtitle,
  actions,
}: {
  module: ModuleId
  title: string
  subtitle?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-100">{title}</h2>
        {subtitle && <p className="text-zinc-500 text-sm mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="w-full sm:w-auto flex flex-wrap gap-2 shrink-0">{actions}</div>}
    </div>
  )
}

export function ModuleSectionCard({
  title,
  description,
  children,
  filters,
  className,
}: {
  title: string
  description?: string
  children: React.ReactNode
  filters?: React.ReactNode
  className?: string
}) {
  return (
    <Card className={cn("border-zinc-800/80 bg-card/80 backdrop-blur-sm py-0 overflow-hidden flex flex-col", className)}>
      <div className="flex flex-col gap-3 px-4 sm:px-6 py-4 bg-zinc-900/50 border-b border-zinc-800 shrink-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-zinc-100">{title}</h3>
          {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
        </div>
        {filters && <div className="w-full sm:w-auto shrink-0">{filters}</div>}
      </div>
      <CardContent className="p-0 flex-1 flex flex-col min-h-0">{children}</CardContent>
    </Card>
  )
}

export function ModuleKpiCard({
  module,
  label,
  value,
  hint,
  icon,
  onClick,
  delay = 0,
  tone = "neutral",
}: {
  module: ModuleId
  label: string
  value: string
  hint?: string
  icon: React.ReactNode
  onClick?: () => void
  delay?: number
  tone?: "neutral" | "income" | "expense" | "profit"
}) {
  const theme = getModuleTheme(module)
  const Comp = onClick ? "button" : "div"

  const toneStyles = {
    neutral: "border-zinc-800 bg-card/90 [&_.kpi-icon]:text-zinc-400 [&_.kpi-icon]:bg-zinc-800/80 [&_.kpi-icon]:border-zinc-700",
    income: "border-green-500/20 bg-card/90 [&_.kpi-value]:text-green-400 [&_.kpi-icon]:text-green-400 [&_.kpi-icon]:bg-green-500/10 [&_.kpi-icon]:border-green-500/20",
    expense: "border-red-500/20 bg-card/90 [&_.kpi-value]:text-red-400 [&_.kpi-icon]:text-red-400 [&_.kpi-icon]:bg-red-500/10 [&_.kpi-icon]:border-red-500/20",
    profit: "border-zinc-700 bg-card/90 [&_.kpi-value]:text-zinc-100 [&_.kpi-icon]:text-green-400 [&_.kpi-icon]:bg-zinc-800 [&_.kpi-icon]:border-zinc-700",
  }

  return (
    <Comp
      onClick={onClick}
      className={cn(
        "metric-card card-animate text-left w-full rounded-xl border p-3 sm:p-4 shadow-[0_4px_24px_rgba(0,0,0,0.3)] min-w-0",
        toneStyles[tone],
        ACCENT_KPI_HOVER_CLASS[theme.accent],
        onClick && "cursor-pointer"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500 truncate">{label}</p>
          <p className="kpi-value text-base sm:text-xl lg:text-2xl font-black text-zinc-100 mt-1 font-mono tabular-nums break-all sm:break-normal">{value}</p>
          {hint && <p className="text-xs text-zinc-600 mt-1 truncate">{hint}</p>}
        </div>
        <div className="kpi-icon flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl border shrink-0">
          {icon}
        </div>
      </div>
    </Comp>
  )
}

export function ModuleResponsiveTable({
  headers,
  rows,
  emptyLabel = "Chưa có dữ liệu",
}: {
  headers: string[]
  rows: React.ReactNode[][]
  emptyLabel?: string
}) {
  if (rows.length === 0) {
    return <div className="py-12 text-center text-sm text-zinc-500">{emptyLabel}</div>
  }

  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-900/60 border-b border-zinc-800">
              {headers.map((h) => (
                <th key={h} className={cn(moduleTableHeadClass, "text-left")}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((cells, i) => (
              <tr key={i} data-table-row className="border-b border-zinc-800/60 transition-colors">
                {cells.map((cell, j) => (
                  <td key={j} className={cn("py-3 px-4", moduleTableBodyClass)}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden divide-y divide-zinc-800">
        {rows.map((cells, i) => (
          <div key={i} className="p-4 space-y-2.5">
            {headers.map((h, j) => (
              <div key={h} className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-3 text-sm min-w-0">
                <span className="text-zinc-500 text-[10px] uppercase tracking-wider shrink-0">{h}</span>
                <span className="text-zinc-300 min-w-0 break-words sm:text-right">{cells[j]}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}

export function AccentButton({
  module,
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & { module: ModuleId }) {
  const theme = getModuleTheme(module)
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold transition-all active:scale-95",
        ACCENT_BTN_CLASS[theme.accent],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
