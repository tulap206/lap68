"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit2, Archive, Briefcase, ChevronRight, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import {
  ModulePageShell,
  ModuleSubpageHeader,
} from "@/components/dashboard/module-shell";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  fetchBusinesses,
  insertBusiness,
  updateBusiness,
} from "@/lib/supabase";
import type { Business } from "@/lib/types";
import { cn } from "@/lib/utils";

const COLORS = [
  "#10b981", // Emerald
  "#3b82f6", // Apple Blue
  "#f59e0b", // Amber
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#14b8a6", // Teal
  "#f43f5e", // Rose
  "#64748b", // Slate
];

export default function BusinessesPage() {
  const { user, logAction } = useAuth();
  const [items, setItems] = useState<Business[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Business | null>(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    color: COLORS[0],
    description: "",
  });

  const load = useCallback(async () => {
    if (!user) return;
    setItems(await fetchBusinesses(user.id));
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", code: "", color: COLORS[0], description: "" });
    setOpen(true);
  };

  const openEdit = (b: Business, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(b);
    setForm({
      name: b.name,
      code: b.code || "",
      color: b.color,
      description: b.description || "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!user || !form.name.trim()) {
      toast.error("Vui lòng nhập tên mảng kinh doanh");
      return;
    }
    try {
      if (editing) {
        await updateBusiness(editing.id, {
          ...form,
          code: form.code || null,
          description: form.description || null,
        });
        logAction("Sửa việc KD", form.name);
      } else {
        await insertBusiness({
          user_id: user.id,
          name: form.name.trim(),
          code: form.code || null,
          color: form.color,
          icon: "briefcase",
          description: form.description || null,
          status: "active",
          sort_order: items.length,
          ghi_chu: {},
        });
        logAction("Thêm việc KD", form.name);
      }
      toast.success("Đã lưu thành công");
      setOpen(false);
      load();
    } catch {
      toast.error("Không thể lưu thông tin");
    }
  };

  const archive = async (b: Business, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Bạn có chắc muốn lưu trữ mảng "${b.name}"?`)) return;
    try {
      await updateBusiness(b.id, { status: "archived" });
      logAction("Lưu trữ việc", b.name);
      toast.success(`Đã lưu trữ "${b.name}"`);
      load();
    } catch {
      toast.error("Không thể lưu trữ");
    }
  };

  return (
    <ModulePageShell module="cashflow">
      <div className="space-y-6">
        <ModuleSubpageHeader
          module="cashflow"
          title="Quản lý mảng kinh doanh"
          subtitle="Tạo, tùy chỉnh màu sắc và sắp xếp các mảng thu chi độc lập"
          actions={
            <Button
              onClick={openCreate}
              className="rounded-full h-9 px-4 font-semibold text-xs gap-1.5 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
            >
              <Plus className="h-4 w-4" /> Thêm mảng mới
            </Button>
          }
        />

        {/* BUSINESS GRID */}
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-12 text-center bg-card">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-500">
              <Briefcase className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Chưa có mảng kinh doanh nào
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
              Tạo mảng kinh doanh đầu tiên để bắt đầu ghi nhận và theo dõi dòng tiền.
            </p>
            <Button onClick={openCreate} className="rounded-full">
              <Plus className="h-4 w-4 mr-1" /> Thêm mảng mới
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((b) => (
              <div
                key={b.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  window.location.href = `/dashboard/b/${b.id}`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    window.location.href = `/dashboard/b/${b.id}`;
                  }
                }}
                className="group relative rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card p-5 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm transition-all text-left cursor-pointer flex flex-col justify-between active:scale-[0.99]"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-4 h-4 rounded-full shrink-0 shadow-xs ring-2 ring-white dark:ring-zinc-900"
                        style={{ backgroundColor: b.color }}
                      />
                      <div>
                        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                          {b.name}
                        </h3>
                        {b.code && (
                          <span className="text-[11px] font-mono font-semibold uppercase text-zinc-400">
                            #{b.code}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => openEdit(b, e)}
                        className="text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-100 transition-colors p-1"
                        title="Chỉnh sửa"
                        aria-label="Chỉnh sửa"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => archive(b, e)}
                        className="text-zinc-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 transition-colors p-1"
                        title="Lưu trữ"
                        aria-label="Lưu trữ"
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                    </div>

                  </div>

                  <p className="text-xs text-zinc-500 mt-3 line-clamp-2 min-h-[32px]">
                    {b.description || "Chưa có mô tả chi tiết."}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                  <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Đang hoạt động
                  </span>
                  <span className="flex items-center gap-0.5 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 font-medium group-hover:translate-x-0.5 transition-all">
                    Xem chi tiết <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DIALOG FORM */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[420px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                {editing ? "Chỉnh sửa mảng kinh doanh" : "Tạo mảng kinh doanh mới"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  Tên mảng kinh doanh <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ví dụ: Bán hàng online, Dịch vụ sửa chữa..."
                  className="rounded-xl h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  Mã định danh (tùy chọn)
                </Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="Ví dụ: ONL, SVC, LAP68..."
                  className="rounded-xl h-10 font-mono uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  Màu sắc đại diện
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

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  Mô tả vắn tắt
                </Label>
                <Input
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Ghi chú thêm về mảng này..."
                  className="rounded-xl h-10"
                />
              </div>

              <div className="flex gap-2.5 pt-3">
                <Button
                  variant="secondary"
                  className="flex-1 rounded-xl h-10 text-xs font-semibold"
                  onClick={() => setOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  className="flex-1 rounded-xl h-10 text-xs font-semibold bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  onClick={save}
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

