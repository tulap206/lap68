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
        "rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-card/90 dark:bg-card/95 backdrop-blur-xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] overflow-hidden text-left transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] active:scale-[0.99]",
        className,
      )}
    >
      <div className="px-5 py-3.5 border-b border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#34c759]/12 text-[#34c759]">
            <Coins className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground tracking-tight">Vốn & Giá trị ròng</p>
            <p className="text-[11px] text-muted-foreground">
              Vốn cố định độc lập với biến động chi phí
            </p>
          </div>
        </div>
        {onClick && (
          <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
        )}
      </div>

      <div
        className={cn(
          "grid gap-px bg-black/[0.04] dark:bg-white/[0.06]",
          compact
            ? "grid-cols-1 min-[420px]:grid-cols-3"
            : "grid-cols-1 sm:grid-cols-3",
        )}
      >
        {items.map((item) => (
          <div key={item.label} className="bg-card/90 dark:bg-card/95 px-4.5 py-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {item.label}
            </p>
            <p
              className={cn(
                "font-mono font-bold tabular-nums mt-1",
                compact ? "text-sm" : "text-base sm:text-lg",
                item.highlight ? "text-[#34c759]" : "text-foreground",
              )}
            >
              {displayMoney(item.value)}
            </p>
            {!compact && (
              <p className="text-[10px] text-muted-foreground/80 mt-0.5 font-medium">
                {item.hint}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

