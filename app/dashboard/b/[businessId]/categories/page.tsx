"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Edit2, Trash2, Tag, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import {
  ModulePageShell,
  ModuleSubpageHeader,
} from "@/components/dashboard/module-shell";
import { BusinessSubNav } from "@/components/dashboard/business-sub-nav";
import { SkeletonTable } from "@/components/ui/skeleton-loader";
import {
  fetchCategories,
  insertCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/supabase";
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
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";

const COLORS = [
  "#10b981", // Emerald
  "#3b82f6", // Blue
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#14b8a6", // Teal
  "#f43f5e", // Rose
  "#64748b", // Slate
];

export default function BusinessCategoriesPage() {
  const { user, logAction } = useAuth();
  const params = useParams();
  const businessId = params.businessId as string;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "income" as "income" | "expense",
    color: COLORS[0],
  });

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setCategories(await fetchCategories(user.id, businessId));
    } catch {
      toast.error("Không tải được danh mục");
    } finally {
      setLoading(false);
    }
  }, [user, businessId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", type: "income", color: COLORS[0] });
    setDialogOpen(true);
  };

  const openEdit = (c: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(c);
    setForm({ name: c.name, type: c.type, color: c.color });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user || !form.name.trim()) {
      toast.error("Vui lòng nhập tên danh mục");
      return;
    }
    try {
      if (editing) {
        await updateCategory(editing.id, {
          name: form.name,
          type: form.type,
          color: form.color,
        });
        logAction("Sửa danh mục", form.name);
      } else {
        await insertCategory({
          user_id: user.id,
          business_id: businessId,
          name: form.name,
          type: form.type,
          color: form.color,
          icon: "wallet",
        });
        logAction("Thêm danh mục", form.name);
      }
      toast.success("Đã lưu danh mục");
      setDialogOpen(false);
      loadData();
    } catch {
      toast.error("Không thể lưu danh mục");
    }
  };

  const handleDelete = async (c: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Bạn có chắc muốn xóa danh mục "${c.name}"?`)) return;
    try {
      await deleteCategory(c.id);
      logAction("Xóa danh mục", c.name);
      toast.success("Đã xóa danh mục");
      loadData();
    } catch {
      toast.error("Không thể xóa — có thể danh mục đang chứa giao dịch");
    }
  };

  return (
    <ModulePageShell module="cashflow">
      <div className="space-y-6">
        {/* SUB NAVIGATION */}
        <BusinessSubNav businessId={businessId} />

        {/* HEADER */}
        <ModuleSubpageHeader
          module="cashflow"
          title="Danh mục thu chi"
          subtitle="Phân loại các khoản tiền thu và chi để phục vụ phân tích báo cáo"
          actions={
            <Button
              onClick={openCreate}
              className="rounded-full h-9 px-4 font-semibold text-xs gap-1.5 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
            >
              <Plus className="h-4 w-4" /> Thêm danh mục
            </Button>
          }
        />

        {/* CATEGORIES GRID */}
        {loading ? (
          <div className="p-6">
            <SkeletonTable />
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-12 text-center bg-card">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-500">
              <Tag className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Chưa có danh mục nào
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
              Tạo danh mục để phân loại các nguồn thu nhập và chi phí chi tiết.
            </p>
            <Button size="sm" onClick={openCreate} className="rounded-full text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" /> Thêm danh mục đầu tiên
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {categories.map((c) => (
              <div
                key={c.id}
                className="group relative rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card p-4 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs ring-2 ring-white dark:ring-zinc-900"
                    style={{ backgroundColor: c.color }}
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">
                      {c.name}
                    </p>
                    <span
                      className={cn(
                        "inline-flex items-center text-[10px] font-semibold px-2 py-0.2 rounded-full border mt-0.5",
                        c.type === "income"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400",
                      )}
                    >
                      {c.type === "income" ? "Khoản Thu" : "Khoản Chi"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => openEdit(c, e)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Sửa"
                    aria-label="Sửa"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(c, e)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Xóa"
                    aria-label="Xóa"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DIALOG FORM */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[400px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                {editing ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  Tên danh mục <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ví dụ: Bán lẻ, Nhập hàng, Marketing..."
                  className="rounded-xl h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  Loại thu chi
                </Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm({ ...form, type: v as "income" | "expense" })
                  }
                >
                  <SelectTrigger className="rounded-xl h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Khoản Thu (Tiền vào)</SelectItem>
                    <SelectItem value="expense">Khoản Chi (Tiền ra)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  Màu đại diện
                </Label>
                <div className="flex items-center gap-2 pt-1">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      className={cn(
                        "h-7 w-7 rounded-full transition-transform flex items-center justify-center shadow-xs",
                        form.color === c
                          ? "ring-2 ring-offset-2 ring-zinc-900 dark:ring-zinc-100 scale-110"
                          : "hover:scale-105",
                      )}
                      style={{ backgroundColor: c }}
                      aria-label={`Chọn màu ${c}`}
                    >
                      {form.color === c && (
                        <Check className="h-3.5 w-3.5 text-white drop-shadow-xs" />
                      )}
                    </button>
                  ))}
                </div>
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
                  {editing ? "Cập nhật" : "Tạo mới"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ModulePageShell>
  );
}

