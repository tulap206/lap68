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
  "py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide"

export const moduleTableBodyClass = "text-sm text-slate-700"

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
  return <div className={cn(theme.adminClass, "space-y-6 w-full", className)}>{children}</div>
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
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-800 italic uppercase">
          QUẢN TRỊ{" "}
          <span className={ACCENT_TITLE_CLASS[theme.accent]}>{theme.titleSuffix}</span>
        </h1>
        <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
      </div>
      {actions}
    </div>
  )
}

export function ModuleSubpageHeader({
  module,
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
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-800">{title}</h2>
        {subtitle && <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>}
      </div>
      {actions}
    </div>
  )
}

export function ModuleSectionCard({
  title,
  description,
  children,
  filters,
}: {
  title: string
  description?: string
  children: React.ReactNode
  filters?: React.ReactNode
}) {
  return (
    <Card className="border-slate-200/70 shadow-[0_1px_3px_rgba(15,23,42,0.04)] py-0 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 bg-slate-50/40 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
        {filters}
      </div>
      <CardContent className="p-0">{children}</CardContent>
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
}: {
  module: ModuleId
  label: string
  value: string
  hint?: string
  icon: React.ReactNode
  onClick?: () => void
  delay?: number
}) {
  const theme = getModuleTheme(module)
  const Comp = onClick ? "button" : "div"
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "metric-card card-animate text-left w-full rounded-xl border border-slate-200/70 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]",
        ACCENT_KPI_HOVER_CLASS[theme.accent],
        onClick && "cursor-pointer"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{value}</p>
          {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-emerald-600">
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
    return <div className="py-12 text-center text-sm text-slate-500">{emptyLabel}</div>
  }

  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              {headers.map((h) => (
                <th key={h} className={cn(moduleTableHeadClass, "text-left")}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((cells, i) => (
              <tr key={i} data-table-row className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
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
      <div className="md:hidden divide-y divide-slate-100">
        {rows.map((cells, i) => (
          <div key={i} className="p-4 space-y-2">
            {headers.map((h, j) => (
              <div key={h} className="flex justify-between gap-3 text-sm">
                <span className="text-slate-500 text-xs uppercase">{h}</span>
                <span className="text-right">{cells[j]}</span>
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
