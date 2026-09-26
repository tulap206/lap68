"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TablePagination } from "@/components/dashboard/table-pagination";
import { BusinessIcon } from "@/components/dashboard/business-icon";
import { displayMoney } from "@/lib/format-money";
import { formatDisplayDate, parseDisplayDate } from "@/lib/format-date";
import type { Schedule, ScheduleDirection } from "@/lib/types";
import {
  CalendarClock,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_MAP: Record<string, { label: string; class: string; dot: string }> = {
  pending: {
    label: "Chờ xử lý",
    class: "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40",
    dot: "bg-blue-500",
  },
  overdue: {
    label: "Quá hạn",
    class: "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/40 font-bold",
    dot: "bg-rose-500 animate-pulse",
  },
  done: {
    label: "Đã hoàn tất",
    class: "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40",
    dot: "bg-emerald-500",
  },
  skipped: {
    label: "Bỏ qua",
    class: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
    dot: "bg-zinc-400",
  },
  cancelled: {
    label: "Đã hủy",
    class: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
    dot: "bg-zinc-400",
  },
};

type StatusFilter = "all" | "overdue" | "pending" | "done";
type DirectionFilter = "all" | "collect" | "pay";

export function SchedulesSummaryDialog({
  open,
  onOpenChange,
  schedules,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedules: Schedule[];
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>("all");
  const pageSize = 12;

  // Sort schedules: Overdue first, then upcoming by due_date ascending
  const sortedSchedules = useMemo(() => {
    return [...schedules].sort((a, b) => {
      if (a.status === "overdue" && b.status !== "overdue") return -1;
      if (b.status === "overdue" && a.status !== "overdue") return 1;

      const dateA = parseDisplayDate(a.due_date)?.getTime() || 0;
      const dateB = parseDisplayDate(b.due_date)?.getTime() || 0;
      return dateA - dateB;
    });
  }, [schedules]);

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    return sortedSchedules.filter((s) => {
      // Status filter
      if (statusFilter === "overdue" && s.status !== "overdue") return false;
      if (statusFilter === "pending" && s.status !== "pending") return false;
      if (statusFilter === "done" && s.status !== "done") return false;

      // Direction filter
      if (directionFilter !== "all" && s.direction !== directionFilter) return false;

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const title = (s.title || "").toLowerCase();
        const biz = (s.business?.name || "").toLowerCase();
        const cat = (s.category?.name || "").toLowerCase();
        const cp = (s.counterparty?.name || "").toLowerCase();
        const amount = String(s.amount || 0);
        if (!title.includes(q) && !biz.includes(q) && !cat.includes(q) && !cp.includes(q) && !amount.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [sortedSchedules, statusFilter, directionFilter, search]);

  // Aggregate stats
  const { totalCount, overdueCount, pendingIncome, pendingExpense } = useMemo(() => {
    let overdue = 0;
    let pIncome = 0;
    let pExpense = 0;

    schedules.forEach((s) => {
      const amt = s.amount || 0;
      if (s.status === "overdue") overdue++;
      if (["pending", "overdue"].includes(s.status)) {
        if (s.direction === "collect") pIncome += amt;
        else pExpense += amt;
      }
    });

    return {
      totalCount: schedules.length,
      overdueCount: overdue,
      pendingIncome: pIncome,
      pendingExpense: pExpense,
    };
  }, [schedules]);

  const totalItems = filteredSchedules.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIdx = (page - 1) * pageSize;
  const paginatedSchedules = filteredSchedules.slice(startIdx, startIdx + pageSize);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (v) {
          setPage(1);
          setSearch("");
          setStatusFilter("all");
          setDirectionFilter("all");
        }
      }}
    >
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-hidden flex flex-col p-0 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl bg-card shadow-2xl text-foreground font-sans">
        {/* 1. DIALOG HEADER & SUMMARY BANNER */}
        <div className="p-5 sm:p-6 border-b border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 flex items-center justify-center shrink-0 shadow-xs">
                <CalendarClock className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  Tổng hợp lịch thu chi & Nhắc hẹn
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Lịch định kỳ và một lần trên toàn bộ các mảng việc
                </DialogDescription>
              </div>
            </div>

            {/* Quick stats pills */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
              {overdueCount > 0 && (
                <div className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/50 text-xs">
                  <span className="text-rose-700 dark:text-rose-400 font-bold flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 animate-pulse" /> {overdueCount} quá hạn
                  </span>
                </div>
              )}
              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 text-xs">
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <ArrowDownLeft className="h-3 w-3" /> Thu: {displayMoney(pendingIncome)}
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 text-xs">
                <span className="text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" /> Chi: {displayMoney(pendingExpense)}
                </span>
              </div>
            </div>
          </div>

          {/* 2. SMART SEARCH & FILTER TOOLBAR */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-1">
            {/* Search */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Tìm tiêu đề, mảng việc, đối tác..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-9 text-xs rounded-xl bg-card border-zinc-200 dark:border-zinc-800"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
              <div className="apple-segmented flex">
                <button
                  type="button"
                  onClick={() => { setStatusFilter("all"); setPage(1); }}
                  className={cn("apple-segmented-item px-2.5 py-1 text-xs", statusFilter === "all" && "active")}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => { setStatusFilter("overdue"); setPage(1); }}
                  className={cn("apple-segmented-item px-2.5 py-1 text-xs text-rose-600 dark:text-rose-400", statusFilter === "overdue" && "active")}
                >
                  Quá hạn
                </button>
                <button
                  type="button"
                  onClick={() => { setStatusFilter("pending"); setPage(1); }}
                  className={cn("apple-segmented-item px-2.5 py-1 text-xs", statusFilter === "pending" && "active")}
                >
                  Chờ xử lý
                </button>
                <button
                  type="button"
                  onClick={() => { setStatusFilter("done"); setPage(1); }}
                  className={cn("apple-segmented-item px-2.5 py-1 text-xs", statusFilter === "done" && "active")}
                >
                  Hoàn tất
                </button>
              </div>

              {/* Direction Switcher */}
              <div className="apple-segmented hidden sm:flex">
                <button
                  type="button"
                  onClick={() => { setDirectionFilter("all"); setPage(1); }}
                  className={cn("apple-segmented-item px-2.5 py-1 text-xs", directionFilter === "all" && "active")}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => { setDirectionFilter("collect"); setPage(1); }}
                  className={cn("apple-segmented-item px-2.5 py-1 text-xs text-emerald-600 dark:text-emerald-400", directionFilter === "collect" && "active")}
                >
                  Thu
                </button>
                <button
                  type="button"
                  onClick={() => { setDirectionFilter("pay"); setPage(1); }}
                  className={cn("apple-segmented-item px-2.5 py-1 text-xs text-rose-600 dark:text-rose-400", directionFilter === "pay" && "active")}
                >
                  Chi
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. SCHEDULES TABLE */}
        <div className="flex-1 overflow-y-auto">
          {filteredSchedules.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-muted-foreground flex items-center justify-center mx-auto">
                <Calendar className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">Không có lịch thu chi nào</p>
              <p className="text-xs text-muted-foreground">Thử điều chỉnh lại bộ lọc tìm kiếm</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-muted-foreground font-semibold">
                  <th className="py-3 px-4 w-12 text-center">#STT</th>
                  <th className="py-3 px-4">Tiêu đề lịch</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Mảng việc</th>
                  <th className="py-3 px-4">Hạn thanh toán</th>
                  <th className="py-3 px-4 text-right">Số tiền</th>
                  <th className="py-3 px-4 text-center w-28">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {paginatedSchedules.map((s, idx) => {
                  const stt = startIdx + idx + 1;
                  const isCollect = s.direction === "collect";
                  const cfg = STATUS_MAP[s.status] || STATUS_MAP.pending;
                  const freq = s.recurrence?.frequency;

                  return (
                    <tr
                      key={s.id}
                      className={cn(
                        "hover:bg-zinc-50/80 dark:hover:bg-zinc-900/30 transition-colors",
                        s.status === "overdue" && "bg-rose-50/20 dark:bg-rose-950/10"
                      )}
                    >
                      {/* #STT */}
                      <td className="py-3.5 px-4 text-center font-mono text-[11px] text-muted-foreground">
                        {stt}
                      </td>

                      {/* Tiêu đề */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <p className="font-bold text-foreground truncate text-xs">{s.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
                          <span className={cn(
                            "font-semibold",
                            isCollect ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                          )}>
                            {isCollect ? "Khoản thu" : "Khoản chi"}
                          </span>
                          {s.category?.name && (
                            <span>· {s.category.name}</span>
                          )}
                          {s.counterparty?.name && (
                            <span className="truncate">· {s.counterparty.name}</span>
                          )}
                        </div>
                      </td>

                      {/* Mảng việc */}
                      <td className="py-3.5 px-4 hidden sm:table-cell">
                        {s.business ? (
                          <div className="flex items-center gap-1.5">
                            <BusinessIcon name={s.business.name} color={s.business.color} size="sm" />
                            <span className="font-semibold text-xs text-foreground truncate max-w-[130px]">
                              {s.business.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Hạn thanh toán */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-foreground/90 font-medium text-xs block">
                          {formatDisplayDate(s.due_date)}
                        </span>
                        {freq && (
                          <span className="text-[10px] text-muted-foreground capitalize">
                            Lặp lại {freq === "monthly" ? "hàng tháng" : freq === "weekly" ? "hàng tuần" : freq === "yearly" ? "hàng năm" : "hàng ngày"}
                          </span>
                        )}
                      </td>

                      {/* Số tiền */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-xs sm:text-sm whitespace-nowrap">
                        <span className={isCollect ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                          {displayMoney(s.amount || 0)}
                        </span>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] border shadow-2xs whitespace-nowrap",
                            cfg.class
                          )}
                        >
                          <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* 4. FOOTER & PAGINATION */}
        <div className="border-t border-zinc-200/80 dark:border-zinc-800 bg-card">
          <TablePagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
