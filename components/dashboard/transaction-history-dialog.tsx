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
import {
  TransactionTypeBadge,
  PaymentMethodLabel,
} from "@/components/dashboard/cashflow-ui";
import { TablePagination } from "@/components/dashboard/table-pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { displayMoney } from "@/lib/format-money";
import { formatDisplayDate, parseDisplayDate } from "@/lib/format-date";
import type { Transaction } from "@/lib/types";

export function TransactionHistoryDialog({
  open,
  onOpenChange,
  transactions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: Transaction[];
}) {
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const pageSize = 10;
  
  // Sort transactions to ensure the newest ones are on top (by transaction_date, then by created_at)
  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = parseDisplayDate(a.transaction_date)?.getTime() || 0;
    const dateB = parseDisplayDate(b.transaction_date)?.getTime() || 0;
    if (dateB !== dateA) return dateB - dateA;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Filter transactions by date range
  const filteredTransactions = sortedTransactions.filter((t) => {
    const txDate = parseDisplayDate(t.transaction_date);
    if (!txDate) return true;

    txDate.setHours(0, 0, 0, 0);

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (txDate < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);
      if (txDate > end) return false;
    }
    return true;
  });

  const totalItems = filteredTransactions.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  
  // Slice transactions for the current page
  const startIdx = (page - 1) * pageSize;
  const paginatedTransactions = filteredTransactions.slice(startIdx, startIdx + pageSize);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      onOpenChange(v);
      if (v) {
        setPage(1); // Reset page on open
        setStartDate("");
        setEndDate("");
      }
    }}>
      <DialogContent className="max-w-4xl w-[95vw] md:w-full">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-foreground/60 to-foreground/20 rounded-t-2xl" />
        <DialogHeader>
          <DialogTitle>Lịch sử giao dịch gần đây</DialogTitle>
          <DialogDescription>
            Danh sách tất cả các giao dịch thu chi của bạn trên toàn bộ các công việc.
          </DialogDescription>
        </DialogHeader>

        {/* Date Filter Panel */}
        <div className="flex flex-wrap items-end gap-3 mt-4 mb-2">
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <span className="text-xs font-semibold text-muted-foreground">Từ ngày</span>
            <Input
              type="date"
              className="h-9 w-full sm:w-40 font-medium"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <span className="text-xs font-semibold text-muted-foreground">Đến ngày</span>
            <Input
              type="date"
              className="h-9 w-full sm:w-40 font-medium"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
            />
          </div>
          {(startDate || endDate) && (
            <Button
              variant="ghost"
              className="h-9 text-xs px-3 font-semibold text-expense hover:text-expense hover:bg-rose-50 dark:hover:bg-rose-950/20"
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setPage(1);
              }}
            >
              Xóa bộ lọc
            </Button>
          )}
        </div>

        <div className="border border-border rounded-xl overflow-hidden bg-card mt-2">
          <ModuleResponsiveTable
            headers={["Ngày", "Công việc", "Loại", "Mô tả", "Số tiền", "Thanh toán"]}
            rows={paginatedTransactions.map((t) => [
              formatDisplayDate(t.transaction_date),
              <span
                key={`biz-${t.id}`}
                className="font-medium px-2 py-0.5 rounded text-xs"
                style={{
                  backgroundColor: t.business?.color ? `${t.business.color}15` : "rgba(128,128,128,0.1)",
                  color: t.business?.color || "inherit",
                }}
              >
                {t.business?.name || "—"}
              </span>,
              <TransactionTypeBadge key={`badge-${t.id}`} type={t.type} />,
              t.description || "—",
              <span
                key={`amount-${t.id}`}
                className={`font-mono font-semibold ${t.type === "income" ? "text-income" : "text-expense"}`}
              >
                {t.type === "income" ? "+" : "-"}
                {displayMoney(t.amount)}
              </span>,
              <PaymentMethodLabel key={`method-${t.id}`} method={t.payment_method} />,
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
