"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ModuleResponsiveTable,
} from "@/components/dashboard/module-shell";
import { TablePagination } from "@/components/dashboard/table-pagination";
import { displayMoney } from "@/lib/format-money";
import { formatDisplayDate, parseDisplayDate } from "@/lib/format-date";
import type { Schedule } from "@/lib/types";

function ScheduleStatusBadge({ status }: { status: Schedule["status"] }) {
  const labels: Record<string, string> = {
    pending: "Chờ",
    done: "Đã xong",
    skipped: "Bỏ qua",
    overdue: "Quá hạn",
    cancelled: "Đã hủy",
  };
  
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    done: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    skipped: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
    overdue: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
    cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status] || ""}`}>
      {labels[status] || status}
    </span>
  );
}

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
  const pageSize = 10;

  // Sort schedules by due_date ascending (from earliest to latest date)
  const sortedSchedules = [...schedules].sort((a, b) => {
    const dateA = parseDisplayDate(a.due_date)?.getTime() || 0;
    const dateB = parseDisplayDate(b.due_date)?.getTime() || 0;
    return dateA - dateB;
  });

  const totalItems = sortedSchedules.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  const startIdx = (page - 1) * pageSize;
  const paginatedSchedules = sortedSchedules.slice(startIdx, startIdx + pageSize);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      onOpenChange(v);
      if (v) setPage(1); // Reset page on open
    }}>
      <DialogContent className="max-w-4xl w-[95vw] md:w-full">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-foreground/60 to-foreground/20 rounded-t-2xl" />
        <DialogHeader>
          <DialogTitle>Tổng hợp lịch thu chi</DialogTitle>
          <DialogDescription>
            Danh sách lịch thu chi định kỳ và một lần trên toàn bộ các công việc.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 border border-border rounded-xl overflow-hidden bg-card">
          <ModuleResponsiveTable
            headers={["Tiêu đề", "Công việc", "Hướng", "Hạn thanh toán", "Số tiền", "Trạng thái"]}
            rows={paginatedSchedules.map((s) => [
              <span key={`title-${s.id}`} className="font-semibold text-foreground">
                {s.title}
              </span>,
              <span
                key={`biz-${s.id}`}
                className="font-medium px-2 py-0.5 rounded text-xs"
                style={{
                  backgroundColor: s.business?.color ? `${s.business.color}15` : "rgba(128,128,128,0.1)",
                  color: s.business?.color || "inherit",
                }}
              >
                {s.business?.name || "—"}
              </span>,
              <span
                key={`direction-${s.id}`}
                className={`font-semibold ${s.direction === "collect" ? "text-income" : "text-expense"}`}
              >
                {s.direction === "collect" ? "Thu" : "Chi"}
              </span>,
              formatDisplayDate(s.due_date),
              <span key={`amount-${s.id}`} className="font-mono">
                {s.amount ? displayMoney(s.amount) : "—"}
              </span>,
              <ScheduleStatusBadge key={`status-${s.id}`} status={s.status} />,
            ])}
          />

          <TablePagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={handlePageChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
