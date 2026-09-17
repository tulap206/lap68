"use client";

import Link from "next/link";
import { Bell, CheckCircle2, AlertTriangle, Clock, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { displayMoney } from "@/lib/format-money";
import { formatDisplayDate } from "@/lib/format-date";
import type { ReminderItem } from "@/lib/types";
import { AccentButton } from "./module-shell";
import { cn } from "@/lib/utils";

export function ReminderPanel({
  items,
  onComplete,
  compact = false,
  businessName,
}: {
  items: ReminderItem[];
  onComplete?: (scheduleId: string) => void;
  compact?: boolean;
  businessName?: string;
}) {
  if (items.length === 0) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-dashed border-border bg-card p-6 text-center",
          compact && "p-4",
        )}
      >
        <p className="text-sm text-muted-foreground">
          Không có nhắc hẹn trong khoảng thời gian này
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map(({ schedule, dueDate, daysUntil, urgency }) => {
        const isCollect = schedule.direction === "collect";

        const cardContent = (
          <div
            className={cn(
              "rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-all duration-200",
              urgency === "overdue" &&
                "border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/20 hover:border-rose-500/50",
              urgency === "today" &&
                "border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 hover:border-amber-500/50",
              urgency === "soon" && "border-border bg-card hover:border-foreground/20",
              urgency === "upcoming" && "border-border bg-card/60 hover:border-foreground/20",
              !onComplete && "hover:shadow-sm active:scale-[0.99] cursor-pointer",
            )}
          >
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={cn(
                  "p-2 rounded-xl shrink-0 mt-0.5",
                  urgency === "overdue"
                    ? "bg-rose-500/15 text-rose-500"
                    : urgency === "today"
                      ? "bg-amber-500/15 text-amber-500"
                      : isCollect
                        ? "bg-income/10 text-income"
                        : "bg-muted text-muted-foreground",
                )}
              >
                {urgency === "overdue" ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : urgency === "today" ? (
                  <Clock className="h-4 w-4" />
                ) : isCollect ? (
                  <ArrowDownLeft className="h-4 w-4" />
                ) : (
                  <ArrowUpRight className="h-4 w-4" />
                )}
              </div>

              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider",
                      isCollect
                        ? "bg-income/15 text-income"
                        : "bg-expense/15 text-expense",
                    )}
                  >
                    {isCollect ? "Thu" : "Chi"}
                  </span>

                  <p className="font-semibold text-sm sm:text-base text-foreground truncate">
                    {schedule.title}
                  </p>

                  {businessName && (
                    <span className="text-xs text-muted-foreground">
                      ({businessName})
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/80">
                    Hạn: {formatDisplayDate(dueDate)}
                  </span>
                  <span>•</span>
                  <span
                    className={cn(
                      "font-medium",
                      urgency === "overdue" && "text-rose-500 font-bold",
                      urgency === "today" && "text-amber-500 font-bold",
                    )}
                  >
                    {daysUntil < 0
                      ? `Quá hạn ${Math.abs(daysUntil)} ngày`
                      : daysUntil === 0
                        ? "Đến hạn hôm nay"
                        : `Còn ${daysUntil} ngày`}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
              {schedule.amount ? (
                <span
                  className={cn(
                    "font-mono font-bold text-sm sm:text-base tabular-nums",
                    isCollect ? "text-income" : "text-expense",
                  )}
                >
                  {isCollect ? "+" : "-"}
                  {displayMoney(schedule.amount)}
                </span>
              ) : null}

              {onComplete && (
                <AccentButton
                  module="cashflow"
                  className="text-xs h-8.5 px-3.5 shrink-0 gap-1.5 font-semibold"
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete(schedule.id);
                  }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Đã {isCollect ? "thu" : "chi"}
                </AccentButton>
              )}
            </div>
          </div>
        );

        if (!onComplete) {
          return (
            <Link
              key={`${schedule.id}-${dueDate}`}
              href="/dashboard/calendar?view=agenda"
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
