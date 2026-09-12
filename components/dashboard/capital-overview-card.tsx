"use client";

import { displayMoney } from "@/lib/format-money";
import type { CapitalSnapshot } from "@/lib/capital";
import { cn } from "@/lib/utils";
import { Coins, ChevronRight } from "lucide-react";

export function CapitalOverviewCard({
  snapshot,
  compact = false,
  className,
  onClick,
}: {
  snapshot: CapitalSnapshot;
  compact?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  const items = [
    {
      label: "Vốn",
      value: snapshot.base_capital,
      hint: "Cố định nạp/rút",
      highlight: true,
    },
    { label: "Lợi nhuận KD", value: snapshot.net_profit, hint: "Thu − chi" },
    {
      label: "Giá trị ròng",
      value: snapshot.available_capital,
      hint: "Vốn + lãi/lỗ",
    },
  ];

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => onClick && e.key === "Enter" && onClick()}
      className={cn(
        "rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card shadow-xs overflow-hidden text-left transition-all duration-150",
        onClick && "cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-[0.99]",
        className,
      )}
    >
      <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40">
            <Coins className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Vốn & Giá trị ròng</p>
            <p className="text-[11px] text-zinc-500">
              Vốn cố định độc lập với biến động chi phí
            </p>
          </div>
        </div>
        {onClick && (
          <ChevronRight className="h-4 w-4 text-zinc-400" />
        )}
      </div>

      <div
        className={cn(
          "grid gap-px bg-zinc-100 dark:bg-zinc-800",
          compact
            ? "grid-cols-1 min-[420px]:grid-cols-3"
            : "grid-cols-1 sm:grid-cols-3",
        )}
      >
        {items.map((item) => (
          <div key={item.label} className="bg-card px-4.5 py-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              {item.label}
            </p>
            <p
              className={cn(
                "font-mono font-bold tabular-nums mt-1",
                compact ? "text-sm" : "text-base sm:text-lg",
                item.highlight ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-800 dark:text-zinc-200",
              )}
            >
              {displayMoney(item.value)}
            </p>
            {!compact && (
              <p className="text-[10px] text-zinc-400 mt-0.5 font-medium">
                {item.hint}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

