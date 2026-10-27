"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { formatMoneyInput, parseMoneyInput } from "@/lib/format-money";
import {
  toDateInputValue,
  todayStoredDate,
} from "@/lib/format-date";
import type { Business, Category, Transaction, TransactionType } from "@/lib/types";

export interface TransactionFormValues {
  businessId: string;
  type: TransactionType;
  amount: string;
  categoryId: string;
  description: string;
  transactionDate: string;
}

const defaultForm = (defaultBizId?: string): TransactionFormValues => ({
  businessId: defaultBizId || "",
  type: "expense",
  amount: "",
  categoryId: "",
  description: "",
  transactionDate: toDateInputValue(todayStoredDate()),
});

function transactionToForm(
  editing: Transaction | null,
  defaultBizId?: string
): TransactionFormValues {
  if (!editing) return defaultForm(defaultBizId);

  return {
    businessId: editing.business_id || defaultBizId || "",
    type: editing.type,
    amount: editing.amount != null ? formatMoneyInput(String(editing.amount)) : "",
    categoryId: editing.category_id || "",
    description: editing.description || "",
    transactionDate: toDateInputValue(editing.transaction_date),
  };
}

export function TransactionFormDialog({
  open,
  onOpenChange,
  editing,
  businesses = [],
  categories = [],
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Transaction | null;
  businesses?: Business[];
  categories?: Category[];
  onSave: (values: TransactionFormValues) => Promise<void>;
}) {
  const defaultBiz = editing?.business_id || businesses[0]?.id || "";
  const [form, setForm] = useState<TransactionFormValues>(defaultForm(defaultBiz));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(transactionToForm(editing, defaultBiz));
    }
  }, [open, editing, defaultBiz]);

  const handleOpenChange = (v: boolean) => {
    if (!v) setForm(defaultForm(defaultBiz));
    onOpenChange(v);
  };

  const filteredCategories = categories.filter((c) => {
    if (c.type !== form.type) return false;
    if (form.businessId && c.business_id && c.business_id !== form.businessId) {
      return false;
    }
    return true;
  });

  const submit = async () => {
    const amountNum = parseMoneyInput(form.amount);
    if (amountNum <= 0) return;
    setSaving(true);
    try {
      await onSave(form);
      handleOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl z-[60]">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-t-2xl" />
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {editing ? "Chỉnh sửa giao dịch" : "Ghi nhận giao dịch mới"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Cập nhật chi tiết số tiền và thông tin giao dịch
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {businesses.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Mảng việc <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={form.businessId}
                onValueChange={(v) =>
                  setForm({ ...form, businessId: v, categoryId: "" })
                }
              >
                <SelectTrigger className="h-10 text-base sm:text-xs rounded-xl">
                  <SelectValue placeholder="Chọn mảng việc" />
                </SelectTrigger>
                <SelectContent className="z-[70]">
                  {businesses.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
                    type: v as TransactionType,
                    categoryId: "",
                  })
                }
              >
                <SelectTrigger className="h-10 text-base sm:text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[70]">
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
                className="h-10 text-base sm:text-xs rounded-xl"
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
              <SelectTrigger className="h-10 text-base sm:text-xs rounded-xl">
                <SelectValue placeholder="Chọn danh mục (tùy chọn)" />
              </SelectTrigger>
              <SelectContent className="z-[70]">
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
              placeholder="VD: Mua văn phòng phẩm, thu tiền khách..."
              className="h-10 text-base sm:text-xs rounded-xl"
            />
          </div>

          <div className="flex gap-2.5 pt-3">
            <Button
              variant="secondary"
              className="flex-1 rounded-xl h-10 text-xs font-semibold"
              onClick={() => handleOpenChange(false)}
            >
              Hủy
            </Button>
            <Button
              className="flex-1 rounded-xl h-10 text-xs font-semibold bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
              onClick={submit}
              disabled={saving || !form.amount || parseMoneyInput(form.amount) <= 0}
            >
              {saving ? "Đang lưu..." : editing ? "Cập nhật" : "Ghi nhận"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
