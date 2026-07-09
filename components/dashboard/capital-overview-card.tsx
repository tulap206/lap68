"use client"

import { displayMoney } from "@/lib/format-money"
import type { CapitalSnapshot } from "@/lib/capital"
import { cn } from "@/lib/utils"

export function CapitalOverviewCard({
  snapshot,
  compact = false,
  className,
}: {
  snapshot: CapitalSnapshot
  compact?: boolean
  className?: string
}) {
  const items = [
    { label: "Vốn gốc", value: snapshot.base_capital, hint: "Ban đầu + nạp/rút" },
    { label: "Lợi nhuận KD", value: snapshot.net_profit, hint: "Thu − chi" },
    { label: "Vốn hiện tại", value: snapshot.available_capital, hint: "Gốc + lãi", highlight: true },
  ]

  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-800/90 bg-card/60 backdrop-blur-sm overflow-hidden",
        className
      )}
    >
      <div className="px-4 py-3 border-b border-zinc-800/80">
        <p className="text-sm font-semibold text-zinc-100">Vốn & số dư</p>
        <p className="text-[11px] text-zinc-500 mt-0.5">Vốn gốc + lợi nhuận tích lũy từ thu chi</p>
      </div>
      <div className={cn("grid gap-px bg-zinc-800/50", compact ? "grid-cols-3" : "grid-cols-1 sm:grid-cols-3")}>
        {items.map((item) => (
          <div key={item.label} className="bg-card/80 px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">{item.label}</p>
            <p
              className={cn(
                "font-mono font-bold tabular-nums mt-1",
                compact ? "text-sm" : "text-base",
                item.highlight ? "text-green-400" : "text-zinc-200"
              )}
            >
              {displayMoney(item.value)}
            </p>
            {!compact && <p className="text-[10px] text-zinc-600 mt-0.5">{item.hint}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
