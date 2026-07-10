"use client"

import { useEffect, useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
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
  Calendar,
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
  
  const todayStr = new Date().toISOString().split("T")[0]
  const firstDayOfMonthStr = new Date(currentYear, currentMonth, 1).toISOString().split("T")[0]
  const [customStart, setCustomStart] = useState<string>(firstDayOfMonthStr)
  const [customEnd, setCustomEnd] = useState<string>(todayStr)

  useEffect(() => {
    if (open) {
      setSelectedBusinessId(defaultBusinessId)
    }
  }, [open, defaultBusinessId])

  const years = useMemo(() => {
    const list = []
    for (let y = currentYear; y >= currentYear - 3; y--) {
      list.push(y)
    }
    return list
  }, [currentYear])

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
      label = `${half === 1 ? "6 tháng đầu" : "6 tháng cuối"} năm ${year}`
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
      label = `${formatD(start)} - ${formatD(end)}`
    }

    return { start, end, label }
  }, [periodType, year, month, quarter, half, customStart, customEnd])

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (selectedBusinessId !== "all" && t.business_id !== selectedBusinessId) {
        return false
      }
      const txDate = parseDisplayDate(t.transaction_date)
      if (!txDate) return false
      return txDate >= start && txDate <= end
    })
  }, [transactions, selectedBusinessId, start, end])

  const stats = useMemo(() => {
    let income = 0
    let expense = 0
    
    const categoriesMap: Record<string, { name: string; amount: number; type: string }> = {}
    const businessesMap: Record<string, { name: string; income: number; expense: number }> = {}
    const counterpartiesMap: Record<string, { name: string; amount: number; type: string }> = {}

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

      if (t.category_id) {
        const catName = t.category?.name || "Khác"
        if (!categoriesMap[t.category_id]) {
          categoriesMap[t.category_id] = { name: catName, amount: 0, type: t.type }
        }
        categoriesMap[t.category_id].amount += amount
      }

      if (t.business_id && businessesMap[t.business_id]) {
        if (t.type === "income") {
          businessesMap[t.business_id].income += amount
        } else {
          businessesMap[t.business_id].expense += amount
        }
      }

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

    const sortedCategories = Object.values(categoriesMap).sort((a, b) => b.amount - a.amount)
    const sortedBusinesses = Object.values(businessesMap)
      .map((b) => ({
        ...b,
        profit: b.income - b.expense,
        margin: b.income > 0 ? ((b.income - b.expense) / b.income) * 100 : 0,
      }))
      .filter((b) => b.income > 0 || b.expense > 0)
      .sort((a, b) => b.income - a.income)

    const sortedCounterparties = Object.values(counterpartiesMap).sort((a, b) => b.amount - a.amount)
    const topCustomers = sortedCounterparties.filter((c) => c.type === "income").slice(0, 3)
    const topSuppliers = sortedCounterparties.filter((c) => c.type === "expense").slice(0, 3)

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
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-0 border border-zinc-800 bg-zinc-950 text-zinc-100 font-sans shadow-2xl">
        
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
              padding: 10px !important;
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

        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 z-50" />
        
        {/* Horizontal Header Controls Bar (no-print) */}
        <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/30 flex flex-wrap items-center justify-between gap-3 no-print sticky top-0 z-40 backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-2">
            {/* Business Select */}
            <Select value={selectedBusinessId} onValueChange={setSelectedBusinessId}>
              <SelectTrigger className="w-40 h-8 bg-zinc-900 border-zinc-800 text-xs">
                <SelectValue placeholder="Chọn dự án" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                <SelectItem value="all">Tất cả dự án</SelectItem>
                {businesses.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Period Type */}
            <Select value={periodType} onValueChange={(val) => setPeriodType(val as PeriodType)}>
              <SelectTrigger className="w-32 h-8 bg-zinc-900 border-zinc-800 text-xs">
                <SelectValue placeholder="Kỳ báo cáo" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                <SelectItem value="month">Từng Tháng</SelectItem>
                <SelectItem value="quarter">Từng Quý</SelectItem>
                <SelectItem value="six_months">6 Tháng</SelectItem>
                <SelectItem value="year">Theo Năm</SelectItem>
                <SelectItem value="custom">Tuỳ chọn</SelectItem>
              </SelectContent>
            </Select>

            {/* Year Select (If not custom) */}
            {periodType !== "custom" && (
              <Select value={String(year)} onValueChange={(val) => setYear(Number(val))}>
                <SelectTrigger className="w-24 h-8 bg-zinc-900 border-zinc-800 text-xs">
                  <SelectValue placeholder="Năm" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>Năm {y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Month Select */}
            {periodType === "month" && (
              <Select value={String(month)} onValueChange={(val) => setMonth(Number(val))}>
                <SelectTrigger className="w-24 h-8 bg-zinc-900 border-zinc-800 text-xs">
                  <SelectValue placeholder="Tháng" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i} value={String(i)}>Tháng {i + 1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Quarter Select */}
            {periodType === "quarter" && (
              <Select value={String(quarter)} onValueChange={(val) => setQuarter(Number(val))}>
                <SelectTrigger className="w-24 h-8 bg-zinc-900 border-zinc-800 text-xs">
                  <SelectValue placeholder="Quý" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                  <SelectItem value="1">Quý I</SelectItem>
                  <SelectItem value="2">Quý II</SelectItem>
                  <SelectItem value="3">Quý III</SelectItem>
                  <SelectItem value="4">Quý IV</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* 6 Months Select */}
            {periodType === "six_months" && (
              <Select value={String(half)} onValueChange={(val) => setHalf(Number(val))}>
                <SelectTrigger className="w-32 h-8 bg-zinc-900 border-zinc-800 text-xs">
                  <SelectValue placeholder="Kỳ" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                  <SelectItem value="1">6 tháng đầu</SelectItem>
                  <SelectItem value="2">6 tháng cuối</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Custom Dates Select */}
            {periodType === "custom" && (
              <div className="flex items-center gap-1">
                <Input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-28 h-8 bg-zinc-900 border-zinc-800 text-xs p-1 px-2"
                />
                <span className="text-zinc-500 text-xs">-</span>
                <Input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-28 h-8 bg-zinc-900 border-zinc-800 text-xs p-1 px-2"
                />
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="h-8 bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-200 gap-1.5 text-xs cursor-pointer px-3"
          >
            <Printer className="h-3.5 w-3.5" /> In
          </Button>
        </div>

        {/* Report Content Panel */}
        <div id="printable-report-area" className="p-6 space-y-6">
          
          {/* Header */}
          <div className="border-b border-zinc-850 pb-4 flex justify-between items-end print-border print-text-dark">
            <div>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest no-print">
                LAP68 FINANCIAL SYSTEM
              </span>
              <h2 className="text-lg font-black text-zinc-100 tracking-tight mt-0.5 print-text-dark uppercase">
                Báo cáo tổng kết tài chính
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5 print-text-dark">
                Dự án: <span className="font-semibold text-zinc-200 print-text-dark">
                  {selectedBusinessId === "all" ? "Tất cả các dự án" : businesses.find(b => b.id === selectedBusinessId)?.name || "Chưa xác định"}
                </span>
                <span className="mx-2 text-zinc-600">•</span>
                Kỳ báo cáo: <span className="font-semibold text-emerald-400 print-text-dark">{label}</span>
              </p>
            </div>
            <div className="text-right text-[11px] text-zinc-500 print-text-dark font-mono">
              <p>Giao dịch: {stats.txCount}</p>
              <p>Lập ngày: {new Date().toLocaleDateString("vi-VN")}</p>
            </div>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total Income */}
            <div className="bg-zinc-900/30 border border-zinc-850 rounded-xl p-3 print-border print-text-dark print-bg-light">
              <div className="flex justify-between items-center text-zinc-400">
                <span className="text-xs">Tổng Thu</span>
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <p className="text-base font-bold mt-1 text-emerald-400 print-text-dark font-mono">
                {displayMoney(stats.income)}
              </p>
            </div>

            {/* Total Expense */}
            <div className="bg-zinc-900/30 border border-zinc-850 rounded-xl p-3 print-border print-text-dark print-bg-light">
              <div className="flex justify-between items-center text-zinc-400">
                <span className="text-xs">Tổng Chi</span>
                <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
              </div>
              <p className="text-base font-bold mt-1 text-rose-400 print-text-dark font-mono">
                {displayMoney(stats.expense)}
              </p>
            </div>

            {/* Net Profit */}
            <div className="bg-zinc-900/30 border border-zinc-850 rounded-xl p-3 print-border print-text-dark print-bg-light">
              <div className="flex justify-between items-center text-zinc-400">
                <span className="text-xs">Lợi Nhuận</span>
                <PiggyBank className="h-3.5 w-3.5 text-sky-500" />
              </div>
              <p className={`text-base font-bold mt-1 print-text-dark font-mono ${stats.profit >= 0 ? "text-sky-400" : "text-rose-400"}`}>
                {displayMoney(stats.profit)}
              </p>
            </div>

            {/* Margin */}
            <div className="bg-zinc-900/30 border border-zinc-850 rounded-xl p-3 print-border print-text-dark print-bg-light">
              <div className="flex justify-between items-center text-zinc-400">
                <span className="text-xs">Tỷ Suất LN</span>
                <BarChart3 className="h-3.5 w-3.5 text-amber-500" />
              </div>
              <p className="text-base font-bold mt-1 text-amber-400 print-text-dark font-mono">
                {stats.margin.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Business Comparison (Only when "all" selected) */}
          {selectedBusinessId === "all" && stats.businesses.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 print-text-dark">
                <Layers className="h-3.5 w-3.5 text-teal-400" /> Doanh thu & Lợi nhuận theo dự án
              </h3>
              <div className="rounded-xl border border-zinc-850 overflow-hidden print-border bg-zinc-900/10">
                <table className="min-w-full divide-y divide-zinc-850 text-xs">
                  <thead className="bg-zinc-900/40 print-bg-light">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-zinc-400 print-text-dark">Dự án</th>
                      <th className="px-4 py-2 text-right font-semibold text-zinc-400 print-text-dark">Doanh thu</th>
                      <th className="px-4 py-2 text-right font-semibold text-zinc-400 print-text-dark">Chi phí</th>
                      <th className="px-4 py-2 text-right font-semibold text-zinc-400 print-text-dark">Lợi nhuận</th>
                      <th className="px-4 py-2 text-right font-semibold text-zinc-400 print-text-dark">Tỷ suất</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850/60 font-mono">
                    {stats.businesses.map((b) => (
                      <tr key={b.name} className="hover:bg-zinc-900/10">
                        <td className="px-4 py-2 font-sans font-medium text-zinc-200 print-text-dark">{b.name}</td>
                        <td className="px-4 py-2 text-right text-emerald-400 print-text-dark">{displayMoney(b.income)}</td>
                        <td className="px-4 py-2 text-right text-zinc-400 print-text-dark">{displayMoney(b.expense)}</td>
                        <td className={`px-4 py-2 text-right font-bold print-text-dark ${b.profit >= 0 ? "text-sky-400" : "text-rose-400"}`}>
                          {displayMoney(b.profit)}
                        </td>
                        <td className="px-4 py-2 text-right text-amber-400 print-text-dark">{b.margin.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Income & Expense Categories (Side-by-side) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Income breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 print-text-dark">
                <TrendingUp className="h-3.5 w-3.5" /> Cơ cấu khoản thu
              </h4>
              <div className="bg-zinc-900/10 rounded-xl border border-zinc-850 p-3 space-y-2.5 print-border">
                {stats.categories.filter((c) => c.type === "income").map((c) => {
                  const pct = stats.income > 0 ? (c.amount / stats.income) * 100 : 0
                  return (
                    <div key={c.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-sans">
                        <span className="text-zinc-300 print-text-dark font-medium">{c.name}</span>
                        <span className="text-emerald-400 print-text-dark font-semibold font-mono">
                          {displayMoney(c.amount)} <span className="text-[10px] text-zinc-500 font-normal">({pct.toFixed(0)}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-zinc-900 rounded-full h-1 no-print">
                        <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
                {stats.categories.filter((c) => c.type === "income").length === 0 && (
                  <p className="text-zinc-500 text-xs text-center py-4">Chưa phát sinh khoản thu</p>
                )}
              </div>
            </div>

            {/* Expense breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5 print-text-dark">
                <TrendingDown className="h-3.5 w-3.5" /> Cơ cấu khoản chi
              </h4>
              <div className="bg-zinc-900/10 rounded-xl border border-zinc-850 p-3 space-y-2.5 print-border">
                {stats.categories.filter((c) => c.type === "expense").map((c) => {
                  const pct = stats.expense > 0 ? (c.amount / stats.expense) * 100 : 0
                  return (
                    <div key={c.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-sans">
                        <span className="text-zinc-300 print-text-dark font-medium">{c.name}</span>
                        <span className="text-rose-400 print-text-dark font-semibold font-mono">
                          {displayMoney(c.amount)} <span className="text-[10px] text-zinc-500 font-normal">({pct.toFixed(0)}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-zinc-900 rounded-full h-1 no-print">
                        <div className="bg-rose-500 h-1 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
                {stats.categories.filter((c) => c.type === "expense").length === 0 && (
                  <p className="text-zinc-500 text-xs text-center py-4">Chưa phát sinh khoản chi</p>
                )}
              </div>
            </div>

          </div>

          {/* Top Counterparties Section */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 print-text-dark">
              <Users className="h-3.5 w-3.5 text-emerald-400" /> Tóm tắt đối tác giao dịch chính
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Customers */}
              <div className="bg-zinc-900/10 rounded-xl border border-zinc-850 p-3 print-border">
                <p className="text-[11px] font-semibold text-zinc-400 mb-2 print-text-dark">Top khách hàng (Thu nhiều nhất)</p>
                <div className="space-y-1.5 text-xs">
                  {stats.topCustomers.map((c, i) => (
                    <div key={i} className="flex justify-between items-center py-0.5 border-b border-zinc-900/30">
                      <span className="text-zinc-300 print-text-dark font-medium">{c.name}</span>
                      <span className="text-emerald-400 print-text-dark font-mono font-semibold">{displayMoney(c.amount)}</span>
                    </div>
                  ))}
                  {stats.topCustomers.length === 0 && (
                    <p className="text-zinc-500 text-[11px] py-1">Không phát sinh đối tác thu</p>
                  )}
                </div>
              </div>

              {/* Suppliers */}
              <div className="bg-zinc-900/10 rounded-xl border border-zinc-850 p-3 print-border">
                <p className="text-[11px] font-semibold text-zinc-400 mb-2 print-text-dark">Top nhà cung cấp (Chi nhiều nhất)</p>
                <div className="space-y-1.5 text-xs">
                  {stats.topSuppliers.map((c, i) => (
                    <div key={i} className="flex justify-between items-center py-0.5 border-b border-zinc-900/30">
                      <span className="text-zinc-300 print-text-dark font-medium">{c.name}</span>
                      <span className="text-rose-400 print-text-dark font-mono font-semibold">{displayMoney(c.amount)}</span>
                    </div>
                  ))}
                  {stats.topSuppliers.length === 0 && (
                    <p className="text-zinc-500 text-[11px] py-1">Không phát sinh đối tác chi</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Signature Block for Print */}
          <div className="hidden print:block pt-12 mt-6 border-t border-zinc-200 text-zinc-850">
            <div className="grid grid-cols-2 text-center text-xs">
              <div>
                <p className="font-bold">Người lập báo cáo</p>
                <p className="text-[10px] text-zinc-400 mt-10">(Ký và ghi rõ họ tên)</p>
              </div>
              <div>
                <p className="font-bold">Phê duyệt cấp trên</p>
                <p className="text-[10px] text-zinc-400 mt-10">(Ký và đóng dấu)</p>
              </div>
            </div>
          </div>

        </div>

      </DialogContent>
    </Dialog>
  )
}
