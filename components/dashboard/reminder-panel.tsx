"use client";

import Link from "next/link";
import { Bell, CheckCircle2 } from "lucide-react";
import { displayMoney } from "@/lib/format-money";
import { formatDisplayDate } from "@/lib/format-date";
import type { ReminderItem } from "@/lib/types";
import { AccentButton } from "./module-shell";
import { cn } from "@/lib/utils";

export function ReminderPanel({
  items,
  onComplete,
  compact = false,
}: {
  items: ReminderItem[];
  onComplete?: (scheduleId: string) => void;
  compact?: boolean;
}) {
  if (items.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl border border-border bg-muted/40 p-4 text-center",
          compact && "p-3",
        )}
      >
        <p className="text-sm text-muted-foreground">
          Không có nhắc hẹn trong khoảng thời gian này
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map(({ schedule, dueDate, daysUntil, urgency }) => {
        const cardContent = (
          <div
            className={cn(
              "rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-200",
              urgency === "overdue" && "border-transparent bg-[var(--pale-red)]",
              urgency === "today" && "border-transparent bg-[var(--pale-amber)]",
              urgency === "soon" && "border-border bg-muted/40",
              urgency === "upcoming" && "border-border bg-card",
              !onComplete && "hover:brightness-95 hover:border-foreground/20 active:scale-[0.99] cursor-pointer",
            )}
          >
            <div className="flex items-start gap-3 min-w-0">
              <Bell
                className={cn(
                  "h-4 w-4 mt-0.5 shrink-0",
                  urgency === "overdue"
                    ? "text-expense"
                    : "text-muted-foreground",
                )}
              />
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">
                  {schedule.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {schedule.direction === "collect" ? "Phải thu" : "Phải chi"} ·{" "}
                  {formatDisplayDate(dueDate)}
                  {daysUntil < 0
                    ? ` · Quá hạn ${Math.abs(daysUntil)} ngày`
                    : daysUntil === 0
                      ? " · Hôm nay"
                      : ` · Còn ${daysUntil} ngày`}
                  {schedule.amount ? ` · ${displayMoney(schedule.amount)}` : ""}
                </p>
              </div>
            </div>
            {onComplete && (
              <AccentButton
                module="cashflow"
                className="shrink-0 text-xs h-8 w-full sm:w-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete(schedule.id);
                }}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Đã {schedule.direction === "collect" ? "thu" : "chi"}
              </AccentButton>
            )}
          </div>
        );

        if (!onComplete) {
          return (
            <Link
              key={`${schedule.id}-${dueDate}`}
              href="/dashboard/reminders"
              className="block decoration-transparent text-inherit"
            >
              {cardContent}
            </Link>
          );
        }

        return <div key={`${schedule.id}-${dueDate}`}>{cardContent}</div>;
      })}
    </div>
  );
}
