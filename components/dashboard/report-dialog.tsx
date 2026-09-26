"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { parseDisplayDate } from "@/lib/format-date";
import { displayMoney } from "@/lib/format-money";
import { BusinessIcon } from "@/components/dashboard/business-icon";
import type { Business, Transaction } from "@/lib/types";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  BarChart3,
  Layers,
  Users,
  Printer,
  Calendar,
  Sparkles,
  PieChart,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PeriodType = "month" | "quarter" | "six_months" | "year" | "custom";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businesses: Business[];
  transactions: Transaction[];
  defaultBusinessId?: string;
}

export function ReportDialog({
  open,
  onOpenChange,
  businesses,
  transactions,
  defaultBusinessId = "all",
}: ReportDialogProps) {
  const [periodType, setPeriodType] = useState<PeriodType>("month");
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>(defaultBusinessId);
  const [activeTab, setActiveTab] = useState<"businesses" | "categories" | "counterparties">("businesses");

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-11

  const [year, setYear] = useState<number>(currentYear);
  const [month, setMonth] = useState<number>(currentMonth);
  const [quarter, setQuarter] = useState<number>(Math.floor(currentMonth / 3) + 1);
  const [half, setHalf] = useState<number>(currentMonth < 6 ? 1 : 2);

  const todayStr = new Date().toISOString().split("T")[0];
  const firstDayOfMonthStr = new Date(currentYear, currentMonth, 1)
    .toISOString()
    .split("T")[0];
  const [customStart, setCustomStart] = useState<string>(firstDayOfMonthStr);
  const [customEnd, setCustomEnd] = useState<string>(todayStr);

  useEffect(() => {
    if (open) {
      setSelectedBusinessId(defaultBusinessId);
    }
  }, [open, defaultBusinessId]);

  const years = useMemo(() => {
    const list = [];
    for (let y = currentYear; y >= currentYear - 3; y--) {
      list.push(y);
    }
    return list;
  }, [currentYear]);

  const { start, end, label } = useMemo(() => {
    let start: Date;
    let end: Date;
    let label = "";

    if (periodType === "month") {
      start = new Date(year, month, 1);
      end = new Date(year, month + 1, 0, 23, 59, 59, 999);
      label = `Tháng ${month + 1}/${year}`;
    } else if (periodType === "quarter") {
      start = new Date(year, (quarter - 1) * 3, 1);
      end = new Date(year, quarter * 3, 0, 23, 59, 59, 999);
      label = `Quý ${quarter}/${year}`;
    } else if (periodType === "six_months") {
      start = new Date(year, (half - 1) * 6, 1);
      end = new Date(year, half * 6, 0, 23, 59, 59, 999);
      label = `${half === 1 ? "6 tháng đầu" : "6 tháng cuối"} năm ${year}`;
    } else if (periodType === "year") {
      start = new Date(year, 0, 1);
      end = new Date(year, 12, 0, 23, 59, 59, 999);
      label = `Năm ${year}`;
    } else {
      start = customStart ? new Date(customStart) : new Date(0);
      const parsedEnd = customEnd ? new Date(customEnd) : new Date();
      end = new Date(
        parsedEnd.getFullYear(),
        parsedEnd.getMonth(),
        parsedEnd.getDate(),
        23,
        59,
        59,
        999,
      );

      const formatD = (d: Date) => {
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
      };
      label = `${formatD(start)} - ${formatD(end)}`;
    }

    return { start, end, label };
  }, [periodType, year, month, quarter, half, customStart, customEnd]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (
        selectedBusinessId !== "all" &&
        t.business_id !== selectedBusinessId
      ) {
        return false;
      }
      const txDate = parseDisplayDate(t.transaction_date);
      if (!txDate) return false;
      return txDate >= start && txDate <= end;
    });
  }, [transactions, selectedBusinessId, start, end]);

  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    const categoriesMap: Record<
      string,
      { name: string; amount: number; type: string }
    > = {};
    const businessesMap: Record<
      string,
      { id: string; name: string; color?: string; income: number; expense: number }
    > = {};
    const counterpartiesMap: Record<
      string,
      { name: string; amount: number; type: string }
    > = {};

    businesses.forEach((b) => {
      businessesMap[b.id] = { id: b.id, name: b.name, color: b.color, income: 0, expense: 0 };
    });

    filteredTransactions.forEach((t) => {
      const amount = t.amount;

      if (t.type === "income") {
        income += amount;
        incomeCount++;
      } else {
        expense += amount;
        expenseCount++;
      }

      if (t.category_id) {
        const catName = t.category?.name || "Khác";
        if (!categoriesMap[t.category_id]) {
          categoriesMap[t.category_id] = {
            name: catName,
            amount: 0,
            type: t.type,
          };
        }
        categoriesMap[t.category_id].amount += amount;
      }

      if (t.business_id && businessesMap[t.business_id]) {
        if (t.type === "income") {
          businessesMap[t.business_id].income += amount;
        } else {
          businessesMap[t.business_id].expense += amount;
        }
      }

      if (t.counterparty_id) {
        const cpName = t.counterparty?.name || "Khách lẻ / Đối tác";
        if (!counterpartiesMap[t.counterparty_id]) {
          counterpartiesMap[t.counterparty_id] = {
            name: cpName,
            amount: 0,
            type: t.type,
          };
        }
        counterpartiesMap[t.counterparty_id].amount += amount;
      }
    });

    const profit = income - expense;
    const margin = income > 0 ? (profit / income) * 100 : 0;
    const expenseRatio = income > 0 ? (expense / income) * 100 : expense > 0 ? 100 : 0;

    const sortedCategories = Object.values(categoriesMap).sort(
      (a, b) => b.amount - a.amount,
    );
    const sortedBusinesses = Object.values(businessesMap)
      .map((b) => ({
        ...b,
        profit: b.income - b.expense,
        margin: b.income > 0 ? ((b.income - b.expense) / b.income) * 100 : 0,
      }))
      .filter((b) => b.income > 0 || b.expense > 0)
      .sort((a, b) => b.income - a.income);

    const sortedCounterparties = Object.values(counterpartiesMap).sort(
      (a, b) => b.amount - a.amount,
    );
    const topCustomers = sortedCounterparties
      .filter((c) => c.type === "income")
      .slice(0, 5);
    const topSuppliers = sortedCounterparties
      .filter((c) => c.type === "expense")
      .slice(0, 5);

    return {
      income,
      expense,
      profit,
      margin,
      expenseRatio,
      incomeCount,
      expenseCount,
      categories: sortedCategories,
      businesses: sortedBusinesses,
      topCustomers,
      topSuppliers,
      txCount: filteredTransactions.length,
    };
  }, [filteredTransactions, businesses]);

  const handlePrint = () => {
    window.print();
  };

  const selectedBizObj = businesses.find((b) => b.id === selectedBusinessId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto p-0 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl bg-card shadow-2xl text-foreground font-sans">
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @media print {
                body * { visibility: hidden !important; }
                #printable-report-area, #printable-report-area * { visibility: visible !important; }
                #printable-report-area {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  background: white !important;
                  color: black !important;
                  padding: 20px !important;
                }
                .no-print { display: none !important; }
              }
            `,
          }}
        />

        {/* 1. TOP TOOLBAR & CONTROLS (Sticky) */}
        <div className="p-4 sm:p-5 border-b border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 no-print sticky top-0 z-40">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            {/* Business Selector */}
            <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
              <SelectTrigger className="w-full sm:w-44 h-9 rounded-xl bg-card border-zinc-200 dark:border-zinc-800 text-xs font-medium">
                <SelectValue placeholder="Tất cả mảng việc" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-zinc-200 dark:border-zinc-800">
                <SelectItem value="all">
                  <span className="font-semibold">Tất cả mảng việc</span>
                </SelectItem>
                {businesses.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Period Type */}
            <Select value={periodType} onValueChange={(val) => setPeriodType(val as PeriodType)}>
              <SelectTrigger className="flex-1 sm:flex-none sm:w-32 h-9 rounded-xl bg-card border-zinc-200 dark:border-zinc-800 text-xs font-medium">
                <SelectValue placeholder="Kỳ báo cáo" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-zinc-200 dark:border-zinc-800">
                <SelectItem value="month">Theo Tháng</SelectItem>
                <SelectItem value="quarter">Theo Quý</SelectItem>
                <SelectItem value="six_months">6 Tháng</SelectItem>
                <SelectItem value="year">Theo Năm</SelectItem>
                <SelectItem value="custom">Tùy chọn</SelectItem>
              </SelectContent>
            </Select>

            {/* Year Select */}
            {periodType !== "custom" && (
              <Select value={String(year)} onValueChange={(val) => setYear(Number(val))}>
                <SelectTrigger className="w-24 h-9 rounded-xl bg-card border-zinc-200 dark:border-zinc-800 text-xs font-medium">
                  <SelectValue placeholder="Năm" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-zinc-200 dark:border-zinc-800">
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      Năm {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Month Select */}
            {periodType === "month" && (
              <Select value={String(month)} onValueChange={(val) => setMonth(Number(val))}>
                <SelectTrigger className="w-28 h-9 rounded-xl bg-card border-zinc-200 dark:border-zinc-800 text-xs font-medium">
                  <SelectValue placeholder="Tháng" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-zinc-200 dark:border-zinc-800">
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i} value={String(i)}>
                      Tháng {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Quarter Select */}
            {periodType === "quarter" && (
              <Select value={String(quarter)} onValueChange={(val) => setQuarter(Number(val))}>
                <SelectTrigger className="w-24 h-9 rounded-xl bg-card border-zinc-200 dark:border-zinc-800 text-xs font-medium">
                  <SelectValue placeholder="Quý" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-zinc-200 dark:border-zinc-800">
                  <SelectItem value="1">Quý I</SelectItem>
                  <SelectItem value="2">Quý II</SelectItem>
                  <SelectItem value="3">Quý III</SelectItem>
                  <SelectItem value="4">Quý IV</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* 6-Months Select */}
            {periodType === "six_months" && (
              <Select value={String(half)} onValueChange={(val) => setHalf(Number(val))}>
                <SelectTrigger className="w-32 h-9 rounded-xl bg-card border-zinc-200 dark:border-zinc-800 text-xs font-medium">
                  <SelectValue placeholder="Kỳ" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-zinc-200 dark:border-zinc-800">
                  <SelectItem value="1">6 tháng đầu</SelectItem>
                  <SelectItem value="2">6 tháng cuối</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Custom Dates Select */}
            {periodType === "custom" && (
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <Input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-32 h-9 rounded-xl bg-card border-zinc-200 dark:border-zinc-800 text-xs"
                />
                <span className="text-muted-foreground text-xs">→</span>
                <Input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-32 h-9 rounded-xl bg-card border-zinc-200 dark:border-zinc-800 text-xs"
                />
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="rounded-xl h-9 px-3.5 gap-1.5 text-xs font-semibold shrink-0 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Printer className="h-3.5 w-3.5" /> In báo cáo
          </Button>
        </div>

        {/* 2. REPORT MAIN CONTENT AREA */}
        <div id="printable-report-area" className="p-5 sm:p-7 space-y-6">
          {/* Document Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-200/80 dark:border-zinc-800">
            <div>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block">
                BÁO CÁO TỔNG HỢP TÀI CHÍNH
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-0.5">
                {selectedBizObj ? selectedBizObj.name : "Toàn bộ mảng việc"}
              </h2>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                <span>Kỳ báo cáo: <strong className="text-foreground">{label}</strong></span>
                <span>•</span>
                <span>Ghi nhận: <strong className="text-foreground">{stats.txCount} giao dịch</strong></span>
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                LAP68 Analytics
              </span>
            </div>
          </div>

          {/* 4 BENTO SUMMARY CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. TỔNG THU */}
            <div className="p-4 sm:p-5 rounded-2xl border border-emerald-200/70 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Tổng thực thu</span>
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-4 w-4" />
                </span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400 tracking-tight">
                {displayMoney(stats.income)}
              </p>
              <p className="text-[11px] text-emerald-800/70 dark:text-emerald-400/70">
                {stats.incomeCount} lượt thu tiền
              </p>
            </div>

            {/* 2. TỔNG CHI */}
            <div className="p-4 sm:p-5 rounded-2xl border border-rose-200/70 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">Tổng thực chi</span>
                <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <TrendingDown className="h-4 w-4" />
                </span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-rose-700 dark:text-rose-400 tracking-tight">
                {displayMoney(stats.expense)}
              </p>
              <p className="text-[11px] text-rose-800/70 dark:text-rose-400/70">
                {stats.expenseCount} lượt chi tiền
              </p>
            </div>

            {/* 3. LỢI NHUẬN RÒNG */}
            <div className="p-4 sm:p-5 rounded-2xl border border-blue-200/70 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">Lợi nhuận ròng</span>
                <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Wallet className="h-4 w-4" />
                </span>
              </div>
              <p className={cn(
                "text-lg sm:text-2xl font-bold tracking-tight",
                stats.profit >= 0 ? "text-blue-700 dark:text-blue-400" : "text-rose-600 dark:text-rose-400"
              )}>
                {displayMoney(stats.profit)}
              </p>
              <p className="text-[11px] text-blue-800/70 dark:text-blue-400/70">
                Biên LN: <strong className="font-semibold">{stats.margin.toFixed(1)}%</strong>
              </p>
            </div>

            {/* 4. TỶ LỆ CHI / THU */}
            <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Tỷ lệ Chi phí</span>
                <span className="p-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-muted-foreground">
                  <BarChart3 className="h-4 w-4" />
                </span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-foreground tracking-tight">
                {stats.expenseRatio.toFixed(1)}%
              </p>
              <p className="text-[11px] text-muted-foreground">
                trên tổng doanh thu
              </p>
            </div>
          </div>

          {/* 3. SECTION TABS: MẢNG VIỆC / DANH MỤC / ĐỐI TÁC */}
          <div className="space-y-4 pt-2">
            <div className="apple-segmented grid grid-cols-3 max-w-md">
              <button
                type="button"
                onClick={() => setActiveTab("businesses")}
                className={cn("apple-segmented-item justify-center flex items-center gap-1.5", activeTab === "businesses" && "active")}
              >
                <Layers className="h-3.5 w-3.5" /> Mảng việc
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("categories")}
                className={cn("apple-segmented-item justify-center flex items-center gap-1.5", activeTab === "categories" && "active")}
              >
                <PieChart className="h-3.5 w-3.5" /> Danh mục
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("counterparties")}
                className={cn("apple-segmented-item justify-center flex items-center gap-1.5", activeTab === "counterparties" && "active")}
              >
                <Users className="h-3.5 w-3.5" /> Đối tác
              </button>
            </div>

            {/* TAB: MẢNG VIỆC */}
            {activeTab === "businesses" && (
              <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden bg-card">
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Cơ cấu theo từng mảng việc</h4>
                  <span className="text-[11px] text-muted-foreground">{stats.businesses.length} mảng có phát sinh</span>
                </div>
                {stats.businesses.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">Không có dữ liệu giao dịch trong kỳ này</div>
                ) : (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {stats.businesses.map((b) => {
                      const bizIncomePct = stats.income > 0 ? (b.income / stats.income) * 100 : 0;
                      return (
                        <div key={b.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <BusinessIcon name={b.name} color={b.color} size="md" />
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-bold text-foreground truncate">{b.name}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Thu: {displayMoney(b.income)}</span>
                                <span>•</span>
                                <span className="text-rose-600 dark:text-rose-400 font-medium">Chi: {displayMoney(b.expense)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 sm:gap-0.5 shrink-0 pl-11 sm:pl-0">
                            <span className={cn(
                              "text-xs sm:text-sm font-bold",
                              b.profit >= 0 ? "text-blue-600 dark:text-blue-400" : "text-rose-600 dark:text-rose-400"
                            )}>
                              {b.profit >= 0 ? "+" : ""}{displayMoney(b.profit)}
                            </span>
                            <div className="w-24 sm:w-32 bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(bizIncomePct, 100)}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: DANH MỤC */}
            {activeTab === "categories" && (
              <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden bg-card">
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Phân bổ theo hạng mục</h4>
                  <span className="text-[11px] text-muted-foreground">{stats.categories.length} hạng mục</span>
                </div>
                {stats.categories.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">Không có danh mục nào trong kỳ này</div>
                ) : (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {stats.categories.map((c, i) => {
                      const totalBase = c.type === "income" ? stats.income : stats.expense;
                      const pct = totalBase > 0 ? (c.amount / totalBase) * 100 : 0;
                      return (
                        <div key={i} className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-colors">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={cn(
                              "w-2 h-2 rounded-full shrink-0",
                              c.type === "income" ? "bg-emerald-500" : "bg-rose-500"
                            )} />
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-semibold text-foreground truncate">{c.name}</p>
                              <span className="text-[10px] text-muted-foreground uppercase">{c.type === "income" ? "Thu nhập" : "Chi phí"}</span>
                            </div>
                          </div>

                          <div className="text-right shrink-0 space-y-1">
                            <span className={cn(
                              "text-xs sm:text-sm font-bold block",
                              c.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                            )}>
                              {displayMoney(c.amount)}
                            </span>
                            <span className="text-[11px] text-muted-foreground block">{pct.toFixed(1)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB: ĐỐI TÁC */}
            {activeTab === "counterparties" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Top Khách hàng */}
                <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden bg-card">
                  <div className="p-3.5 border-b border-zinc-100 dark:border-zinc-800 bg-emerald-50/30 dark:bg-emerald-950/10 flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <ArrowDownLeft className="h-3.5 w-3.5" /> Nguồn thu lớn nhất
                    </span>
                  </div>
                  {stats.topCustomers.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground">Chưa có giao dịch thu</div>
                  ) : (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                      {stats.topCustomers.map((cp, idx) => (
                        <div key={idx} className="p-3 flex items-center justify-between text-xs">
                          <span className="font-semibold text-foreground truncate">{cp.name}</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0">{displayMoney(cp.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top Nhà cung cấp / Chi */}
                <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden bg-card">
                  <div className="p-3.5 border-b border-zinc-100 dark:border-zinc-800 bg-rose-50/30 dark:bg-rose-950/10 flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                      <ArrowUpRight className="h-3.5 w-3.5" /> Đối tác chi nhiều nhất
                    </span>
                  </div>
                  {stats.topSuppliers.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground">Chưa có giao dịch chi</div>
                  ) : (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                      {stats.topSuppliers.map((cp, idx) => (
                        <div key={idx} className="p-3 flex items-center justify-between text-xs">
                          <span className="font-semibold text-foreground truncate">{cp.name}</span>
                          <span className="font-bold text-rose-600 dark:text-rose-400 shrink-0">{displayMoney(cp.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
