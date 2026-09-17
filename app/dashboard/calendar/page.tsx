"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CalendarDays,
  ListFilter,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Sparkles,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import {
  ModulePageShell,
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
  syncScheduleStatuses,
  completeSchedule,
  subscribeLap68Tables,
} from "@/lib/supabase";
import {
  buildReminderItems,
  getEffectiveDueDate,
  parseStoredDate,
} from "@/lib/schedule-engine";
import {
  displayMoney,
  formatMoneyInput,
  parseMoneyInput,
} from "@/lib/format-money";
import { formatDisplayDate } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import type { Schedule, Business } from "@/lib/types";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function storedToKey(stored: string): string | null {
  const d = parseStoredDate(stored);
  if (!d) return null;
  return dateKey(d);
}

function CalendarContent() {
  const { user, logAction } = useAuth();
  const searchParams = useSearchParams();

  const initialView = searchParams.get("view");
  const [viewMode, setViewMode] = useState<"calendar" | "agenda" | "all">(
    initialView === "agenda" || initialView === "reminders"
      ? "agenda"
      : initialView === "all"
        ? "all"
        : "calendar",
  );

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar State
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState<string | null>(() => dateKey(new Date()));

  // Filters State
  const [directionFilter, setDirectionFilter] = useState<"all" | "collect" | "pay">("all");
  const [businessFilter, setBusinessFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Complete modal
  const [completeTarget, setCompleteTarget] = useState<Schedule | null>(null);
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

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
      toast.error("Không tải được dữ liệu lịch");
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
    () => new Map(businesses.map((b) => [b.id, b])),
    [businesses],
  );

  // Active schedules (pending or overdue)
  const activeSchedules = useMemo(
    () => schedules.filter((s) => !["done", "skipped", "cancelled"].includes(s.status)),
    [schedules],
  );

  // Reminders items with urgency
  const rawReminders = useMemo(
    () => buildReminderItems(schedules),
    [schedules],
  );

  // Overall KPI Stats
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

  // Calendar mapping
  const byDate = useMemo(() => {
    const map = new Map<string, Schedule[]>();
    for (const s of activeSchedules) {
      const key = storedToKey(getEffectiveDueDate(s));
      if (!key) continue;
      const list = map.get(key) || [];
      list.push(s);
      map.set(key, list);
    }
    return map;
  }, [activeSchedules]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // Month summary for Calendar view
  const monthSummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    let count = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayList = byDate.get(key) || [];
      for (const s of dayList) {
        count++;
        const amt = s.amount || 0;
        if (s.direction === "collect") income += amt;
        else expense += amt;
      }
    }

    return { income, expense, count, net: income - expense };
  }, [byDate, daysInMonth, month, year]);

  const selectedItems = selected ? byDate.get(selected) || [] : [];

  // Filtered Reminders for Agenda view
  const filteredReminders = useMemo(() => {
    return rawReminders.filter((r) => {
      if (directionFilter !== "all" && r.schedule.direction !== directionFilter) return false;
      if (businessFilter !== "all" && r.schedule.business_id !== businessFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const titleMatch = r.schedule.title.toLowerCase().includes(q);
        const bizName = (businessMap.get(r.schedule.business_id)?.name || "").toLowerCase();
        const bizMatch = bizName.includes(q);
        if (!titleMatch && !bizMatch) return false;
      }
      return true;
    });
  }, [rawReminders, directionFilter, businessFilter, search, businessMap]);

  const groupedAgenda = useMemo(() => {
    const overdue = filteredReminders.filter((r) => r.urgency === "overdue");
    const today = filteredReminders.filter((r) => r.urgency === "today");
    const soon = filteredReminders.filter(
      (r) => r.urgency === "soon" || r.urgency === "upcoming",
    );
    return { overdue, today, soon };
  }, [filteredReminders]);

  // Filtered for All view
  const allFilteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      if (directionFilter !== "all" && s.direction !== directionFilter) return false;
      if (businessFilter !== "all" && s.business_id !== businessFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const titleMatch = s.title.toLowerCase().includes(q);
        const bizName = (businessMap.get(s.business_id)?.name || "").toLowerCase();
        const bizMatch = bizName.includes(q);
        if (!titleMatch && !bizMatch) return false;
      }
      return true;
    });
  }, [schedules, directionFilter, businessFilter, search, businessMap]);

  const handleOpenComplete = (s: Schedule) => {
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

  const jumpToToday = () => {
    const today = new Date();
    setCursor(today);
    setSelected(dateKey(today));
  };

  return (
    <ModulePageShell module="cashflow">
      <div className="space-y-6">
        {/* 1. TOP BAR: Title, View Switcher & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                Lịch & Nhắc hẹn thu chi
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-[#007aff]/10 text-[#007aff] px-2.5 py-0.5 rounded-full">
                <Sparkles className="h-3 w-3" /> Thông minh & Tinh gọn
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Toàn cảnh lịch thu chi định kỳ, nhắc hẹn khẩn cấp và tiến độ dòng tiền
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
            {/* Apple Pro Segmented Switcher */}
            <div className="apple-segmented w-full sm:w-auto grid grid-cols-3 sm:flex">
              <button
                type="button"
                onClick={() => setViewMode("calendar")}
                className={cn(
                  "apple-segmented-item text-center justify-center flex items-center gap-1.5",
                  viewMode === "calendar" && "active",
                )}
              >
                <CalendarDays className="h-3.5 w-3.5" /> Lưới lịch
              </button>
              <button
                type="button"
                onClick={() => setViewMode("agenda")}
                className={cn(
                  "apple-segmented-item text-center justify-center flex items-center gap-1.5 relative",
                  viewMode === "agenda" && "active",
                )}
              >
                <Clock className="h-3.5 w-3.5" /> Nhắc việc
                {stats.overdueCount > 0 && (
                  <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setViewMode("all")}
                className={cn(
                  "apple-segmented-item text-center justify-center flex items-center gap-1.5",
                  viewMode === "all" && "active",
                )}
              >
                <ListFilter className="h-3.5 w-3.5" /> Tất cả
              </button>
            </div>

            <Link href="/dashboard/businesses" className="shrink-0">
              <Button
                variant="default"
                size="sm"
                className="rounded-full text-xs gap-1.5 h-8.5 px-4 font-semibold w-full sm:w-auto"
              >
                <Plus className="h-3.5 w-3.5" />
                Thêm lịch mới
              </Button>
            </Link>
          </div>
        </div>

        {/* 2. SMART KPI FINANCIAL BAR */}
        {loading ? (
          <SkeletonMetricCards />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* OVERDUE KPI */}
            <div
              onClick={() => setViewMode("agenda")}
              role="button"
              tabIndex={0}
              className={cn(
                "rounded-2xl border p-4.5 transition-all cursor-pointer text-left group",
                stats.overdueCount > 0
                  ? "border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/20 hover:border-rose-500/50"
                  : "border-border bg-card hover:border-foreground/20",
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
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-between">
                  <span>{stats.overdueCount > 0 ? "Cần xử lý ngay" : "Không có quá hạn"}</span>
                  <span className="text-[11px] text-[#007aff] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    Xem chi tiết →
                  </span>
                </p>
              </div>
            </div>

            {/* TODAY KPI */}
            <div
              onClick={() => setViewMode("agenda")}
              role="button"
              tabIndex={0}
              className={cn(
                "rounded-2xl border p-4.5 transition-all cursor-pointer text-left group",
                stats.todayCount > 0
                  ? "border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 hover:border-amber-500/50"
                  : "border-border bg-card hover:border-foreground/20",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className={cn("h-4 w-4", stats.todayCount > 0 ? "text-amber-500" : "text-muted-foreground")} />
                  Hôm nay
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
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-between">
                  <span>Trong ngày hôm nay</span>
                  <span className="text-[11px] text-[#007aff] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    Xem chi tiết →
                  </span>
                </p>
              </div>
            </div>

            {/* MONTHLY ESTIMATED INCOME */}
            <div className="rounded-2xl border border-border bg-card p-4.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ArrowDownLeft className="h-4 w-4 text-income" />
                  Dự thu tháng {month + 1}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-income/10 text-income border border-income/20">
                  +{displayMoney(monthSummary.income)}
                </span>
              </div>
              <div className="mt-3">
                <div className="text-xl sm:text-2xl font-mono font-bold text-income tracking-tight tabular-nums">
                  {displayMoney(monthSummary.income)}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activeSchedules.filter((s) => s.direction === "collect").length} nguồn thu dự kiến
                </p>
              </div>
            </div>

            {/* MONTHLY ESTIMATED EXPENSE */}
            <div className="rounded-2xl border border-border bg-card p-4.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ArrowUpRight className="h-4 w-4 text-expense" />
                  Dự chi tháng {month + 1}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-expense/10 text-expense border border-expense/20">
                  -{displayMoney(monthSummary.expense)}
                </span>
              </div>
              <div className="mt-3">
                <div className="text-xl sm:text-2xl font-mono font-bold text-expense tracking-tight tabular-nums">
                  {displayMoney(monthSummary.expense)}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Chênh lệch dự kiến: <strong className={cn("font-semibold", monthSummary.net >= 0 ? "text-income" : "text-expense")}>{monthSummary.net >= 0 ? "+" : ""}{displayMoney(monthSummary.net)}</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3. VIEW 1: CALENDAR GRID VIEW */}
        {viewMode === "calendar" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* CALENDAR GRID (8 Cols on lg) */}
            <div className="lg:col-span-7 xl:col-span-8 min-w-0">
              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
                {/* Calendar Month Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-foreground">
                      Tháng {month + 1}, {year}
                    </h2>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {monthSummary.count} lịch hẹn
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-semibold border-border rounded-lg"
                      onClick={jumpToToday}
                    >
                      Hôm nay
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={() => setCursor(new Date(year, month - 1, 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg"
                      onClick={() => setCursor(new Date(year, month + 1, 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Grid Body */}
                <div className="p-3 sm:p-5">
                  {loading ? (
                    <div className="h-72 animate-pulse bg-muted/40 rounded-xl" />
                  ) : (
                    <>
                      {/* Weekday headers */}
                      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                        {WEEKDAYS.map((w, idx) => (
                          <div
                            key={w}
                            className={cn(
                              "text-center text-xs font-semibold py-1 uppercase tracking-wider",
                              idx >= 5 ? "text-amber-500/80" : "text-muted-foreground",
                            )}
                          >
                            {w}
                          </div>
                        ))}
                      </div>

                      {/* Day Cells */}
                      <div className="grid grid-cols-7 gap-1 sm:gap-2">
                        {cells.map((day, i) => {
                          if (day === null) {
                            return (
                              <div
                                key={`empty-${i}`}
                                className="aspect-square rounded-xl bg-transparent min-h-[44px]"
                              />
                            );
                          }

                          const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                          const dayEvents = byDate.get(key) || [];
                          const count = dayEvents.length;
                          const isToday = key === dateKey(new Date());
                          const isSelected = selected === key;

                          const hasIncome = dayEvents.some((e) => e.direction === "collect");
                          const hasExpense = dayEvents.some((e) => e.direction === "pay");

                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setSelected(key)}
                              className={cn(
                                "aspect-square rounded-xl border p-1 sm:p-2 flex flex-col items-center justify-between transition-all duration-150 relative min-h-[44px] sm:min-h-[56px] select-none",
                                isSelected
                                  ? "border-foreground/40 bg-foreground/5 shadow-xs ring-2 ring-income/30 font-bold"
                                  : "border-border/60 bg-card hover:border-foreground/20 hover:bg-muted/30",
                                isToday && "border-income/60 bg-income/5",
                              )}
                            >
                              <span
                                className={cn(
                                  "text-xs sm:text-sm font-semibold leading-none mt-0.5",
                                  isToday
                                    ? "text-income font-bold"
                                    : isSelected
                                      ? "text-foreground"
                                      : "text-foreground/80",
                                )}
                              >
                                {day}
                              </span>

                              {count > 0 && (
                                <div className="flex items-center gap-1 mb-0.5">
                                  {hasIncome && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-income shrink-0" />
                                  )}
                                  {hasExpense && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-expense shrink-0" />
                                  )}
                                  <span className="text-[10px] font-mono text-muted-foreground hidden sm:inline leading-none font-medium">
                                    {count}
                                  </span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* DAY INSPECTION PANEL (4 Cols on lg) */}
            <div className="lg:col-span-5 xl:col-span-4 min-w-0 space-y-4">
              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
                <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-income" />
                    <h3 className="text-sm sm:text-base font-bold text-foreground">
                      {selected ? formatDisplayDate(selected) : "Chi tiết ngày"}
                    </h3>
                  </div>
                  {selectedItems.length > 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-income/10 text-income border border-income/20">
                      {selectedItems.length} khoản
                    </span>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  {!selected ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Nhấn vào một ngày trên lịch để xem các khoản thu chi.
                    </p>
                  ) : selectedItems.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground space-y-1">
                      <Clock className="h-6 w-6 text-muted-foreground/40 mx-auto mb-1.5" />
                      <p className="text-sm font-medium">Không có lịch thu/chi</p>
                      <p className="text-xs opacity-75">
                        Ngày này không có lịch hẹn nào được tạo.
                      </p>
                    </div>
                  ) : (
                    selectedItems.map((s) => {
                      const biz = businessMap.get(s.business_id);
                      const isCollect = s.direction === "collect";
                      return (
                        <div
                          key={s.id}
                          className={cn(
                            "rounded-xl border p-3.5 space-y-2.5 transition-all",
                            isCollect
                              ? "border-income/20 bg-income/5"
                              : "border-expense/20 bg-expense/5",
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={cn(
                                    "text-[10px] font-bold px-1.5 py-0.2 rounded uppercase",
                                    isCollect
                                      ? "bg-income/20 text-income"
                                      : "bg-expense/20 text-expense",
                                  )}
                                >
                                  {isCollect ? "Thu" : "Chi"}
                                </span>
                                <p className="font-semibold text-sm text-foreground truncate">
                                  {s.title}
                                </p>
                              </div>
                              {biz && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {biz.name}
                                </p>
                              )}
                            </div>

                            {s.amount ? (
                              <span
                                className={cn(
                                  "font-mono font-bold text-sm shrink-0",
                                  isCollect ? "text-income" : "text-expense",
                                )}
                              >
                                {isCollect ? "+" : "-"}
                                {displayMoney(s.amount)}
                              </span>
                            ) : null}
                          </div>

                          <div className="pt-2 border-t border-border/50 flex items-center justify-end">
                            <AccentButton
                              module="cashflow"
                              className="h-7.5 text-xs px-3 gap-1 rounded-lg"
                              onClick={() => handleOpenComplete(s)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Ghi nhận đã {isCollect ? "thu" : "chi"}
                            </AccentButton>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. VIEW 2: AGENDA / SMART REMINDERS VIEW */}
        {viewMode === "agenda" && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border">
              <div className="apple-segmented w-full sm:w-auto grid grid-cols-3 sm:flex">
                <button
                  type="button"
                  onClick={() => setDirectionFilter("all")}
                  className={cn(
                    "apple-segmented-item text-center justify-center",
                    directionFilter === "all" && "active",
                  )}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setDirectionFilter("collect")}
                  className={cn(
                    "apple-segmented-item text-center justify-center flex items-center gap-1",
                    directionFilter === "collect" && "active",
                  )}
                >
                  <ArrowDownLeft className="h-3.5 w-3.5" /> Phải thu
                </button>
                <button
                  type="button"
                  onClick={() => setDirectionFilter("pay")}
                  className={cn(
                    "apple-segmented-item text-center justify-center flex items-center gap-1",
                    directionFilter === "pay" && "active",
                  )}
                >
                  <ArrowUpRight className="h-3.5 w-3.5" /> Phải chi
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative w-full sm:w-44">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm tiêu đề..."
                    className="pl-8.5 h-10 text-base sm:text-xs"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                {businesses.length > 0 && (
                  <Select value={businessFilter} onValueChange={setBusinessFilter}>
                    <SelectTrigger className="h-10 text-base sm:text-xs w-full sm:w-auto sm:min-w-[140px]">
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

            {/* Reminder Groups */}
            {loading ? (
              <SkeletonTable />
            ) : filteredReminders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card">
                <CalendarIcon className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2.5" />
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
                {groupedAgenda.overdue.length > 0 && (
                  <ModuleSectionCard
                    title={`Quá hạn (${groupedAgenda.overdue.length})`}
                    description="Các khoản đã vượt quá ngày đến hạn — ưu tiên hoàn tất"
                  >
                    <div className="p-4 space-y-2.5">
                      {groupedAgenda.overdue.map((r) => (
                        <ReminderPanel
                          key={`${r.schedule.id}-${r.dueDate}`}
                          items={[r]}
                          onComplete={(id) => {
                            const s = schedules.find((x) => x.id === id);
                            if (s) handleOpenComplete(s);
                          }}
                          businessName={businessMap.get(r.schedule.business_id)?.name}
                        />
                      ))}
                    </div>
                  </ModuleSectionCard>
                )}

                {/* TODAY GROUP */}
                {groupedAgenda.today.length > 0 && (
                  <ModuleSectionCard
                    title={`Đến hạn hôm nay (${groupedAgenda.today.length})`}
                    description="Các khoản cần thu/chi trong ngày hôm nay"
                  >
                    <div className="p-4 space-y-2.5">
                      {groupedAgenda.today.map((r) => (
                        <ReminderPanel
                          key={`${r.schedule.id}-${r.dueDate}`}
                          items={[r]}
                          onComplete={(id) => {
                            const s = schedules.find((x) => x.id === id);
                            if (s) handleOpenComplete(s);
                          }}
                          businessName={businessMap.get(r.schedule.business_id)?.name}
                        />
                      ))}
                    </div>
                  </ModuleSectionCard>
                )}

                {/* UPCOMING GROUP */}
                {groupedAgenda.soon.length > 0 && (
                  <ModuleSectionCard
                    title={`Sắp tới (${groupedAgenda.soon.length})`}
                    description="Các khoản dự kiến trong những ngày tiếp theo"
                  >
                    <div className="p-4 space-y-2.5">
                      {groupedAgenda.soon.map((r) => (
                        <ReminderPanel
                          key={`${r.schedule.id}-${r.dueDate}`}
                          items={[r]}
                          onComplete={(id) => {
                            const s = schedules.find((x) => x.id === id);
                            if (s) handleOpenComplete(s);
                          }}
                          businessName={businessMap.get(r.schedule.business_id)?.name}
                        />
                      ))}
                    </div>
                  </ModuleSectionCard>
                )}
              </div>
            )}
          </div>
        )}

        {/* 5. VIEW 3: ALL SCHEDULES LIST VIEW */}
        {viewMode === "all" && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border">
              <div className="apple-segmented w-full sm:w-auto grid grid-cols-3 sm:flex">
                <button
                  type="button"
                  onClick={() => setDirectionFilter("all")}
                  className={cn(
                    "apple-segmented-item text-center justify-center",
                    directionFilter === "all" && "active",
                  )}
                >
                  Tất cả ({allFilteredSchedules.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDirectionFilter("collect")}
                  className={cn(
                    "apple-segmented-item text-center justify-center flex items-center gap-1",
                    directionFilter === "collect" && "active",
                  )}
                >
                  <ArrowDownLeft className="h-3.5 w-3.5" /> Phải thu
                </button>
                <button
                  type="button"
                  onClick={() => setDirectionFilter("pay")}
                  className={cn(
                    "apple-segmented-item text-center justify-center flex items-center gap-1",
                    directionFilter === "pay" && "active",
                  )}
                >
                  <ArrowUpRight className="h-3.5 w-3.5" /> Phải chi
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative w-full sm:w-44">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm lịch..."
                    className="pl-8.5 h-10 text-base sm:text-xs"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                {businesses.length > 0 && (
                  <Select value={businessFilter} onValueChange={setBusinessFilter}>
                    <SelectTrigger className="h-10 text-base sm:text-xs w-full sm:w-auto sm:min-w-[140px]">
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

            {/* Schedules Table */}
            {loading ? (
              <SkeletonTable />
            ) : allFilteredSchedules.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card">
                <Layers className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2.5" />
                <p className="text-sm font-semibold text-foreground">
                  Chưa có lịch thu chi nào
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tạo lịch thu/chi mới trong các mảng kinh doanh để hệ thống tự động theo dõi.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
                <div className="divide-y divide-border">
                  {allFilteredSchedules.map((s) => {
                    const biz = businessMap.get(s.business_id);
                    const isCollect = s.direction === "collect";
                    const isDone = s.status === "done";
                    const dueDate = getEffectiveDueDate(s);

                    return (
                      <div
                        key={s.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "text-[10px] font-bold px-1.5 py-0.2 rounded uppercase",
                                isCollect
                                  ? "bg-income/15 text-income border border-income/20"
                                  : "bg-expense/15 text-expense border border-expense/20",
                              )}
                            >
                              {isCollect ? "Thu" : "Chi"}
                            </span>
                            <span className="font-semibold text-sm text-foreground truncate">
                              {s.title}
                            </span>
                            {s.schedule_kind === "recurring" && (
                              <span className="text-[10px] font-medium bg-muted px-1.5 py-0.2 rounded text-muted-foreground">
                                Lặp lại
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>Hạn: <strong className="font-medium text-foreground">{dueDate}</strong></span>
                            {biz && <span>• Mảng: {biz.name}</span>}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                          {s.amount ? (
                            <span
                              className={cn(
                                "font-mono font-bold text-sm sm:text-base tabular-nums",
                                isCollect ? "text-income" : "text-expense",
                              )}
                            >
                              {isCollect ? "+" : "-"}
                              {displayMoney(s.amount)}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground font-mono">Tùy biến</span>
                          )}

                          {!isDone && (
                            <AccentButton
                              module="cashflow"
                              className="h-8 text-xs px-3 gap-1 rounded-lg shrink-0"
                              onClick={() => handleOpenComplete(s)}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Ghi nhận
                            </AccentButton>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 6. COMPLETE CONFIRMATION MODAL */}
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
                    Mảng: {businessMap.get(completeTarget.business_id)?.name}
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

              <div className="flex gap-2.5 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 h-10 text-sm rounded-xl"
                  onClick={() => setCompleteTarget(null)}
                >
                  Hủy
                </Button>
                <AccentButton
                  module="cashflow"
                  className="flex-1 h-10 text-sm font-semibold gap-1.5 rounded-xl"
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

export default function CalendarPage() {
  return (
    <Suspense fallback={<SkeletonMetricCards />}>
      <CalendarContent />
    </Suspense>
  );
}
