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
import {
  TransactionFormDialog,
  TransactionFormValues,
} from "@/components/dashboard/transaction-form-dialog";
import { displayMoney, parseMoneyInput } from "@/lib/format-money";
import {
  formatDisplayDate,
  parseDateForSort,
  parseDisplayDate,
  toStoredDateValue,
} from "@/lib/format-date";
import { updateTransaction, deleteTransaction } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import type { Business, Category, Transaction } from "@/lib/types";
import {
  Search,
  History,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  ReceiptText,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type DatePreset = "all" | "today" | "week" | "month";
type TypeFilter = "all" | "income" | "expense";

export function TransactionHistoryDialog({
  open,
  onOpenChange,
  transactions,
  businesses = [],
  categories = [],
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: Transaction[];
  businesses?: Business[];
  categories?: Category[];
  onSuccess?: () => void;
}) {
  const { user, logAction } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const pageSize = 12;

  const handleSaveEdit = async (values: TransactionFormValues) => {
    if (!editingTx || !user) return;
    const amount = parseMoneyInput(values.amount);
    const payload = {
      user_id: user.id,
      business_id: values.businessId || editingTx.business_id,
      type: values.type,
      amount,
      category_id: values.categoryId || null,
      description: values.description || null,
      transaction_date: toStoredDateValue(values.transactionDate),
    };
    try {
      await updateTransaction(editingTx.id, payload);
      logAction("Sửa giao dịch", displayMoney(amount));
      toast.success("Đã cập nhật giao dịch");
      setEditingTx(null);
      onSuccess?.();
    } catch {
      toast.error("Không thể cập nhật giao dịch");
    }
  };

  const handleDelete = async (t: Transaction, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      !confirm(
        `Bạn có chắc muốn xóa giao dịch "${t.description || "này"}" (${displayMoney(t.amount)})?`
      )
    ) {
      return;
    }
    setDeletingId(t.id);
    try {
      await deleteTransaction(t.id);
      logAction("Xóa giao dịch", displayMoney(t.amount));
      toast.success("Đã xóa giao dịch");
      onSuccess?.();
    } catch {
      toast.error("Không thể xóa giao dịch");
    } finally {
      setDeletingId(null);
    }
  };

  // Sort transactions by date descending (newest first)
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const dateA = parseDateForSort(a.transaction_date) || parseDateForSort(a.created_at);
      const dateB = parseDateForSort(b.transaction_date) || parseDateForSort(b.created_at);
      if (dateB !== dateA) return dateB - dateA;
      return parseDateForSort(b.created_at) - parseDateForSort(a.created_at);
    });
  }, [transactions]);

  // Apply filters
  const filteredTransactions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return sortedTransactions.filter((t) => {
      // 1. Type Filter
      if (typeFilter !== "all" && t.type !== typeFilter) {
        return false;
      }

      // 2. Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const desc = (t.description || "").toLowerCase();
        const cat = (t.category?.name || "").toLowerCase();
        const cp = (t.counterparty?.name || "").toLowerCase();
        const biz = (t.business?.name || "").toLowerCase();
        const amount = String(t.amount);
        if (!desc.includes(q) && !cat.includes(q) && !cp.includes(q) && !biz.includes(q) && !amount.includes(q)) {
          return false;
        }
      }

      // 3. Date Presets & Custom dates
      const txDate = parseDisplayDate(t.transaction_date);
      if (!txDate) return true;
      txDate.setHours(0, 0, 0, 0);

      if (datePreset === "today") {
        if (txDate.getTime() !== today.getTime()) return false;
      } else if (datePreset === "week") {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        if (txDate < weekAgo) return false;
      } else if (datePreset === "month") {
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        if (txDate < firstDayOfMonth) return false;
      }

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
  }, [sortedTransactions, search, typeFilter, datePreset, startDate, endDate]);

  // Aggregate metrics for current filtered view
  const { totalIncome, totalExpense } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    filteredTransactions.forEach((t) => {
      if (t.type === "income") inc += t.amount;
      else exp += t.amount;
    });
    return {
      totalIncome: inc,
      totalExpense: exp,
    };
  }, [filteredTransactions]);

  const totalItems = filteredTransactions.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIdx = (page - 1) * pageSize;
  const paginatedTransactions = filteredTransactions.slice(startIdx, startIdx + pageSize);

  const handlePreset = (preset: DatePreset) => {
    setDatePreset(preset);
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (v) {
          setPage(1);
          setSearch("");
          setDatePreset("month");
        }
      }}
    >
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-hidden flex flex-col p-0 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl bg-card shadow-2xl text-foreground font-sans">
        {/* 1. DIALOG HEADER & SUMMARY METRICS */}
        <div className="p-5 sm:p-6 pr-12 sm:pr-14 border-b border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 flex items-center justify-center shrink-0 shadow-xs">
                <History className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  Lịch sử giao dịch thu & chi
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Toàn bộ các dòng tiền phát sinh trên tất cả mảng việc
                </DialogDescription>
              </div>
            </div>

            {/* Live KPI Quick Pills */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 text-xs">
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <ArrowDownLeft className="h-3 w-3" /> +{displayMoney(totalIncome)}
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 text-xs">
                <span className="text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" /> -{displayMoney(totalExpense)}
                </span>
              </div>
            </div>
          </div>

          {/* 2. SMART SEARCH & FILTER TOOLBAR */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-1">
            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Tìm nội dung, đối tác, mảng..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-9 text-xs rounded-xl bg-card border-zinc-200 dark:border-zinc-800"
              />
            </div>

            {/* Type Filter & Date Presets */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
              {/* Type Switcher */}
              <div className="apple-segmented flex">
                <button
                  type="button"
                  onClick={() => { setTypeFilter("all"); setPage(1); }}
                  className={cn("apple-segmented-item px-3 py-1 text-xs", typeFilter === "all" && "active")}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => { setTypeFilter("income"); setPage(1); }}
                  className={cn("apple-segmented-item px-3 py-1 text-xs text-emerald-600 dark:text-emerald-400", typeFilter === "income" && "active")}
                >
                  Thu
                </button>
                <button
                  type="button"
                  onClick={() => { setTypeFilter("expense"); setPage(1); }}
                  className={cn("apple-segmented-item px-3 py-1 text-xs text-rose-600 dark:text-rose-400", typeFilter === "expense" && "active")}
                >
                  Chi
                </button>
              </div>

              {/* Date Presets */}
              <div className="apple-segmented hidden sm:flex">
                <button
                  type="button"
                  onClick={() => handlePreset("today")}
                  className={cn("apple-segmented-item px-2.5 py-1 text-xs", datePreset === "today" && "active")}
                >
                  Hôm nay
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset("week")}
                  className={cn("apple-segmented-item px-2.5 py-1 text-xs", datePreset === "week" && "active")}
                >
                  7 ngày
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset("month")}
                  className={cn("apple-segmented-item px-2.5 py-1 text-xs", datePreset === "month" && "active")}
                >
                  Tháng này
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset("all")}
                  className={cn("apple-segmented-item px-2.5 py-1 text-xs", datePreset === "all" && "active")}
                >
                  Tất cả
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. TRANSACTION LIST TABLE */}
        <div className="flex-1 overflow-y-auto overflow-x-auto overscroll-contain">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-muted-foreground flex items-center justify-center mx-auto">
                <ReceiptText className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">Không tìm thấy giao dịch nào</p>
              <p className="text-xs text-muted-foreground">Thử đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs min-w-[500px] sm:min-w-0">
              <thead>
                <tr className="border-b border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-muted-foreground font-semibold">
                  <th className="py-3 px-3 sm:px-4 w-12 text-center hidden sm:table-cell">#STT</th>
                  <th className="py-3 px-3 sm:px-4 w-24 sm:w-28">Ngày</th>
                  <th className="py-3 px-3 sm:px-4">Diễn giải & Danh mục</th>
                  <th className="py-3 px-3 sm:px-4 hidden sm:table-cell">Mảng việc</th>
                  <th className="py-3 px-2 sm:px-4 text-center w-16 sm:w-20">Loại</th>
                  <th className="py-3 px-3 sm:px-4 text-right">Số tiền</th>
                  <th className="py-3 px-2 sm:px-4 text-center w-16 sm:w-20">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {paginatedTransactions.map((t, idx) => {
                  const stt = startIdx + idx + 1;
                  const isIncome = t.type === "income";

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/30 transition-colors"
                    >
                      {/* #STT */}
                      <td className="py-3 px-3 sm:px-4 text-center font-mono text-[11px] text-muted-foreground hidden sm:table-cell">
                        {stt}
                      </td>

                      {/* Ngày */}
                      <td className="py-3 px-3 sm:px-4 text-foreground/90 whitespace-nowrap font-medium text-[11px]">
                        {formatDisplayDate(t.transaction_date)}
                      </td>

                      {/* Diễn giải & Danh mục */}
                      <td className="py-3 px-3 sm:px-4 max-w-[200px] sm:max-w-[220px]">
                        <p className="font-bold text-foreground truncate text-xs">{t.description || "Giao dịch không tiêu đề"}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
                          {t.category?.name && (
                            <span className="px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                              {t.category.name}
                            </span>
                          )}
                          {t.counterparty?.name && (
                            <span className="truncate">· {t.counterparty.name}</span>
                          )}
                        </div>
                      </td>

                      {/* Mảng việc */}
                      <td className="py-3 px-3 sm:px-4 hidden sm:table-cell">
                        {t.business ? (
                          <div className="flex items-center gap-1.5">
                            <BusinessIcon name={t.business.name} color={t.business.color} size="sm" />
                            <span className="font-semibold text-xs text-foreground truncate max-w-[130px]">
                              {t.business.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Loại */}
                      <td className="py-3 px-2 sm:px-4 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                            isIncome
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50"
                              : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50"
                          )}
                        >
                          {isIncome ? "Thu" : "Chi"}
                        </span>
                      </td>

                      {/* Số tiền */}
                      <td className="py-3 px-3 sm:px-4 text-right font-mono font-bold text-xs sm:text-sm whitespace-nowrap">
                        <span className={isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                          {isIncome ? "+" : "-"}{displayMoney(t.amount)}
                        </span>
                      </td>

                      {/* Thao tác */}
                      <td className="py-3 px-2 sm:px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTx(t);
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            title="Sửa giao dịch"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(t, e)}
                            disabled={deletingId === t.id}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/30 transition-colors"
                            title="Xóa giao dịch"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
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

      <TransactionFormDialog
        open={!!editingTx}
        onOpenChange={(v) => {
          if (!v) setEditingTx(null);
        }}
        editing={editingTx}
        businesses={businesses}
        categories={categories}
        onSave={handleSaveEdit}
      />
    </Dialog>
  );
}
