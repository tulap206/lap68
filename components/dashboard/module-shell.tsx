"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { KpiAutoFitValue } from "@/components/dashboard/kpi-auto-fit-value";
import {
  type ModuleId,
  ACCENT_BTN_CLASS,
  ACCENT_KPI_HOVER_CLASS,
  ACCENT_TITLE_CLASS,
  getModuleTheme,
} from "@/lib/module-theme";

export const moduleTableHeadClass =
  "py-3.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider";

export const moduleTableBodyClass = "text-sm text-foreground/90";

export const moduleBadgeClass =
  "inline-flex items-center justify-center text-xs font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap";

export function ModulePageShell({
  module,
  children,
  className,
}: {
  module: ModuleId;
  children: React.ReactNode;
  className?: string;
}) {
  const theme = getModuleTheme(module);
  return (
    <div
      className={cn(
        theme.adminClass,
        "space-y-6 w-full max-w-[1600px] mx-auto relative z-10",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ModuleBrandHeader({
  module,
  subtitle,
  actions,
}: {
  module: ModuleId;
  subtitle: string;
  actions?: React.ReactNode;
}) {
  const theme = getModuleTheme(module);
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-black/[0.06] dark:border-white/[0.08] pb-5">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground text-balance">
          Quản trị{" "}
          <span className={ACCENT_TITLE_CLASS[theme.accent]}>
            {theme.titleSuffix}
          </span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
      </div>
      {actions && (
        <div className="w-full md:w-auto flex flex-wrap gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

export function ModuleSubpageHeader({
  title,
  subtitle,
  actions,
}: {
  module: ModuleId;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
        {subtitle && (
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="w-full sm:w-auto flex flex-wrap gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

export function ModuleSectionCard({
  title,
  description,
  children,
  filters,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  filters?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "border border-black/[0.06] dark:border-white/[0.08] bg-card/90 dark:bg-card/95 backdrop-blur-xl p-0 overflow-hidden flex flex-col rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.25)]",
        className,
      )}
    >
      <div className="flex flex-col gap-3 px-5 py-4 bg-black/[0.02] dark:bg-white/[0.03] border-b border-black/[0.04] dark:border-white/[0.06] shrink-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-foreground tracking-tight">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
        {filters && <div className="w-full sm:w-auto shrink-0">{filters}</div>}
      </div>
      <CardContent className="p-0 flex-1 flex flex-col min-h-0">
        {children}
      </CardContent>
    </Card>
  );
}

type KpiTone =
  | "neutral"
  | "income"
  | "expense"
  | "profit"
  | "margin"
  | "balance"
  | "capital"
  | "count";

function isNegativeKpiValue(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith("-") && trimmed !== "—";
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
  module: ModuleId;
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  onClick?: () => void;
  delay?: number;
  tone?: KpiTone;
}) {
  const theme = getModuleTheme(module);
  const Comp = onClick ? "button" : "div";
  const signedNegative =
    (tone === "profit" || tone === "margin") && isNegativeKpiValue(value);

  const toneStyles: Record<KpiTone, string> = {
    neutral:
      "border-black/[0.06] dark:border-white/[0.08] bg-card/90 dark:bg-card/95 [&_.kpi-value]:text-foreground [&_.kpi-icon]:text-muted-foreground [&_.kpi-icon]:bg-black/[0.05] dark:[&_.kpi-icon]:bg-white/[0.08]",
    income:
      "border-black/[0.06] dark:border-white/[0.08] bg-card/90 dark:bg-card/95 [&_.kpi-value]:text-[#34c759] [&_.kpi-icon]:text-[#34c759] [&_.kpi-icon]:bg-[#34c759]/12",
    expense:
      "border-black/[0.06] dark:border-white/[0.08] bg-card/90 dark:bg-card/95 [&_.kpi-value]:text-[#ff3b30] [&_.kpi-icon]:text-[#ff3b30] [&_.kpi-icon]:bg-[#ff3b30]/12",
    profit: signedNegative
      ? "border-black/[0.06] dark:border-white/[0.08] bg-card/90 dark:bg-card/95 [&_.kpi-value]:text-[#ff3b30] [&_.kpi-icon]:text-[#ff3b30] [&_.kpi-icon]:bg-[#ff3b30]/12"
      : "border-black/[0.06] dark:border-white/[0.08] bg-card/90 dark:bg-card/95 [&_.kpi-value]:text-[#34c759] [&_.kpi-icon]:text-[#34c759] [&_.kpi-icon]:bg-[#34c759]/12",
    margin: signedNegative
      ? "border-black/[0.06] dark:border-white/[0.08] bg-card/90 dark:bg-card/95 [&_.kpi-value]:text-[#ff3b30] [&_.kpi-icon]:text-[#ff3b30] [&_.kpi-icon]:bg-[#ff3b30]/12"
      : "border-black/[0.06] dark:border-white/[0.08] bg-card/90 dark:bg-card/95 [&_.kpi-value]:text-[#34c759] [&_.kpi-icon]:text-[#34c759] [&_.kpi-icon]:bg-[#34c759]/12",
    balance:
      "border-black/[0.06] dark:border-white/[0.08] bg-card/90 dark:bg-card/95 [&_.kpi-value]:text-[#007aff] dark:[&_.kpi-value]:text-[#0a84ff] [&_.kpi-icon]:text-[#007aff] [&_.kpi-icon]:bg-[#007aff]/12",
    capital:
      "border-black/[0.06] dark:border-white/[0.08] bg-card/90 dark:bg-card/95 [&_.kpi-value]:text-foreground [&_.kpi-icon]:text-[#ff9500] [&_.kpi-icon]:bg-[#ff9500]/12",
    count:
      "border-black/[0.06] dark:border-white/[0.08] bg-card/90 dark:bg-card/95 [&_.kpi-value]:text-foreground [&_.kpi-icon]:text-muted-foreground [&_.kpi-icon]:bg-black/[0.05] dark:[&_.kpi-icon]:bg-white/[0.08]",
  };

  return (
    <Comp
      onClick={onClick}
      className={cn(
        "metric-card card-animate text-left w-full h-full rounded-2xl border p-4 min-w-0 flex flex-col backdrop-blur-xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] active:scale-[0.98]",
        toneStyles[tone],
        ACCENT_KPI_HOVER_CLASS[theme.accent],
        onClick && "cursor-pointer",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-2 shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight line-clamp-2 min-h-[26px] pr-1 flex-1">
          {label}
        </p>
        <div className="kpi-icon flex h-8.5 w-8.5 items-center justify-center rounded-xl shrink-0 [&_svg]:h-4.5 [&_svg]:w-4.5">
          {icon}
        </div>
      </div>

      <div className="flex-1 flex items-center min-h-[40px] mt-1.5 py-0.5">
        <KpiAutoFitValue value={value} />
      </div>

      <p className="text-[10px] text-muted-foreground/80 mt-1 min-h-[14px] truncate shrink-0 font-medium">
        {hint || "\u00A0"}
      </p>
    </Comp>
  );
}

export function ModuleResponsiveTable({
  headers,
  rows,
  emptyLabel = "Chưa có dữ liệu",
}: {
  headers: string[];
  rows: React.ReactNode[][];
  emptyLabel?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-black/[0.02] dark:bg-white/[0.03] border-b border-black/[0.04] dark:border-white/[0.06]">
              {headers.map((h) => (
                <th key={h} className={cn(moduleTableHeadClass, "text-left")}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((cells, i) => (
              <tr
                key={i}
                data-table-row
                className="border-b border-black/[0.04] dark:border-white/[0.06] hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
              >
                {cells.map((cell, j) => (
                  <td key={j} className={cn("py-3.5 px-4", moduleTableBodyClass)}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden divide-y divide-black/[0.04] dark:divide-white/[0.06]">
        {rows.map((cells, i) => (
          <div key={i} className="p-4 space-y-2.5">
            {headers.map((h, j) => (
              <div
                key={h}
                className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-3 text-sm min-w-0"
              >
                <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider shrink-0">
                  {h}
                </span>
                <span className="text-foreground/90 min-w-0 break-words sm:text-right">
                  {cells[j]}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

export function AccentButton({
  module,
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & { module: ModuleId }) {
  const theme = getModuleTheme(module);
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold transition-all active:scale-[0.97]",
        ACCENT_BTN_CLASS[theme.accent],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

