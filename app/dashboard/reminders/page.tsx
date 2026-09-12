"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Clock,
  Calendar,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import {
  ModulePageShell,
  ModuleSubpageHeader,
  ModuleSectionCard,
  AccentButton,
} from "@/components/dashboard/module-shell";
import { ReminderPanel } from "@/components/dashboard/reminder-panel";
import { SkeletonMetricCards, SkeletonTable } from "@/components/ui/skeleton-loader";
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
import {
  fetchSchedules,
  fetchBusinesses,
  completeSchedule,
  subscribeLap68Tables,
  syncScheduleStatuses,
} from "@/lib/supabase";
import { buildReminderItems } from "@/lib/schedule-engine";
import {
  displayMoney,
  formatMoneyInput,
  parseMoneyInput,
} from "@/lib/format-money";
import type { Schedule, Business } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function RemindersPage() {
  const { user, logAction } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [completeTarget, setCompleteTarget] = useState<Schedule | null>(null);
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  // Filters
  const [directionFilter, setDirectionFilter] = useState<"all" | "collect" | "pay">("all");
  const [businessFilter, setBusinessFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    try {
      await syncScheduleStatuses(user.id);
      const [sch, biz] = await Promise.all([
        fetchSchedules(user.id),
        fetchBusinesses(user.id),
      ]);
      setSchedules(sch);
      setBusinesses(biz);
    } catch {
      toast.error("Không tải được nhắc hẹn");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (!user) return;
    return subscribeLap68Tables(user.id, load);
  }, [user, load]);

  const businessMap = useMemo(
    () => new Map(businesses.map((b) => [b.id, b.name])),
    [businesses],
  );

  const rawReminders = useMemo(() => buildReminderItems(schedules), [schedules]);

  // Overall KPI statistics
  const stats = useMemo(() => {
    const overdue = rawReminders.filter((r) => r.urgency === "overdue");
    const today = rawReminders.filter((r) => r.urgency === "today");
    const upcoming = rawReminders.filter((r) => r.urgency === "soon" || r.urgency === "upcoming");

    const overdueSum = overdue.reduce((sum, r) => sum + (r.schedule.amount || 0), 0);
    const todaySum = today.reduce((sum, r) => sum + (r.schedule.amount || 0), 0);
    const upcomingSum = upcoming.reduce((sum, r) => sum + (r.schedule.amount || 0), 0);

    return {
      overdueCount: overdue.length,
      overdueSum,
      todayCount: today.length,
      todaySum,
      upcomingCount: upcoming.length,
      upcomingSum,
    };
  }, [rawReminders]);

  // Filtered reminders
  const filteredReminders = useMemo(() => {
    return rawReminders.filter((r) => {
      if (directionFilter !== "all" && r.schedule.direction !== directionFilter) return false;
      if (businessFilter !== "all" && r.schedule.business_id !== businessFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const titleMatch = r.schedule.title.toLowerCase().includes(q);
        const bizName = (businessMap.get(r.schedule.business_id) || "").toLowerCase();
        const bizMatch = bizName.includes(q);
        if (!titleMatch && !bizMatch) return false;
      }
      return true;
    });
  }, [rawReminders, directionFilter, businessFilter, search, businessMap]);

  const grouped = useMemo(() => {
    const overdue = filteredReminders.filter((r) => r.urgency === "overdue");
    const today = filteredReminders.filter((r) => r.urgency === "today");
    const soon = filteredReminders.filter(
      (r) => r.urgency === "soon" || r.urgency === "upcoming",
    );
    return { overdue, today, soon };
  }, [filteredReminders]);

  const openComplete = (scheduleId: string) => {
    const s = schedules.find((x) => x.id === scheduleId);
    if (!s) return;
    setCompleteTarget(s);
    setAmount(s.amount ? formatMoneyInput(String(s.amount)) : "");
  };

  const handleComplete = async () => {
    if (!completeTarget) return;
    const parsed = parseMoneyInput(amount);
    if (parsed <= 0) {
      toast.error("Nhập số tiền hợp lệ");
      return;
    }
    setSaving(true);
    try {
      await completeSchedule(completeTarget, parsed, "bank");
      logAction("Hoàn thành lịch", completeTarget.title);
      toast.success("Đã ghi nhận giao dịch thành công");
      setCompleteTarget(null);
      load();
    } catch {
      toast.error("Không thể hoàn thành");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModulePageShell module="cashflow">
      <div className="space-y-6">
        <ModuleSubpageHeader
          module="cashflow"
          title="Lịch nhắc hẹn & Thu chi đến hạn"
          subtitle="Tự động theo dõi các khoản cần thu, phải chi trên toàn bộ mảng kinh doanh"
        />

        {/* 1. HERO KPI CARDS */}
        {loading ? (
          <SkeletonMetricCards />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* OVERDUE CARD */}
            <div
              className={cn(
                "rounded-2xl border p-4.5 transition-all",
                stats.overdueCount > 0
                  ? "border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/20"
                  : "border-border bg-card",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <AlertTriangle className={cn("h-4 w-4", stats.overdueCount > 0 ? "text-rose-500" : "text-muted-foreground")} />
                  Quá hạn
                </span>
                <span
                  className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full",
                    stats.overdueCount > 0
                      ? "bg-rose-500/15 text-rose-500 border border-rose-500/20"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {stats.overdueCount} khoản
                </span>
              </div>
              <div className="mt-3">
                <div className="text-xl sm:text-2xl font-mono font-bold text-expense tracking-tight tabular-nums">
                  {displayMoney(stats.overdueSum)}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {stats.overdueCount > 0 ? "Cần xử lý ngay" : "Không có khoản quá hạn"}
                </p>
              </div>
            </div>

            {/* TODAY CARD */}
            <div
              className={cn(
                "rounded-2xl border p-4.5 transition-all",
                stats.todayCount > 0
                  ? "border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20"
                  : "border-border bg-card",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className={cn("h-4 w-4", stats.todayCount > 0 ? "text-amber-500" : "text-muted-foreground")} />
                  Đến hạn hôm nay
                </span>
                <span
                  className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-full",
                    stats.todayCount > 0
                      ? "bg-amber-500/15 text-amber-500 border border-amber-500/20"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {stats.todayCount} khoản
                </span>
              </div>
              <div className="mt-3">
                <div className="text-xl sm:text-2xl font-mono font-bold text-foreground tracking-tight tabular-nums">
                  {displayMoney(stats.todaySum)}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Trong ngày hôm nay
                </p>
              </div>
            </div>

            {/* UPCOMING CARD */}
            <div className="rounded-2xl border border-border bg-card p-4.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-income" />
                  Sắp đến hạn
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-muted text-foreground/80">
                  {stats.upcomingCount} khoản
                </span>
              </div>
              <div className="mt-3">
                <div className="text-xl sm:text-2xl font-mono font-bold text-income tracking-tight tabular-nums">
                  {displayMoney(stats.upcomingSum)}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Trong các ngày tới
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. FILTER CONTROLS */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/70 overflow-x-auto">
            <button
              type="button"
              onClick={() => setDirectionFilter("all")}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap",
                directionFilter === "all"
                  ? "bg-card text-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setDirectionFilter("collect")}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 whitespace-nowrap",
                directionFilter === "collect"
                  ? "bg-card text-income shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <ArrowDownLeft className="h-3.5 w-3.5" /> Phải thu
            </button>
            <button
              type="button"
              onClick={() => setDirectionFilter("pay")}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 whitespace-nowrap",
                directionFilter === "pay"
                  ? "bg-card text-expense shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <ArrowUpRight className="h-3.5 w-3.5" /> Phải chi
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-44">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Tìm tiêu đề..."
                className="pl-8.5 h-9 text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {businesses.length > 0 && (
              <Select value={businessFilter} onValueChange={setBusinessFilter}>
                <SelectTrigger className="h-9 text-xs w-auto min-w-[140px]">
                  <SelectValue placeholder="Mảng kinh doanh" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả mảng KD</SelectItem>
                  {businesses.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* 3. REMINDER SECTIONS */}
        {loading ? (
          <SkeletonTable />
        ) : filteredReminders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card">
            <Calendar className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2.5" />
            <p className="text-sm font-semibold text-foreground">
              Không tìm thấy nhắc hẹn phù hợp
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Thử điều chỉnh bộ lọc hoặc tạo thêm lịch định kỳ trong mảng kinh doanh.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* OVERDUE GROUP */}
            {grouped.overdue.length > 0 && (
              <ModuleSectionCard
                title={`Quá hạn (${grouped.overdue.length})`}
                description="Các khoản đã vượt quá ngày đến hạn — ưu tiên hoàn tất"
              >
                <div className="p-4 space-y-2.5">
                  {grouped.overdue.map((r) => (
                    <ReminderPanel
                      key={`${r.schedule.id}-${r.dueDate}`}
                      items={[r]}
                      onComplete={openComplete}
                      businessName={businessMap.get(r.schedule.business_id)}
                    />
                  ))}
                </div>
              </ModuleSectionCard>
            )}

            {/* TODAY GROUP */}
            {grouped.today.length > 0 && (
              <ModuleSectionCard
                title={`Đến hạn hôm nay (${grouped.today.length})`}
                description="Các khoản cần thu/chi trong ngày hôm nay"
              >
                <div className="p-4 space-y-2.5">
                  {grouped.today.map((r) => (
                    <ReminderPanel
                      key={`${r.schedule.id}-${r.dueDate}`}
                      items={[r]}
                      onComplete={openComplete}
                      businessName={businessMap.get(r.schedule.business_id)}
                    />
                  ))}
                </div>
              </ModuleSectionCard>
            )}

            {/* UPCOMING GROUP */}
            {grouped.soon.length > 0 && (
              <ModuleSectionCard
                title={`Sắp tới (${grouped.soon.length})`}
                description="Các khoản dự kiến trong những ngày tiếp theo"
              >
                <div className="p-4 space-y-2.5">
                  {grouped.soon.map((r) => (
                    <ReminderPanel
                      key={`${r.schedule.id}-${r.dueDate}`}
                      items={[r]}
                      onComplete={openComplete}
                      businessName={businessMap.get(r.schedule.business_id)}
                    />
                  ))}
                </div>
              </ModuleSectionCard>
            )}
          </div>
        )}

        {/* 4. COMPLETE CONFIRMATION DIALOG */}
        <Dialog
          open={!!completeTarget}
          onOpenChange={(v) => !v && setCompleteTarget(null)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                Ghi nhận đã {completeTarget?.direction === "collect" ? "thu" : "chi"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-1">
              <div className="p-3.5 rounded-xl bg-muted/50 border border-border space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Nội dung nhắc hẹn
                </p>
                <p className="font-semibold text-sm text-foreground">
                  {completeTarget?.title}
                </p>
                {completeTarget?.business_id && businessMap.get(completeTarget.business_id) && (
                  <p className="text-xs text-muted-foreground">
                    Mảng: {businessMap.get(completeTarget.business_id)}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Số tiền thực tế (VND)
                </Label>
                <Input
                  className="font-mono text-base font-semibold"
                  value={amount}
                  onChange={(e) => setAmount(formatMoneyInput(e.target.value))}
                  placeholder={
                    completeTarget?.amount
                      ? displayMoney(completeTarget.amount)
                      : "0"
                  }
                  autoFocus
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 h-9 text-xs"
                  onClick={() => setCompleteTarget(null)}
                >
                  Hủy
                </Button>
                <AccentButton
                  module="cashflow"
                  className="flex-1 h-9 text-xs font-semibold gap-1.5"
                  onClick={handleComplete}
                  disabled={saving}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {saving ? "Đang lưu..." : "Xác nhận & Ghi sổ"}
                </AccentButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ModulePageShell>
  );
}
