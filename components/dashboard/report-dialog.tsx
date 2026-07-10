"use client"

import { useEffect, useState, useMemo } from "react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { parseDisplayDate } from "@/lib/format-date"
import { displayMoney } from "@/lib/format-money"
import type { Business, Transaction } from "@/lib/types"
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  BarChart3,
  Layers,
  Users,
  Printer,
} from "lucide-react"

type PeriodType = "month" | "quarter" | "six_months" | "year" | "custom"

interface ReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  businesses: Business[]
  transactions: Transaction[]
  defaultBusinessId?: string
}

export function ReportDialog({
  open,
  onOpenChange,
  businesses,
  transactions,
  defaultBusinessId = "all",
}: ReportDialogProps) {
  const [periodType, setPeriodType] = useState<PeriodType>("month")
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>(defaultBusinessId)
  
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() // 0-11
  
  const [year, setYear] = useState<number>(currentYear)
  const [month, setMonth] = useState<number>(currentMonth)
  const [quarter, setQuarter] = useState<number>(Math.floor(currentMonth / 3) + 1) // 1-4
  const [half, setHalf] = useState<number>(currentMonth < 6 ? 1 : 2) // 1-2
  
  // Custom range default: start of this month to today
  const todayStr = new Date().toISOString().split("T")[0]
  const firstDayOfMonthStr = new Date(currentYear, currentMonth, 1).toISOString().split("T")[0]
  const [customStart, setCustomStart] = useState<string>(firstDayOfMonthStr)
  const [customEnd, setCustomEnd] = useState<string>(todayStr)

  useEffect(() => {
    if (open) {
      setSelectedBusinessId(defaultBusinessId)
    }
  }, [open, defaultBusinessId])

  // Years for selection: current year and 3 years back
  const years = useMemo(() => {
    const list = []
    for (let y = currentYear; y >= currentYear - 3; y--) {
      list.push(y)
    }
    return list
  }, [currentYear])

  // Get start & end date based on period selection
  const { start, end, label } = useMemo(() => {
    let start: Date
    let end: Date
    let label = ""

    if (periodType === "month") {
      start = new Date(year, month, 1)
      end = new Date(year, month + 1, 0, 23, 59, 59, 999)
      label = `Tháng ${month + 1}/${year}`
    } else if (periodType === "quarter") {
      start = new Date(year, (quarter - 1) * 3, 1)
      end = new Date(year, quarter * 3, 0, 23, 59, 59, 999)
      label = `Quý ${quarter}/${year}`
    } else if (periodType === "six_months") {
      start = new Date(year, (half - 1) * 6, 1)
      end = new Date(year, half * 6, 0, 23, 59, 59, 999)
      label = `${half === 1 ? "6 tháng đầu năm" : "6 tháng cuối năm"} ${year}`
    } else if (periodType === "year") {
      start = new Date(year, 0, 1)
      end = new Date(year, 12, 0, 23, 59, 59, 999)
      label = `Năm ${year}`
    } else {
      start = customStart ? new Date(customStart) : new Date(0)
      const parsedEnd = customEnd ? new Date(customEnd) : new Date()
      end = new Date(parsedEnd.getFullYear(), parsedEnd.getMonth(), parsedEnd.getDate(), 23, 59, 59, 999)
      
      const formatD = (d: Date) => {
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
      }
      label = `Từ ${formatD(start)} đến ${formatD(end)}`
    }

    return { start, end, label }
  }, [periodType, year, month, quarter, half, customStart, customEnd])

  // Filter transactions within period & business
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // 1. Business filter
      if (selectedBusinessId !== "all" && t.business_id !== selectedBusinessId) {
        return false
      }
      
      // 2. Date filter
      const txDate = parseDisplayDate(t.transaction_date)
      if (!txDate) return false
      
      return txDate >= start && txDate <= end
    })
  }, [transactions, selectedBusinessId, start, end])

  // Report statistics calculations
  const stats = useMemo(() => {
    let income = 0
    let expense = 0
    
    // Category mapping: id -> { name, amount, type }
    const categoriesMap: Record<string, { name: string; amount: number; type: string }> = {}
    // Business mapping: id -> { name, income, expense }
    const businessesMap: Record<string, { name: string; income: number; expense: number }> = {}
    // Counterparty mapping: id -> { name, amount, type }
    const counterpartiesMap: Record<string, { name: string; amount: number; type: string }> = {}

    // Initialize businesses list
    businesses.forEach((b) => {
      businessesMap[b.id] = { name: b.name, income: 0, expense: 0 }
    })

    filteredTransactions.forEach((t) => {
      const amount = t.amount
      
      if (t.type === "income") {
        income += amount
      } else {
        expense += amount
      }

      // Categories breakdown
      if (t.category_id) {
        const catName = t.category?.name || "Khác"
        if (!categoriesMap[t.category_id]) {
          categoriesMap[t.category_id] = { name: catName, amount: 0, type: t.type }
        }
        categoriesMap[t.category_id].amount += amount
      }

      // Businesses breakdown
      if (t.business_id && businessesMap[t.business_id]) {
        if (t.type === "income") {
          businessesMap[t.business_id].income += amount
        } else {
          businessesMap[t.business_id].expense += amount
        }
      }

      // Counterparties breakdown
      if (t.counterparty_id) {
        const cpName = t.counterparty?.name || "Khách lẻ"
        if (!counterpartiesMap[t.counterparty_id]) {
          counterpartiesMap[t.counterparty_id] = { name: cpName, amount: 0, type: t.type }
        }
        counterpartiesMap[t.counterparty_id].amount += amount
      }
    })

    const profit = income - expense
    const margin = income > 0 ? (profit / income) * 100 : 0

    // Sort breakdowns
    const sortedCategories = Object.values(categoriesMap).sort((a, b) => b.amount - a.amount)
    const sortedBusinesses = Object.values(businessesMap)
      .map((b) => ({
        ...b,
        profit: b.income - b.expense,
        margin: b.income > 0 ? ((b.income - b.expense) / b.income) * 100 : 0,
      }))
      .sort((a, b) => b.income - a.income)

    const sortedCounterparties = Object.values(counterpartiesMap).sort((a, b) => b.amount - a.amount)
    const topCustomers = sortedCounterparties.filter((c) => c.type === "income").slice(0, 5)
    const topSuppliers = sortedCounterparties.filter((c) => c.type === "expense").slice(0, 5)

    return {
      income,
      expense,
      profit,
      margin,
      categories: sortedCategories,
      businesses: sortedBusinesses,
      topCustomers,
      topSuppliers,
      txCount: filteredTransactions.length,
    }
  }, [filteredTransactions, businesses])

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border border-zinc-800 bg-zinc-950 text-zinc-100">
        
        {/* Style block to ensure only the report container prints */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body {
              background: white !important;
              color: black !important;
            }
            body * {
              visibility: hidden;
            }
            #printable-report-area, #printable-report-area * {
              visibility: visible;
            }
            #printable-report-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white !important;
              color: black !important;
              padding: 0px !important;
            }
            .no-print {
              display: none !important;
            }
            .print-border {
              border: 1px solid #ddd !important;
            }
            .print-text-dark {
              color: #000 !important;
            }
            .print-bg-light {
              background-color: #f9f9f9 !important;
            }
          }
        `}} />

        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600" />
        
        {/* Left-Right layout: Filter Sidebar (no-print) & Report Content */}
        <div className="flex flex-col md:flex-row h-full">
          
          {/* Sidebar Filters */}
          <div className="w-full md:w-80 border-r border-zinc-800 p-6 space-y-5 no-print shrink-0 bg-zinc-900/50">
            <div>
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Tham số báo cáo</h3>
              <div className="space-y-4">
                
                {/* Business Filter */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Dự án kinh doanh</Label>
                  <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
                    <SelectTrigger className="w-full bg-zinc-900 border-zinc-800">
                      <SelectValue placeholder="Chọn dự án" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                      <SelectItem value="all">Tất cả dự án</SelectItem>
                      {businesses.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Period Type Filter */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Loại mốc thời gian</Label>
                  <Select value={periodType} onValueChange={(val) => setPeriodType(val as PeriodType)}>
                    <SelectTrigger className="w-full bg-zinc-900 border-zinc-800">
                      <SelectValue placeholder="Chọn thời gian" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                      <SelectItem value="month">Theo Tháng</SelectItem>
                      <SelectItem value="quarter">Theo Quý</SelectItem>
                      <SelectItem value="six_months">Theo 6 Tháng</SelectItem>
                      <SelectItem value="year">Theo Năm</SelectItem>
                      <SelectItem value="custom">Khoảng tự chọn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Year Select (if not custom) */}
                {periodType !== "custom" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-400">Năm báo cáo</Label>
                    <Select value={String(year)} onValueChange={(val) => setYear(Number(val))}>
                      <SelectTrigger className="w-full bg-zinc-900 border-zinc-800">
                        <SelectValue placeholder="Chọn năm" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                        {years.map((y) => (
                          <SelectItem key={y} value={String(y)}>
                            Năm {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Month Select */}
                {periodType === "month" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-400">Chọn tháng</Label>
                    <Select value={String(month)} onValueChange={(val) => setMonth(Number(val))}>
                      <SelectTrigger className="w-full bg-zinc-900 border-zinc-800">
                        <SelectValue placeholder="Chọn tháng" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i} value={String(i)}>
                            Tháng {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Quarter Select */}
                {periodType === "quarter" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-400">Chọn quý</Label>
                    <Select value={String(quarter)} onValueChange={(val) => setQuarter(Number(val))}>
                      <SelectTrigger className="w-full bg-zinc-900 border-zinc-800">
                        <SelectValue placeholder="Chọn quý" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                        <SelectItem value="1">Quý I (Tháng 1-3)</SelectItem>
                        <SelectItem value="2">Quý II (Tháng 4-6)</SelectItem>
                        <SelectItem value="3">Quý III (Tháng 7-9)</SelectItem>
                        <SelectItem value="4">Quý IV (Tháng 10-12)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* 6 Months Select */}
                {periodType === "six_months" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-400">Chọn kỳ 6 tháng</Label>
                    <Select value={String(half)} onValueChange={(val) => setHalf(Number(val))}>
                      <SelectTrigger className="w-full bg-zinc-900 border-zinc-800">
                        <SelectValue placeholder="Chọn kỳ" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                        <SelectItem value="1">6 tháng đầu năm (Tháng 1-6)</SelectItem>
                        <SelectItem value="2">6 tháng cuối năm (Tháng 7-12)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Custom Dates Select */}
                {periodType === "custom" && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-zinc-400">Từ ngày</Label>
                      <Input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="bg-zinc-900 border-zinc-800 text-zinc-100 font-sans"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-zinc-400">Đến ngày</Label>
                      <Input
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="bg-zinc-900 border-zinc-800 text-zinc-100 font-sans"
                      />
                    </div>
                  </div>
                )}

              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800 flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="w-full bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-200 gap-2 cursor-pointer"
              >
                <Printer className="h-4 w-4" /> In báo cáo
              </Button>
            </div>
          </div>

          {/* Main Report Area */}
          <div id="printable-report-area" className="flex-1 p-6 sm:p-8 space-y-6 overflow-y-auto">
            
            {/* Report Header */}
            <div className="border-b border-zinc-800 pb-5 flex justify-between items-start print-border print-text-dark">
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest no-print">
                  Hệ thống quản lý tài chính LAP68
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-tight mt-1 print-text-dark">
                  BÁO CÁO TỔNG QUAN TÀI CHÍNH
                </h2>
                <p className="text-sm text-zinc-400 mt-1 print-text-dark font-sans">
                  Dự án: <span className="font-semibold text-zinc-200 print-text-dark">
                    {selectedBusinessId === "all" ? "Tất cả các dự án kinh doanh" : businesses.find(b => b.id === selectedBusinessId)?.name || "Chưa xác định"}
                  </span>
                </p>
                <p className="text-xs text-zinc-500 mt-0.5 print-text-dark font-sans">
                  Kỳ báo cáo: <span className="font-semibold text-zinc-300 print-text-dark">{label}</span>
                </p>
              </div>
              <div className="text-right text-xs text-zinc-500 no-print font-sans">
                <p>Tổng số giao dịch: {stats.txCount}</p>
                <p className="mt-1">Ngày lập: {new Date().toLocaleDateString("vi-VN")}</p>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 print-border">
              {/* Total Income */}
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 print-border print-text-dark print-bg-light">
                <div className="flex justify-between items-center text-zinc-400 font-sans">
                  <span className="text-xs font-medium">Tổng Thu</span>
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="text-lg sm:text-xl font-bold mt-2 text-emerald-400 print-text-dark font-mono">
                  {displayMoney(stats.income)}
                </p>
              </div>

              {/* Total Expense */}
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 print-border print-text-dark print-bg-light">
                <div className="flex justify-between items-center text-zinc-400 font-sans">
                  <span className="text-xs font-medium">Tổng Chi</span>
                  <TrendingDown className="h-4 w-4 text-rose-500" />
                </div>
                <p className="text-lg sm:text-xl font-bold mt-2 text-rose-400 print-text-dark font-mono">
                  {displayMoney(stats.expense)}
                </p>
              </div>

              {/* Net Profit */}
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 print-border print-text-dark print-bg-light">
                <div className="flex justify-between items-center text-zinc-400 font-sans">
                  <span className="text-xs font-medium">Lợi Nhuận</span>
                  <PiggyBank className="h-4 w-4 text-sky-500" />
                </div>
                <p className={`text-lg sm:text-xl font-bold mt-2 print-text-dark font-mono ${stats.profit >= 0 ? "text-sky-400" : "text-rose-400"}`}>
                  {displayMoney(stats.profit)}
                </p>
              </div>

              {/* Profit Margin */}
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 print-border print-text-dark print-bg-light">
                <div className="flex justify-between items-center text-zinc-400 font-sans">
                  <span className="text-xs font-medium">Tỷ Suất LN</span>
                  <BarChart3 className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-lg sm:text-xl font-bold mt-2 text-amber-400 print-text-dark font-mono">
                  {stats.margin.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Business Breakdown (Only visible if selecting "all") */}
            {selectedBusinessId === "all" && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 print-text-dark">
                  <Layers className="h-4 w-4 text-teal-400" /> Phân tích theo dự án kinh doanh
                </h3>
                <div className="overflow-x-auto rounded-xl border border-zinc-800/60 print-border">
                  <table className="min-w-full divide-y divide-zinc-800">
                    <thead className="bg-zinc-900/50 print-bg-light">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider print-text-dark">Tên dự án</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider print-text-dark">Doanh thu</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider print-text-dark">Chi phí</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider print-text-dark">Lợi nhuận</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider print-text-dark">Tỷ suất</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/20 font-sans">
                      {stats.businesses.map((b) => (
                        <tr key={b.name} className="hover:bg-zinc-900/10">
                          <td className="px-4 py-2.5 text-sm font-medium text-zinc-200 print-text-dark">{b.name}</td>
                          <td className="px-4 py-2.5 text-sm text-right text-emerald-400 font-mono print-text-dark">{displayMoney(b.income)}</td>
                          <td className="px-4 py-2.5 text-sm text-right text-rose-400 font-mono print-text-dark">{displayMoney(b.expense)}</td>
                          <td className={`px-4 py-2.5 text-sm text-right font-mono font-bold print-text-dark ${b.profit >= 0 ? "text-sky-400" : "text-rose-400"}`}>
                            {displayMoney(b.profit)}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-right text-amber-400 font-mono print-text-dark">{b.margin.toFixed(1)}%</td>
                        </tr>
                      ))}
                      {stats.businesses.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-sm text-zinc-500">Chưa có giao dịch nào phát sinh trong kỳ</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Income & Expense Breakdown by Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Income Categories */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 print-text-dark">
                  <TrendingUp className="h-3.5 w-3.5" /> Phân rã khoản thu
                </h4>
                <div className="rounded-xl border border-zinc-800/60 overflow-hidden print-border">
                  <table className="min-w-full divide-y divide-zinc-800">
                    <thead className="bg-zinc-900/30 print-bg-light">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider print-text-dark">Danh mục</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider print-text-dark">Số tiền</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider print-text-dark">Tỷ trọng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-sans">
                      {stats.categories
                        .filter((c) => c.type === "income")
                        .map((c) => {
                          const percentage = stats.income > 0 ? (c.amount / stats.income) * 100 : 0
                          return (
                            <tr key={c.name} className="hover:bg-zinc-900/5">
                              <td className="px-3 py-2 text-xs font-medium text-zinc-300 print-text-dark">{c.name}</td>
                              <td className="px-3 py-2 text-xs text-right font-mono text-emerald-400 print-text-dark">{displayMoney(c.amount)}</td>
                              <td className="px-3 py-2 text-xs text-right font-mono text-zinc-400 print-text-dark">{percentage.toFixed(1)}%</td>
                            </tr>
                          )
                        })}
                      {stats.categories.filter((c) => c.type === "income").length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-3 py-6 text-center text-xs text-zinc-500">Không có dữ liệu khoản thu</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Expense Categories */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5 print-text-dark">
                  <TrendingDown className="h-3.5 w-3.5" /> Phân rã khoản chi
                </h4>
                <div className="rounded-xl border border-zinc-800/60 overflow-hidden print-border">
                  <table className="min-w-full divide-y divide-zinc-800">
                    <thead className="bg-zinc-900/30 print-bg-light">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider print-text-dark">Danh mục</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider print-text-dark">Số tiền</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider print-text-dark">Tỷ trọng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-sans">
                      {stats.categories
                        .filter((c) => c.type === "expense")
                        .map((c) => {
                          const percentage = stats.expense > 0 ? (c.amount / stats.expense) * 100 : 0
                          return (
                            <tr key={c.name} className="hover:bg-zinc-900/5">
                              <td className="px-3 py-2 text-xs font-medium text-zinc-300 print-text-dark">{c.name}</td>
                              <td className="px-3 py-2 text-xs text-right font-mono text-rose-400 print-text-dark">{displayMoney(c.amount)}</td>
                              <td className="px-3 py-2 text-xs text-right font-mono text-zinc-400 print-text-dark">{percentage.toFixed(1)}%</td>
                            </tr>
                          )
                        })}
                      {stats.categories.filter((c) => c.type === "expense").length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-3 py-6 text-center text-xs text-zinc-500">Không có dữ liệu khoản chi</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Counterparty Analysis */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2 print-text-dark">
                <Users className="h-4 w-4 text-emerald-400" /> Phân tích theo đối tác
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
                
                {/* Top Customers */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-zinc-400 print-text-dark">Khách hàng đem lại dòng tiền thu lớn nhất</h4>
                  <div className="rounded-xl border border-zinc-800/60 overflow-hidden print-border">
                    <table className="min-w-full divide-y divide-zinc-800">
                      <tbody className="divide-y divide-zinc-800/60">
                        {stats.topCustomers.map((c, i) => (
                          <tr key={i} className="hover:bg-zinc-900/5">
                            <td className="px-3 py-2 text-xs text-zinc-300 print-text-dark">{c.name}</td>
                            <td className="px-3 py-2 text-xs text-right font-mono text-emerald-400 print-text-dark">{displayMoney(c.amount)}</td>
                          </tr>
                        ))}
                        {stats.topCustomers.length === 0 && (
                          <tr>
                            <td className="px-3 py-4 text-center text-xs text-zinc-500">Không có đối tác thu nào trong kỳ</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top Suppliers */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-zinc-400 print-text-dark font-sans">Nhà cung cấp / Đối tác chi lớn nhất</h4>
                  <div className="rounded-xl border border-zinc-800/60 overflow-hidden print-border">
                    <table className="min-w-full divide-y divide-zinc-800">
                      <tbody className="divide-y divide-zinc-800/60">
                        {stats.topSuppliers.map((c, i) => (
                          <tr key={i} className="hover:bg-zinc-900/5">
                            <td className="px-3 py-2 text-xs text-zinc-300 print-text-dark">{c.name}</td>
                            <td className="px-3 py-2 text-xs text-right font-mono text-rose-400 print-text-dark">{displayMoney(c.amount)}</td>
                          </tr>
                        ))}
                        {stats.topSuppliers.length === 0 && (
                          <tr>
                            <td className="px-3 py-4 text-center text-xs text-zinc-500">Không có đối tác chi nào trong kỳ</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>

            {/* Note & Signature Block (Visible in print) */}
            <div className="hidden print:block pt-16 mt-8 border-t border-zinc-200 text-zinc-800">
              <div className="grid grid-cols-2 text-center text-sm">
                <div>
                  <p className="font-bold">Người lập báo cáo</p>
                  <p className="text-xs text-zinc-500 mt-12">(Ký và ghi rõ họ tên)</p>
                </div>
                <div>
                  <p className="font-bold">Phê duyệt cấp trên</p>
                  <p className="text-xs text-zinc-500 mt-12">(Ký và đóng dấu)</p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </DialogContent>
    </Dialog>
  )
}
