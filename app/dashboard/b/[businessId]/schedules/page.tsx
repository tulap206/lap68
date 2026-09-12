"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Edit2, Trash2, CalendarClock, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import {
  ModulePageShell,
  ModuleSubpageHeader,
} from "@/components/dashboard/module-shell";
import { BusinessSubNav } from "@/components/dashboard/business-sub-nav";
import {
  ScheduleFormDialog,
  scheduleFormToPayload,
} from "@/components/dashboard/schedule-form-dialog";
import { SkeletonTable } from "@/components/ui/skeleton-loader";
import {
  fetchSchedules,
  fetchCategories,
  insertSchedule,
  updateSchedule,
  deleteSchedule,
} from "@/lib/supabase";
import { displayMoney } from "@/lib/format-money";
import { formatDisplayDate } from "@/lib/format-date";
import { getEffectiveDueDate } from "@/lib/schedule-engine";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Schedule, Category } from "@/lib/types";

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  pending: { label: "Chờ xử lý", class: "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-400" },
  overdue: { label: "Quá hạn", class: "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400" },
  done: { label: "Hoàn tất", class: "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400" },
  skipped: { label: "Bỏ qua", class: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400" },
  cancelled: { label: "Đã hủy", class: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400" },
};

export default function BusinessSchedulesPage() {
  const { user, logAction } = useAuth();
  const params = useParams();
  const businessId = params.businessId as string;
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [sch, cats] = await Promise.all([
        fetchSchedules(user.id, businessId),
        fetchCategories(user.id, businessId),
      ]);
      setSchedules(sch);
      setCategories(cats);
    } catch {
      toast.error("Không tải được lịch thu/chi");
    } finally {
      setLoading(false);
    }
  }, [user, businessId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (
    form: Parameters<typeof scheduleFormToPayload>[0],
  ) => {
    if (!user) return;
    const payload = scheduleFormToPayload(form, user.id, businessId);
    try {
      if (editing) {
        await updateSchedule(editing.id, {
          ...payload,
          status: editing.status,
          linked_transaction_id: editing.linked_transaction_id,
          completed_at: editing.completed_at,
        });
        logAction("Sửa lịch", form.title);
      } else {
        await insertSchedule(payload);
        logAction("Thêm lịch", form.title);
      }
      toast.success("Đã lưu lịch thu chi");
      setEditing(null);
      setDialogOpen(false);
      load();
    } catch {
      toast.error("Không thể lưu lịch thu chi");
    }
  };

  const handleDelete = async (s: Schedule, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Bạn có chắc muốn xóa lịch "${s.title}"?`)) return;
    try {
      await deleteSchedule(s.id);
      logAction("Xóa lịch", s.title);
      toast.success("Đã xóa lịch");
      load();
    } catch {
      toast.error("Không thể xóa lịch");
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
          title="Lịch nhắc thu & chi định kỳ"
          subtitle="Tự động theo dõi các khoản phải thu hoặc chi đúng hạn"
          actions={
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
              className="rounded-full h-9 px-4 font-semibold text-xs gap-1.5 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
            >
              <Plus className="h-4 w-4" /> Thêm lịch mới
            </Button>
          }
        />

        {/* SCHEDULES LIST */}
        {loading ? (
          <div className="p-6">
            <SkeletonTable />
          </div>
        ) : schedules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-12 text-center bg-card">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-500">
              <CalendarClock className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Chưa có lịch thu chi định kỳ nào
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
              Thiết lập lịch định kỳ để không bỏ lỡ các khoản thanh toán hoặc thu tiền quan trọng.
            </p>
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
              className="rounded-full text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Thêm lịch đầu tiên
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/70 shadow-xs">
            {schedules.map((s) => {
              const statusCfg = STATUS_CONFIG[s.status] || {
                label: s.status,
                class: "bg-zinc-100 text-zinc-600 border-zinc-200",
              };
              const isCollect = s.direction === "collect";

              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3.5 sm:px-5 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors group"
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-3">
                    <span
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                        isCollect
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
                      )}
                    >
                      {isCollect ? (
                        <ArrowDownLeft className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {s.title}
                        </p>
                        <span
                          className={cn(
                            "inline-flex text-[10px] font-semibold px-2 py-0.2 rounded-full border shrink-0",
                            statusCfg.class,
                          )}
                        >
                          {statusCfg.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Hạn: <strong className="text-foreground/80">{formatDisplayDate(getEffectiveDueDate(s))}</strong>
                        {s.schedule_kind === "recurring" && (
                          <span> • Định kỳ</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right whitespace-nowrap">
                      <span
                        className={cn(
                          "font-mono font-bold text-sm tabular-nums",
                          isCollect
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400",
                        )}
                      >
                        {s.amount ? displayMoney(s.amount) : "—"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(s);
                          setDialogOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Sửa"
                        aria-label="Sửa"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(s, e)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Xóa"
                        aria-label="Xóa"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <ScheduleFormDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditing(null);
          }}
          categories={categories}
          editing={editing}
          onSave={handleSave}
        />
      </div>
    </ModulePageShell>
  );
}

