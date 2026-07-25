"use client";

import { displayMoney } from "@/lib/format-money";
import { MODULE_CHART_PALETTE } from "@/lib/module-theme";
import { cn } from "@/lib/utils";
import type { TooltipProps } from "recharts";

export const CHART_COLORS = {
  income: "#346538",
  incomeMuted: "#4a7c4d",
  expense: "#9f2f2d",
  expenseMuted: "#b54744",
  neutral: "#787774",
  grid: "rgba(28, 28, 26, 0.08)",
  axis: "#d4d3ce",
  tick: "#6b6b66",
  tooltipBg: "rgba(255, 255, 255, 0.98)",
  tooltipBorder: "rgba(229, 228, 223, 1)",
} as const;

export const CHART_MARGIN = { top: 8, right: 8, left: 0, bottom: 0 };
export const CHART_MARGIN_LEFT = { top: 8, right: 12, left: 4, bottom: 0 };

export const AXIS_TICK = {
  fontSize: 10,
  fill: CHART_COLORS.tick,
  fontFamily: "var(--font-sans)",
};
export const AXIS_LINE = { stroke: CHART_COLORS.axis };
export const GRID_HORIZONTAL = {
  stroke: CHART_COLORS.grid,
  strokeDasharray: "4 6",
  vertical: false as const,
};

export function formatChartAxisValue(val: number) {
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}T`;
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}Tr`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
  return val.toLocaleString("vi-VN");
}

export function formatChartPercent(value: number, total: number) {
  if (total <= 0) return "0%";
  const p = (value / total) * 100;
  if (p > 0 && p < 1) return "<1%";
  if (p < 10) return `${p.toFixed(1)}%`;
  return `${Math.round(p)}%`;
}

type PayloadItem = {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string;
};

export function ChartTooltipContent({
  active,
  payload,
  label,
}: TooltipProps<number, string> & { payload?: PayloadItem[]; label?: string }) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-lg border px-3 py-2.5 shadow-[0_8px_24px_rgba(28,28,26,0.1)] min-w-[148px]"
      style={{
        background: CHART_COLORS.tooltipBg,
        borderColor: CHART_COLORS.tooltipBorder,
      }}
    >
      {label && (
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2">
          {label}
        </p>
      )}
      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div
            key={String(entry.dataKey)}
            className="flex items-center justify-between gap-4"
          >
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className="h-1.5 w-1.5 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="text-xs font-mono font-semibold text-foreground tabular-nums">
              {displayMoney(Number(entry.value ?? 0))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartLegendPills({
  items,
}: {
  items: { key: string; label: string; color: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-3 border-t border-border">
      {items.map((item) => (
        <span
          key={item.key}
          className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"
        >
          <span
            className="h-2 w-2 rounded-[3px] shrink-0"
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export function ChartShell({
  title,
  description,
  accent = "emerald",
  children,
  footer,
  className,
}: {
  title: string;
  description?: string;
  accent?: "emerald" | "red" | "blue" | "amber";
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  const accentDot =
    accent === "red"
      ? CHART_COLORS.expense
      : accent === "amber"
        ? "#f59e0b"
        : accent === "blue"
          ? "#a1a1aa"
          : CHART_COLORS.income;

  return (
    <div
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card ",
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-3 px-4 pt-3.5 pb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full shrink-0"
              style={{ backgroundColor: accentDot }}
            />
            <h3 className="text-sm font-semibold text-foreground tracking-tight truncate">
              {title}
            </h3>
          </div>
          {description && (
            <p className="text-[11px] text-muted-foreground mt-0.5 pl-3.5">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="px-3 pb-3 flex-1 flex flex-col min-h-0">{children}</div>
      {footer && <div className="px-4 pb-3.5">{footer}</div>}
    </div>
  );
}

export function ChartEmpty({ label }: { label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
      <div className="relative mb-3 h-10 w-10">
        <div className="absolute inset-0 rounded-full border border-border" />
        <div className="absolute inset-[3px] rounded-full border border-dashed border-border/80" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-1 w-1 rounded-full bg-muted-foreground" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function incomePiePalette() {
  return ["#346538", "#4a7c4d", "#5f9162", "#a8c5aa", "#1f3d21", "#787774"];
}

export function expensePiePalette() {
  return ["#9f2f2d", "#b54744", "#c96b68", "#e8b4b2", "#5c1a18", "#787774"];
}

export { MODULE_CHART_PALETTE };
