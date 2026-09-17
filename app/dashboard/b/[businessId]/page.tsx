"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  CalendarClock,
  Landmark,
  SlidersHorizontal,
  BarChart3,
  FileText,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import {
  ModulePageShell,
  ModuleSubpageHeader,
  ModuleSectionCard,
} from "@/components/dashboard/module-shell";
import { BusinessSubNav } from "@/components/dashboard/business-sub-nav";
import { CashflowReportsSection } from "@/components/dashboard/cashflow-reports-section";
import { TransactionTypeBadge } from "@/components/dashboard/cashflow-ui";
import { ReminderPanel } from "@/components/dashboard/reminder-panel";
import { CapitalAdjustDialog } from "@/components/dashboard/capital-adjust-dialog";
import { ReportDialog } from "@/components/dashboard/report-dialog";
import { CapitalOverviewCard } from "@/components/dashboard/capital-overview-card";
import { SkeletonMetricCards } from "@/components/ui/skeleton-loader";
import { Button } from "@/components/ui/button";
import {
  fetchBusiness,
  fetchBusinesses,
  fetchTransactions,
  fetchSchedules,
  subscribeLap68Tables,
  syncScheduleStatuses,
} from "@/lib/supabase";
import { buildReminderItems } from "@/lib/schedule-engine";
import {
  computeCapitalSnapshot,
  parseBusinessCapital,
  capitalAdjustLabel,
} from "@/lib/capital";
import { displayMoney } from "@/lib/format-money";
import { formatDisplayDate } from "@/lib/format-date";
import type { Business, Schedule, Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function BusinessDashboardPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const businessId = params.businessId as string;
  const [business, setBusiness] = useState<Business | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [capitalOpen, setCapitalOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      await syncScheduleStatuses(user.id);
      const [b, txs, sch, biz] = await Promise.all([
        fetchBusiness(businessId),
        fetchTransactions(user.id, businessId),
        fetchSchedules(user.id, businessId),
        fetchBusinesses(user.id),
      ]);
      setBusiness(b);
      setTransactions(txs);
      setSchedules(sch);
      setAllBusinesses(biz);
    } catch {
      toast.error("Không tải được dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [user, businessId]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (!user) return;
    return subscribeLap68Tables(user.id, load);
  }, [user, load]);

  const stats = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const expense = transactions
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    const margin = income > 0 ? ((income - expense) / income) * 100 : 0;
    return {
      income,
      expense,
      profit: income - expense,
      margin,
      count: transactions.length,
    };
  }, [transactions]);

  const reminders = useMemo(() => buildReminderItems(schedules), [schedules]);
  const recent = transactions.slice(0, 6);

  const capitalSnapshot = useMemo(() => {
    if (!business) return null;
    const meta = parseBusinessCapital(business.ghi_chu);
    return computeCapitalSnapshot(meta, stats.profit);
  }, [business, stats.profit]);

  const capitalLedger = useMemo(() => {
    if (!business) return [];
    return [...parseBusinessCapital(business.ghi_chu).capital_ledger]
      .reverse()
      .slice(0, 5);
  }, [business]);

  if (!business && !loading) return null;

  return (
    <ModulePageShell module="cashflow">
      <div className="space-y-6">
        {/* SUB NAVIGATION TABS */}
        <BusinessSubNav businessId={businessId} />

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <span
              className="w-5 h-5 rounded-full shrink-0 shadow-xs ring-4 ring-white dark:ring-zinc-900"
              style={{ backgroundColor: business?.color || "#18181b" }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {business?.name || "..."}
                </h1>
                {business?.code && (
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 uppercase">
                    #{business.code}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {business?.description || "Tổng quan hiệu quả tài chính và dòng tiền"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide w-full sm:w-auto shrink-0">
            <Button
              variant="secondary"
              size="sm"
              className="rounded-full text-xs gap-1.5 h-8.5 px-3.5 whitespace-nowrap shrink-0"
              onClick={() => setCapitalOpen(true)}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              Tinh chỉnh vốn
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="rounded-full text-xs gap-1.5 h-8.5 px-3.5 whitespace-nowrap shrink-0"
              onClick={() => setReportOpen(true)}
            >
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              Báo cáo
            </Button>
            <Link href={`/dashboard/b/${businessId}/transactions`} className="shrink-0">
              <Button
                variant="default"
                size="sm"
                className="rounded-full text-xs gap-1.5 h-8.5 px-4 font-semibold whitespace-nowrap"
              >
                <Plus className="h-3.5 w-3.5" /> Ghi giao dịch
              </Button>
            </Link>
          </div>
        </div>

        {/* 5 BENTO KPI CARDS */}
        {loading ? (
          <SkeletonMetricCards />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5">
            {/* 1. NET PROFIT */}
            <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-zinc-500 truncate">
                  Lợi nhuận ròng
                </span>
                <span
                  className={cn(
                    "text-[10px] font-bold px-1.5 sm:px-2 py-0.2 rounded-full border shrink-0",
                    stats.profit >= 0
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400"
                      : "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400",
                  )}
                >
                  {stats.profit >= 0 ? "+" : ""}
                  {stats.margin.toFixed(1)}%
                </span>
              </div>
              <div className="my-2">
                <div
                  className={cn(
                    "text-lg sm:text-xl lg:text-2xl font-mono font-bold tracking-tight tabular-nums truncate",
                    stats.profit >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400",
                  )}
                >
                  {displayMoney(stats.profit)}
                </div>
              </div>
              <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate">
                {stats.count} giao dịch đã ghi
              </p>
            </div>

            {/* 2. INCOME */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/dashboard/b/${businessId}/transactions?type=income`)}
              className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card p-3.5 sm:p-4 shadow-xs flex flex-col justify-between cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Tổng thu
                </span>
                <span className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="my-2">
                <div className="text-lg sm:text-xl lg:text-2xl font-mono font-bold text-zinc-900 dark:text-zinc-100 tracking-tight tabular-nums truncate">
                  {displayMoney(stats.income)}
                </div>
              </div>
              <p className="text-[10px] sm:text-[11px] text-emerald-600 font-medium flex items-center justify-between">
                <span>Tiền vào</span>
                <ChevronRight className="h-3 w-3" />
              </p>
            </div>

            {/* 3. EXPENSE */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => router.push(`/dashboard/b/${businessId}/transactions?type=expense`)}
              className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card p-3.5 sm:p-4 shadow-xs flex flex-col justify-between cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Tổng chi
                </span>
                <span className="p-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                  <TrendingDown className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="my-2">
                <div className="text-lg sm:text-xl lg:text-2xl font-mono font-bold text-zinc-900 dark:text-zinc-100 tracking-tight tabular-nums truncate">
                  {displayMoney(stats.expense)}
                </div>
              </div>
              <p className="text-[10px] sm:text-[11px] text-rose-600 font-medium flex items-center justify-between">
                <span>Tiền ra</span>
                <ChevronRight className="h-3 w-3" />
              </p>
            </div>

            {/* 4. MARGIN */}
            <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Tỷ suất LN
                </span>
                <span className="p-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                  <BarChart3 className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="my-2">
                <div className="text-lg sm:text-xl lg:text-2xl font-mono font-bold text-zinc-900 dark:text-zinc-100 tracking-tight tabular-nums truncate">
                  {stats.margin.toFixed(1)}%
                </div>
              </div>
              <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate">
                Trên tổng thu
              </p>
            </div>

            {/* 5. CAPITAL */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setCapitalOpen(true)}
              className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card p-3.5 sm:p-4 shadow-xs flex flex-col justify-between cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-all text-left col-span-2 sm:col-span-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Vốn đầu tư
                </span>
                <span className="p-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  <Landmark className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="my-2">
                <div className="text-lg sm:text-xl lg:text-2xl font-mono font-bold text-zinc-900 dark:text-zinc-100 tracking-tight tabular-nums truncate">
                  {capitalSnapshot ? displayMoney(capitalSnapshot.base_capital) : "—"}
                </div>
              </div>
              <p className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center justify-between">
                <span>
                  {capitalSnapshot ? `Ròng ${displayMoney(capitalSnapshot.available_capital)}` : "Chỉnh vốn"}
                </span>
                <ChevronRight className="h-3 w-3" />
              </p>
            </div>
          </div>
        )}

        {/* CAPITAL OVERVIEW CARD IF AVAILABLE */}
        {capitalSnapshot && (
          <CapitalOverviewCard snapshot={capitalSnapshot} compact />
        )}

        {/* REMINDERS IF ANY */}
        {reminders.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-foreground tracking-tight">
              Nhắc hẹn của mảng này
            </h3>
            <ReminderPanel items={reminders.slice(0, 3)} compact />
          </div>
        )}

        {/* RECENT TRANSACTIONS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground tracking-tight">
                Giao dịch gần đây
              </h2>
              <p className="text-xs text-muted-foreground">
                Tổng cộng {stats.count} giao dịch đã ghi nhận
              </p>
            </div>
            <Link
              href={`/dashboard/b/${businessId}/transactions`}
              className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-foreground flex items-center gap-1"
            >
              Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center bg-card">
              <p className="text-xs text-muted-foreground mb-3">
                Chưa có giao dịch nào được ghi nhận cho mảng này.
              </p>
              <Link href={`/dashboard/b/${businessId}/transactions`}>
                <Button size="sm" className="rounded-full text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Ghi giao dịch đầu tiên
                </Button>
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/70 shadow-xs">
              {recent.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3.5 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <TransactionTypeBadge type={t.type} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {t.description || "Giao dịch không tên"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDisplayDate(t.transaction_date)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 whitespace-nowrap">
                    <span
                      className={cn(
                        "font-mono font-bold text-sm tabular-nums",
                        t.type === "income"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400",
                      )}
                    >
                      {t.type === "income" ? "+" : "-"}
                      {displayMoney(t.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CASHFLOW REPORTS SECTION */}
        {!loading && transactions.length > 0 && (
          <div className="space-y-3 pt-2">
            <div>
              <h2 className="text-base font-bold text-foreground tracking-tight">
                Báo cáo & Cơ cấu chi phí
              </h2>
              <p className="text-xs text-muted-foreground">
                Phân bổ thu chi theo danh mục và hiệu suất dòng tiền
              </p>
            </div>
            <CashflowReportsSection
              transactions={transactions}
              showComparison={false}
            />
          </div>
        )}

        {/* CAPITAL ADJUSTMENT HISTORY */}
        {capitalLedger.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-base font-bold text-foreground tracking-tight">
              Lịch sử điều chỉnh vốn
            </h2>
            <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/70 shadow-xs">
              {capitalLedger.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3.5 text-sm"
                >
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "font-semibold text-xs",
                        entry.type === "deposit"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400",
                      )}
                    >
                      {capitalAdjustLabel(entry.type)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {entry.note || "—"}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-sm tabular-nums whitespace-nowrap">
                    {entry.type === "deposit" ? "+" : "-"}
                    {displayMoney(entry.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DIALOGS */}
        <CapitalAdjustDialog
          open={capitalOpen}
          onOpenChange={setCapitalOpen}
          businesses={allBusinesses}
          defaultBusinessId={businessId}
          onSuccess={load}
        />
        <ReportDialog
          open={reportOpen}
          onOpenChange={setReportOpen}
          businesses={allBusinesses}
          transactions={transactions}
          defaultBusinessId={businessId}
        />
      </div>
    </ModulePageShell>
  );
}

