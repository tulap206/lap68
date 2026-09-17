"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Plus, Edit2, Trash2, Search, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import {
  ModulePageShell,
  ModuleSubpageHeader,
} from "@/components/dashboard/module-shell";
import { BusinessSubNav } from "@/components/dashboard/business-sub-nav";
import { TransactionTypeBadge } from "@/components/dashboard/cashflow-ui";
import { SkeletonTable } from "@/components/ui/skeleton-loader";
import {
  fetchTransactions,
  fetchCategories,
  insertTransaction,
  updateTransaction,
  deleteTransaction,
} from "@/lib/supabase";
import {
  displayMoney,
  formatMoneyInput,
  parseMoneyInput,
} from "@/lib/format-money";
import {
  formatDisplayDate,
  todayStoredDate,
  toDateInputValue,
  toStoredDateValue,
} from "@/lib/format-date";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Transaction, Category } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function BusinessTransactionsPage() {
  const { user, logAction } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const businessId = params.businessId as string;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(
    searchParams.get("type") || "all",
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [form, setForm] = useState({
    type: "income" as "income" | "expense",
    amount: "",
    categoryId: "",
    description: "",
    transactionDate: todayStoredDate(),
  });

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [txs, cats] = await Promise.all([
        fetchTransactions(user.id, businessId),
        fetchCategories(user.id, businessId),
      ]);
      setTransactions(txs);
      setCategories(cats);
    } catch {
      toast.error("Không tải được dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [user, businessId]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () =>
      transactions.filter((t) => {
        if (typeFilter !== "all" && t.type !== typeFilter) return false;
        const q = search.toLowerCase();
        if (!q) return true;
        return (
          (t.description || "").toLowerCase().includes(q) ||
          displayMoney(t.amount).includes(q)
        );
      }),
    [transactions, search, typeFilter],
  );

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const filteredCategories = categories.filter((c) => c.type === form.type);

  const openCreate = () => {
    setEditing(null);
    setForm({
      type: "income",
      amount: "",
      categoryId: "",
      description: "",
      transactionDate: todayStoredDate(),
    });
    setDialogOpen(true);
  };

  const openEdit = (t: Transaction, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(t);
    setForm({
      type: t.type,
      amount: formatMoneyInput(String(t.amount)),
      categoryId: t.category_id || "",
      description: t.description || "",
      transactionDate: toDateInputValue(t.transaction_date),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user) return;
    const amount = parseMoneyInput(form.amount);
    if (amount <= 0) {
      toast.error("Số tiền phải lớn hơn 0");
      return;
    }
    const payload = {
      user_id: user.id,
      business_id: businessId,
      type: form.type,
      amount,
      category_id: form.categoryId || null,
      counterparty_id: null,
      schedule_id: null,
      description: form.description || null,
      transaction_date: toStoredDateValue(form.transactionDate),
      payment_method: "bank" as Transaction["payment_method"],
      ghi_chu: {},
    };
    try {
      if (editing) {
        await updateTransaction(editing.id, payload);
        logAction("Sửa giao dịch", displayMoney(amount));
      } else {
        await insertTransaction(payload);
        logAction("Thêm giao dịch", displayMoney(amount));
      }
      toast.success("Đã lưu giao dịch");
      setDialogOpen(false);
      load();
    } catch {
      toast.error("Không thể lưu giao dịch");
    }
  };

  const handleDelete = async (t: Transaction, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Bạn có chắc muốn xóa giao dịch này?")) return;
    try {
      await deleteTransaction(t.id);
      logAction("Xóa giao dịch", displayMoney(t.amount));
      toast.success("Đã xóa giao dịch");
      load();
    } catch {
      toast.error("Không thể xóa giao dịch");
    }
  };

  return (
    <ModulePageShell module="cashflow">
      <div className="space-y-6">
        {/* SUB NAVIGATION */}
        <BusinessSubNav businessId={businessId} />

        {/* HEADER & ACTIONS */}
        <ModuleSubpageHeader
          module="cashflow"
          title="Sổ giao dịch thu chi"
          subtitle="Quản lý và ghi nhận chi tiết các dòng tiền thu chi"
          actions={
            <Button
              onClick={openCreate}
              className="rounded-full h-9 px-4 font-semibold text-xs gap-1.5 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
            >
              <Plus className="h-4 w-4" /> Ghi giao dịch
            </Button>
          }
        />

        {/* CONTROLS BAR: SEARCH & SEGMENTED TABS */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              className="pl-9 h-10 text-base sm:text-xs rounded-xl bg-zinc-100/70 dark:bg-zinc-800/70 border-none focus-visible:ring-1"
              placeholder="Tìm theo mô tả, số tiền..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="apple-segmented w-full sm:w-auto grid grid-cols-3 sm:flex">
            <button
              type="button"
              onClick={() => setTypeFilter("all")}
              className={cn("apple-segmented-item text-center justify-center", typeFilter === "all" && "active")}
            >
              Tất cả ({transactions.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("income")}
              className={cn("apple-segmented-item text-center justify-center", typeFilter === "income" && "active")}
            >
              Thu ({transactions.filter((t) => t.type === "income").length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("expense")}
              className={cn("apple-segmented-item text-center justify-center", typeFilter === "expense" && "active")}
            >
              Chi ({transactions.filter((t) => t.type === "expense").length})
            </button>
          </div>
        </div>

        {/* TRANSACTIONS LIST */}
        {loading ? (
          <div className="p-6">
            <SkeletonTable />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-12 text-center bg-card">
            <p className="text-xs text-muted-foreground mb-3">
              Không tìm thấy giao dịch nào phù hợp với bộ lọc.
            </p>
            <Button size="sm" onClick={openCreate} className="rounded-full text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" /> Ghi giao dịch mới
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/70 shadow-xs">
            {filtered.map((t) => {
              const catName = t.category_id ? categoryMap.get(t.category_id) : null;
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3.5 sm:px-5 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors group"
                >
                  {/* LEFT: TYPE ICON, TITLE, CATEGORY & DATE */}
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                        t.type === "income"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
                      )}
                    >
                      {t.type === "income" ? (
                        <ArrowDownLeft className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {t.description || "Giao dịch không tên"}
                        </p>
                        {catName && (
                          <span className="inline-flex text-[10px] font-medium px-2 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
                            {catName}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {formatDisplayDate(t.transaction_date)}
                      </p>
                    </div>
                  </div>

                  {/* RIGHT: AMOUNT & ACTIONS */}
                  <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                    <div className="text-right whitespace-nowrap">
                      <span
                        className={cn(
                          "font-mono font-bold text-sm sm:text-base tabular-nums",
                          t.type === "income"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400",
                        )}
                      >
                        {t.type === "income" ? "+" : "-"}
                        {displayMoney(t.amount)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-90 sm:opacity-70 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => openEdit(t, e)}
                        className="text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100 transition-colors p-1.5 rounded-lg active:bg-zinc-100 dark:active:bg-zinc-800"
                        title="Sửa"
                        aria-label="Sửa"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(t, e)}
                        className="text-zinc-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 transition-colors p-1.5 rounded-lg active:bg-zinc-100 dark:active:bg-zinc-800"
                        title="Xóa"
                        aria-label="Xóa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* DIALOG FORM */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[420px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                {editing ? "Chỉnh sửa giao dịch" : "Ghi nhận giao dịch mới"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    Loại giao dịch
                  </Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        type: v as "income" | "expense",
                        categoryId: "",
                      })
                    }
                  >
                    <SelectTrigger className="rounded-xl h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Thu (Tiền vào)</SelectItem>
                      <SelectItem value="expense">Chi (Tiền ra)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    Ngày giao dịch
                  </Label>
                  <Input
                    type="date"
                    value={toDateInputValue(form.transactionDate)}
                    onChange={(e) =>
                      setForm({ ...form, transactionDate: e.target.value })
                    }
                    className="rounded-xl h-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  Số tiền (VNĐ) <span className="text-rose-500">*</span>
                </Label>
                <Input
                  className="font-mono text-base font-bold rounded-xl h-10"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({ ...form, amount: formatMoneyInput(e.target.value) })
                  }
                  placeholder="0"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  Danh mục
                </Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) => setForm({ ...form, categoryId: v })}
                >
                  <SelectTrigger className="rounded-xl h-10">
                    <SelectValue placeholder="Chọn danh mục (tùy chọn)" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  Mô tả / Diễn giải
                </Label>
                <Input
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Ví dụ: Bán đơn hàng số #102, Tiền điện nước..."
                  className="rounded-xl h-10"
                />
              </div>

              <div className="flex gap-2.5 pt-3">
                <Button
                  variant="secondary"
                  className="flex-1 rounded-xl h-10 text-xs font-semibold"
                  onClick={() => setDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  className="flex-1 rounded-xl h-10 text-xs font-semibold bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  onClick={handleSave}
                >
                  {editing ? "Cập nhật" : "Ghi nhận"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ModulePageShell>
  );
}

