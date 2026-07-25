"use client";

import { displayMoney } from "@/lib/format-money";
import type { CapitalSnapshot } from "@/lib/capital";
import { cn } from "@/lib/utils";

export function CapitalOverviewCard({
  snapshot,
  compact = false,
  className,
}: {
  snapshot: CapitalSnapshot;
  compact?: boolean;
  className?: string;
}) {
  const items = [
    {
      label: "Vốn",
      value: snapshot.base_capital,
      hint: "Cố định — chỉ đổi khi nạp/rút",
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
      className={cn(
        "rounded-xl border border-border bg-card overflow-hidden",
        className,
      )}
    >
      <div className="px-4 py-3 border-b border-border">
        <p className="text-sm font-semibold text-foreground">Vốn & số dư</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Vốn cố định; lãi/lỗ không làm hao vốn
        </p>
      </div>
      <div
        className={cn(
          "grid gap-px bg-muted/50",
          compact
            ? "grid-cols-1 min-[420px]:grid-cols-3"
            : "grid-cols-1 sm:grid-cols-3",
        )}
      >
        {items.map((item) => (
          <div key={item.label} className="bg-card px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {item.label}
            </p>
            <p
              className={cn(
                "font-mono font-bold tabular-nums mt-1",
                compact ? "text-sm" : "text-base",
                item.highlight ? "text-income" : "text-foreground/90",
              )}
            >
              {displayMoney(item.value)}
            </p>
            {!compact && (
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                {item.hint}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
