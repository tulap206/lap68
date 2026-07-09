"use client"

import { Bell, CheckCircle2 } from "lucide-react"
import { displayMoney } from "@/lib/format-money"
import { formatDisplayDate } from "@/lib/format-date"
import type { ReminderItem } from "@/lib/types"
import { AccentButton } from "./module-shell"
import { cn } from "@/lib/utils"

export function ReminderPanel({
  items,
  onComplete,
  compact = false,
}: {
  items: ReminderItem[]
  onComplete?: (scheduleId: string) => void
  compact?: boolean
}) {
  if (items.length === 0) {
    return (
      <div className={cn("rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-center", compact && "p-3")}>
        <p className="text-sm text-zinc-500">Không có nhắc hẹn trong khoảng thời gian này</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map(({ schedule, dueDate, daysUntil, urgency }) => (
        <div
          key={`${schedule.id}-${dueDate}`}
          className={cn(
            "rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3",
            urgency === "overdue" && "border-red-500/30 bg-red-500/5",
            urgency === "today" && "border-amber-500/30 bg-amber-500/5",
            urgency === "soon" && "border-zinc-700 bg-zinc-900/50",
            urgency === "upcoming" && "border-zinc-800 bg-card/50"
          )}
        >
          <div className="flex items-start gap-3 min-w-0">
            <Bell className={cn("h-4 w-4 mt-0.5 shrink-0", urgency === "overdue" ? "text-red-400" : "text-zinc-400")} />
            <div className="min-w-0">
              <p className="font-semibold text-zinc-100 truncate">{schedule.title}</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {schedule.direction === "collect" ? "Phải thu" : "Phải chi"} · {formatDisplayDate(dueDate)}
                {daysUntil < 0 ? ` · Quá hạn ${Math.abs(daysUntil)} ngày` : daysUntil === 0 ? " · Hôm nay" : ` · Còn ${daysUntil} ngày`}
                {schedule.amount ? ` · ${displayMoney(schedule.amount)}` : ""}
              </p>
            </div>
          </div>
          {onComplete && (
            <AccentButton module="cashflow" className="shrink-0 text-xs h-8 w-full sm:w-auto" onClick={() => onComplete(schedule.id)}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Đã {schedule.direction === "collect" ? "thu" : "chi"}
            </AccentButton>
          )}
        </div>
      ))}
    </div>
  )
}
