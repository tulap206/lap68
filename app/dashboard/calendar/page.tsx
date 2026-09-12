"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import {
  ModulePageShell,
  ModuleSubpageHeader,
  ModuleSectionCard,
  AccentButton,
} from "@/components/dashboard/module-shell";
import {
  fetchSchedules,
  fetchBusinesses,
  syncScheduleStatuses,
  completeSchedule,
} from "@/lib/supabase";
import { getEffectiveDueDate, parseStoredDate } from "@/lib/schedule-engine";
import {
  displayMoney,
  formatMoneyInput,
  parseMoneyInput,
} from "@/lib/format-money";
import { formatDisplayDate } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import type { Schedule, Business } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function storedToKey(stored: string): string | null {
  const d = parseStoredDate(stored);
  if (!d) return null;
  return dateKey(d);
}

export default function CalendarPage() {
  const { user, logAction } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState<string | null>(() => dateKey(new Date()));
  const [loading, setLoading] = useState(true);

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
      setSchedules(
        sch.filter((s) => !["done", "skipped", "cancelled"].includes(s.status)),
      );
      setBusinesses(biz);
    } catch {
      toast.error("Không tải được lịch");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const businessMap = useMemo(
    () => new Map(businesses.map((b) => [b.id, b])),
    [businesses],
  );

  const byDate = useMemo(() => {
    const map = new Map<string, Schedule[]>();
    for (const s of schedules) {
      const key = storedToKey(getEffectiveDueDate(s));
      if (!key) continue;
      const list = map.get(key) || [];
      list.push(s);
      map.set(key, list);
    }
    return map;
  }, [schedules]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // Calculate monthly planned sums
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
      toast.success("Đã ghi nhận giao dịch");
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
        <ModuleSubpageHeader
          module="cashflow"
          title="Lịch thu / chi theo ngày"
          subtitle="Tổng hợp các khoản dự kiến đến hạn theo từng ngày trong tháng"
        />

        {/* MONTH SUMMARY HEADER BANNER */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="p-4 rounded-2xl border border-border bg-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Thu dự kiến trong tháng
            </p>
            <p className="text-xl sm:text-2xl font-mono font-bold text-income mt-1.5 tabular-nums">
              +{displayMoney(monthSummary.income)}
            </p>
          </div>
          <div className="p-4 rounded-2xl border border-border bg-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Chi dự kiến trong tháng
            </p>
            <p className="text-xl sm:text-2xl font-mono font-bold text-expense mt-1.5 tabular-nums">
              -{displayMoney(monthSummary.expense)}
            </p>
          </div>
          <div className="p-4 rounded-2xl border border-border bg-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Chênh lệch dự kiến
            </p>
            <p
              className={cn(
                "text-xl sm:text-2xl font-mono font-bold mt-1.5 tabular-nums",
                monthSummary.net >= 0 ? "text-income" : "text-expense",
              )}
            >
              {monthSummary.net >= 0 ? "+" : ""}
              {displayMoney(monthSummary.net)}
            </p>
          </div>
        </div>

        {/* MAIN CALENDAR & DAY INSPECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CALENDAR GRID (8 Cols on lg) */}
          <div className="lg:col-span-7 xl:col-span-8 min-w-0">
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              {/* Calendar Controls */}
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
                    className="h-8 text-xs font-medium border-border"
                    onClick={jumpToToday}
                  >
                    Hôm nay
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCursor(new Date(year, month - 1, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
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
                              "aspect-square rounded-xl border p-1 sm:p-2 flex flex-col items-center justify-between transition-all duration-150 relative min-h-[44px] sm:min-h-[56px]",
                              isSelected
                                ? "border-foreground/40 bg-foreground/5 shadow-sm ring-2 ring-income/30 font-bold"
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
          <div className="lg:col-span-5 xl:col-span-4 min-w-0">
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-income" />
                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    {selected
                      ? formatDisplayDate(selected)
                      : "Chi tiết ngày"}
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
                            className="h-7.5 text-xs px-3 gap-1"
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

        {/* COMPLETE SCHEDULE MODAL */}
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
