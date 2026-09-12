"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  LayoutGrid,
  LayoutList,
  TrendingUp,
  TrendingDown,
  Wallet,
  FileText,
  History,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import {
  ModulePageShell,
  AccentButton,
} from "@/components/dashboard/module-shell";
import { BusinessHubCard } from "@/components/dashboard/business-hub-card";
import { BusinessHubList } from "@/components/dashboard/business-hub-list";
import { ReminderPanel } from "@/components/dashboard/reminder-panel";
import { CashflowReportsSection } from "@/components/dashboard/cashflow-reports-section";
import { CapitalAdjustDialog } from "@/components/dashboard/capital-adjust-dialog";
import { ReportDialog } from "@/components/dashboard/report-dialog";
import { CapitalOverviewCard } from "@/components/dashboard/capital-overview-card";
import { AccountBalanceDialog } from "@/components/dashboard/account-balance-dialog";
import { AccountBalanceCard } from "@/components/dashboard/account-balance-card";
import { TransactionHistoryDialog } from "@/components/dashboard/transaction-history-dialog";
import { SchedulesSummaryDialog } from "@/components/dashboard/schedules-summary-dialog";
import { SkeletonMetricCards } from "@/components/ui/skeleton-loader";
import { Button } from "@/components/ui/button";
import {
  fetchBusinessSummaries,
  fetchBusinesses,
  fetchPortfolioSettings,
  fetchSchedules,
  fetchTransactions,
  subscribeLap68Tables,
  syncScheduleStatuses,
} from "@/lib/supabase";
import { buildReminderItems } from "@/lib/schedule-engine";
import {
  computeCapitalSnapshot,
  computePortfolioCapital,
  parseBusinessCapital,
} from "@/lib/capital";
import { totalLiquidBalance } from "@/lib/account-balance";
import type { UserPortfolioSettings } from "@/lib/account-balance";
import type {
  Business,
  BusinessSummary,
  Schedule,
  Transaction,
} from "@/lib/types";
import { displayMoney } from "@/lib/format-money";
import { parseDisplayDate } from "@/lib/format-date";
import { cn } from "@/lib/utils";

type TimeframeOption = "month" | "all" | "last_month";

export default function DashboardHubPage() {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<BusinessSummary[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<TimeframeOption>("month");
  const [businessViewMode, setBusinessViewMode] = useState<"list" | "grid">("list");

  // Dialog states
  const [capitalOpen, setCapitalOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [schedulesOpen, setSchedulesOpen] = useState(false);
  const [portfolioSettings, setPortfolioSettings] =
    useState<UserPortfolioSettings>({ liquid_accounts: [], updated_at: null });

  const load = useCallback(async () => {
    if (!user) return;
    try {
      await syncScheduleStatuses(user.id);
      const [s, biz, txs, sch, portfolio] = await Promise.all([
        fetchBusinessSummaries(user.id),
        fetchBusinesses(user.id),
        fetchTransactions(user.id),
        fetchSchedules(user.id),
        fetchPortfolioSettings(user.id),
      ]);
      setSummaries(s);
      setBusinesses(biz);
      setTransactions(txs);
      setSchedules(sch);
      setPortfolioSettings(portfolio);
    } catch {
      toast.error("Không tải được dữ liệu");
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

  const reminders = useMemo(() => buildReminderItems(schedules), [schedules]);

  const overdueCount = useMemo(() => {
    return reminders.filter((r) => r.urgency === "overdue").length;
  }, [reminders]);

  const dueSoonCount = useMemo(() => {
    return reminders.filter((r) => r.urgency === "today" || r.urgency === "upcoming").length;
  }, [reminders]);

  const overdueByBusiness = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of schedules) {
      if (
        s.status === "overdue" ||
        buildReminderItems([s])[0]?.urgency === "overdue"
      ) {
        map.set(s.business_id, (map.get(s.business_id) || 0) + 1);
      }
    }
    return map;
  }, [schedules]);

  // Current and last month dates
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;

  // Compute active stats based on timeframe
  const activeStats = useMemo(() => {
    const filteredTxs = transactions.filter((t) => {
      if (timeframe === "all") return true;
      const d = parseDisplayDate(t.transaction_date);
      if (!d) return false;
      if (timeframe === "month") {
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      }
      if (timeframe === "last_month") {
        return d.getFullYear() === lastMonthYear && d.getMonth() === lastMonth;
      }
      return true;
    });

    const incomeTxs = filteredTxs.filter((t) => t.type === "income");
    const expenseTxs = filteredTxs.filter((t) => t.type === "expense");

    const income = incomeTxs.reduce((a, t) => a + t.amount, 0);
    const expense = expenseTxs.reduce((a, t) => a + t.amount, 0);
    const profit = income - expense;
    const margin = income > 0 ? (profit / income) * 100 : 0;

    return {
      income,
      expense,
      profit,
      margin,
      txCount: filteredTxs.length,
      incomeCount: incomeTxs.length,
      expenseCount: expenseTxs.length,
    };
  }, [transactions, timeframe, currentYear, currentMonth, lastMonthYear, lastMonth]);

  const capitalSnapshot = useMemo(
    () => computePortfolioCapital(businesses, summaries),
    [businesses, summaries],
  );

  const liquidTotal = useMemo(
    () => totalLiquidBalance(portfolioSettings),
    [portfolioSettings],
  );

  const capitalByBusiness = useMemo(() => {
    const map = new Map<string, ReturnType<typeof computeCapitalSnapshot>>();
    for (const s of summaries) {
      const b = businesses.find((x) => x.id === s.business_id);
      if (!b) continue;
      map.set(
        s.business_id,
        computeCapitalSnapshot(
          parseBusinessCapital(b.ghi_chu),
          Number(s.net_profit),
        ),
      );
    }
    return map;
  }, [summaries, businesses]);

  const timeframeLabel =
    timeframe === "month"
      ? `Tháng ${currentMonth + 1}/${currentYear}`
      : timeframe === "last_month"
        ? `Tháng ${lastMonth + 1}/${lastMonthYear}`
        : "Toàn thời gian";

  return (
    <ModulePageShell module="cashflow">
      <div className="space-y-6">
        {/* TOP BAR: Title, Apple Segmented Switcher & Pill Action Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Tổng quan dòng tiền & kinh doanh
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-[#007aff]/10 text-[#007aff] px-2.5 py-0.5 rounded-full">
                <Sparkles className="h-3 w-3" /> Trực quan & Tự động
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Theo dõi hiệu quả tài chính, vốn đầu tư và phân tích toàn bộ mảng kinh doanh
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Apple Segmented Control */}
            <div className="apple-segmented">
              <button
                type="button"
                onClick={() => setTimeframe("month")}
                className={cn(
                  "apple-segmented-item",
                  timeframe === "month" && "active",
                )}
              >
                Tháng này
              </button>
              <button
                type="button"
                onClick={() => setTimeframe("last_month")}
                className={cn(
                  "apple-segmented-item",
                  timeframe === "last_month" && "active",
                )}
              >
                Tháng trước
              </button>
              <button
                type="button"
                onClick={() => setTimeframe("all")}
                className={cn(
                  "apple-segmented-item",
                  timeframe === "all" && "active",
                )}
              >
                Toàn bộ
              </button>
            </div>

            {/* Apple Pill Quick Actions */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full text-xs gap-1.5 h-8.5 px-3.5"
                onClick={() => setReportOpen(true)}
              >
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                Báo cáo
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full text-xs gap-1.5 h-8.5 px-3.5"
                onClick={() => setHistoryOpen(true)}
              >
                <History className="h-3.5 w-3.5 text-muted-foreground" />
                Lịch sử
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full text-xs gap-1.5 h-8.5 px-3.5"
                onClick={() => setSchedulesOpen(true)}
              >
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Lịch thu chi
              </Button>
              <Link href="/dashboard/businesses">
                <Button
                  variant="default"
                  size="sm"
                  className="rounded-full text-xs gap-1.5 h-8.5 px-4 font-semibold"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Quản lý việc
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* SMART ALERT: Overdue or due soon items */}
        {overdueCount > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-[#ff3b30]/20 bg-[#ff3b30]/8 text-[#ff3b30] backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-[#ff3b30]/15 text-[#ff3b30] shrink-0">
                <AlertTriangle className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs sm:text-sm font-semibold tracking-tight">
                  Có {overdueCount} khoản thu/chi quá hạn cần xử lý!
                </p>
                <p className="text-[11px] opacity-80 mt-0.5">
                  Kiểm tra và ghi nhận giao dịch để đảm bảo số dư đối soát chính xác
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-full text-xs font-semibold bg-card border-[#ff3b30]/30 text-[#ff3b30] hover:bg-[#ff3b30]/10 shrink-0"
              onClick={() => setSchedulesOpen(true)}
            >
              Xử lý ngay <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        )}

        {/* 1. HERO FINANCIAL OVERVIEW (4 KEY APPLE PRO BENTO CARDS) */}
        {loading ? (
          <SkeletonMetricCards />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* CARD 1: NET PROFIT (HERO CARD) */}
            <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card p-5 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Lợi nhuận ròng
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border",
                    activeStats.profit >= 0
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60"
                      : "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60",
                  )}
                >
                  {activeStats.profit >= 0 ? "+" : ""}
                  {activeStats.margin.toFixed(1)}%
                </span>
              </div>

              <div className="my-3.5">
                <div className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums">
                  {displayMoney(activeStats.profit)}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Kỳ xem: <strong className="text-zinc-800 dark:text-zinc-200 font-medium">{timeframeLabel}</strong>
                </p>
              </div>

              <div className="pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                <span>{activeStats.txCount} giao dịch</span>
                <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                  {activeStats.profit >= 0 ? "Dòng tiền dương" : "Dòng tiền âm"}
                </span>
              </div>
            </div>

            {/* CARD 2: TOTAL INCOME */}
            <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card p-5 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Dòng tiền thu
                </span>
                <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40">
                  <TrendingUp className="h-4 w-4" />
                </span>
              </div>

              <div className="my-3.5">
                <div className="text-2xl sm:text-3xl font-mono font-bold text-zinc-900 dark:text-zinc-100 tracking-tight tabular-nums">
                  {displayMoney(activeStats.income)}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Tổng thu trong {timeframeLabel.toLowerCase()}
                </p>
              </div>

              <div className="pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                <span>{activeStats.incomeCount} khoản thu</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">100% doanh số</span>
              </div>
            </div>

            {/* CARD 3: TOTAL EXPENSE */}
            <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card p-5 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Dòng tiền chi
                </span>
                <span className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40">
                  <TrendingDown className="h-4 w-4" />
                </span>
              </div>

              <div className="my-3.5">
                <div className="text-2xl sm:text-3xl font-mono font-bold text-zinc-900 dark:text-zinc-100 tracking-tight tabular-nums">
                  {displayMoney(activeStats.expense)}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Tổng chi trong {timeframeLabel.toLowerCase()}
                </p>
              </div>

              <div className="pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                <span>{activeStats.expenseCount} khoản chi</span>
                <span className="text-xs text-zinc-500 font-medium">
                  Tỷ lệ chi: {activeStats.income > 0 ? ((activeStats.expense / activeStats.income) * 100).toFixed(0) : 0}%
                </span>
              </div>
            </div>

            {/* CARD 4: BANK LIQUIDITY & CAPITAL */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setAccountOpen(true)}
              onKeyDown={(e) => e.key === "Enter" && setAccountOpen(true)}
              className="relative overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card p-5 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer active:scale-[0.98] transition-all flex flex-col justify-between group text-left"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                  Số dư tài khoản
                </span>
                <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 group-hover:scale-105 transition-transform">
                  <Wallet className="h-4 w-4" />
                </span>
              </div>

              <div className="my-3.5">
                <div className="text-2xl sm:text-3xl font-mono font-bold text-zinc-900 dark:text-zinc-100 tracking-tight tabular-nums">
                  {displayMoney(liquidTotal)}
                </div>
                <p className="text-xs text-zinc-500 mt-1 flex items-center justify-between">
                  <span>Vốn khả dụng:</span>
                  <strong className="font-mono text-zinc-800 dark:text-zinc-200 font-semibold">
                    {displayMoney(capitalSnapshot.available_capital)}
                  </strong>
                </p>
              </div>

              <div className="pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                <span>
                  {portfolioSettings.liquid_accounts.length > 0
                    ? `${portfolioSettings.liquid_accounts.length} tài khoản thanh toán`
                    : "Cập nhật số dư"}
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
            </div>
          </div>
        )}

        {/* 2. BENTO MAIN CONTENT (2 COLUMNS: 8 cols LEFT, 4 cols RIGHT) */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: BUSINESS PORTFOLIO & REPORTS (8 Cols) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              {/* SECTION: BUSINESSES */}
              <section className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                      Mảng kinh doanh
                    </h2>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {summaries.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Switcher: List vs Grid */}
                    {summaries.length > 0 && (
                      <div className="flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60">
                        <button
                          type="button"
                          onClick={() => setBusinessViewMode("list")}
                          className={cn(
                            "p-1.5 rounded-md transition-all",
                            businessViewMode === "list"
                              ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                              : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200",
                          )}
                          title="Xem dạng danh sách gọn gàng"
                          aria-label="Xem dạng danh sách gọn gàng"
                        >
                          <LayoutList className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setBusinessViewMode("grid")}
                          className={cn(
                            "p-1.5 rounded-md transition-all",
                            businessViewMode === "grid"
                              ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                              : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200",
                          )}
                          title="Xem dạng thẻ lưới"
                          aria-label="Xem dạng thẻ lưới"
                        >
                          <LayoutGrid className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    <Link
                      href="/dashboard/businesses"
                      className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:underline flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> Thêm mảng
                    </Link>
                  </div>
                </div>

                {summaries.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center bg-card">
                    <p className="text-zinc-500 mb-3 text-sm">
                      Chưa có việc kinh doanh nào được thiết lập.
                    </p>
                    <Link href="/dashboard/businesses">
                      <Button variant="default">Tạo việc đầu tiên</Button>
                    </Link>
                  </div>
                ) : businessViewMode === "list" ? (
                  <BusinessHubList
                    summaries={summaries}
                    capitalMap={capitalByBusiness}
                    overdueMap={overdueByBusiness}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {summaries.map((s, i) => (
                      <BusinessHubCard
                        key={s.business_id}
                        summary={s}
                        capital={capitalByBusiness.get(s.business_id)}
                        overdueCount={overdueByBusiness.get(s.business_id) || 0}
                        delay={i * 50}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* SECTION: CASHFLOW ANALYTICS & REPORTS */}
              {transactions.length > 0 && (
                <section id="bao-cao" className="space-y-3.5 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                        Báo cáo & Phân tích chuyên sâu
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Biểu đồ xu hướng dòng tiền và tỷ trọng đóng góp của từng mảng kinh doanh
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground hover:text-foreground rounded-full"
                      onClick={() => setReportOpen(true)}
                    >
                      Báo cáo đầy đủ <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>

                  <CashflowReportsSection
                    transactions={transactions}
                    summaries={summaries}
                  />
                </section>
              )}
            </div>

            {/* RIGHT COLUMN: LIQUIDITY, CAPITAL & SCHEDULES (4 Cols) */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-6">
              {/* 1. Account Balance Card */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-bold text-foreground tracking-tight">
                    Tài khoản thanh toán
                  </h3>
                  <button
                    type="button"
                    onClick={() => setAccountOpen(true)}
                    className="text-xs text-[#007aff] hover:underline font-semibold"
                  >
                    Đối soát số dư
                  </button>
                </div>
                <AccountBalanceCard
                  settings={portfolioSettings}
                  compact
                  onClick={() => setAccountOpen(true)}
                />
              </div>

              {/* 2. Capital Snapshot Card */}
              {summaries.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-bold text-foreground tracking-tight">
                      Nguồn vốn kinh doanh
                    </h3>
                    <button
                      type="button"
                      onClick={() => setCapitalOpen(true)}
                      className="text-xs text-[#007aff] hover:underline font-semibold"
                    >
                      Tinh chỉnh vốn
                    </button>
                  </div>
                  <CapitalOverviewCard
                    snapshot={capitalSnapshot}
                    compact
                    onClick={() => setCapitalOpen(true)}
                  />
                </div>
              )}

              {/* 3. Upcoming Reminders & Schedules */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-foreground tracking-tight">
                      Lịch thu chi sắp tới
                    </h3>
                    {dueSoonCount > 0 && (
                      <span className="text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-black/[0.05] dark:bg-white/[0.08] text-foreground/80">
                        {dueSoonCount}
                      </span>
                    )}
                  </div>
                  <Link
                    href="/dashboard/reminders"
                    className="text-xs text-muted-foreground hover:text-[#007aff] font-medium"
                  >
                    Xem tất cả
                  </Link>
                </div>
                <ReminderPanel items={reminders.slice(0, 5)} compact />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DIALOGS */}
      <CapitalAdjustDialog
        open={capitalOpen}
        onOpenChange={setCapitalOpen}
        businesses={businesses}
        onSuccess={load}
      />
      <AccountBalanceDialog
        open={accountOpen}
        onOpenChange={setAccountOpen}
        settings={portfolioSettings}
        onSuccess={load}
      />
      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        businesses={businesses}
        transactions={transactions}
        defaultBusinessId="all"
      />
      <TransactionHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        transactions={transactions}
      />
      <SchedulesSummaryDialog
        open={schedulesOpen}
        onOpenChange={setSchedulesOpen}
        schedules={schedules}
      />
    </ModulePageShell>
  );
}

