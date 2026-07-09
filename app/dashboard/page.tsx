"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import {
  ModulePageShell,
  ModuleBrandHeader,
  ModuleSectionCard,
  ModuleKpiCard,
  ModuleResponsiveTable,
  AccentButton,
} from "@/components/dashboard/module-shell"
import { MonthlyCashflowChart, CategoryPieChart, ProfitTrendChart } from "@/components/dashboard/cashflow-charts"
import { TransactionTypeBadge, PaymentMethodLabel } from "@/components/dashboard/cashflow-ui"
import { SkeletonMetricCards, SkeletonTable } from "@/components/ui/skeleton-loader"
import {
  fetchTransactions,
  fetchCategories,
  insertTransaction,
  type Transaction,
  type Category,
} from "@/lib/supabase"
import { displayMoney, formatMoneyInput, parseMoneyInput } from "@/lib/format-money"
import { formatDisplayDate, todayStoredDate, toDateInputValue, toStoredDateValue } from "@/lib/format-date"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const { user, logAction } = useAuth()
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    type: "income" as "income" | "expense",
    amount: "",
    categoryId: "",
    description: "",
    transactionDate: todayStoredDate(),
    paymentMethod: "cash",
  })

  const loadData = useCallback(async () => {
    if (!user) return
    try {
      const [txs, cats] = await Promise.all([
        fetchTransactions(user.id),
        fetchCategories(user.id),
      ])
      setTransactions(txs)
      setCategories(cats)
    } catch {
      toast.error("Không tải được dữ liệu")
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadData()
  }, [loadData])

  const stats = useMemo(() => {
    const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
    const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)
    const now = new Date()
    const thisMonth = transactions.filter((t) => {
      const d = formatDisplayDate(t.transaction_date).split("/")
      if (d.length !== 3) return false
      return Number(d[1]) === now.getMonth() + 1 && Number(d[2]) === now.getFullYear()
    })
    const monthIncome = thisMonth.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
    const monthExpense = thisMonth.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)
    return { income, expense, profit: income - expense, monthIncome, monthExpense, count: transactions.length }
  }, [transactions])

  const recentTransactions = transactions.slice(0, 8)

  const filteredCategories = categories.filter((c) => c.type === form.type)

  const handleSubmit = async () => {
    if (!user) return
    const amount = parseMoneyInput(form.amount)
    if (amount <= 0) {
      toast.error("Số tiền phải lớn hơn 0")
      return
    }

    try {
      await insertTransaction({
        user_id: user.id,
        type: form.type,
        amount,
        category_id: form.categoryId || null,
        description: form.description || null,
        transaction_date: toStoredDateValue(form.transactionDate),
        payment_method: form.paymentMethod as "cash" | "bank" | "card" | "other",
        ghi_chu: {},
      })
      logAction("Thêm giao dịch", `${form.type === "income" ? "Thu" : "Chi"} ${displayMoney(amount)}`)
      toast.success("Đã thêm giao dịch")
      setDialogOpen(false)
      setForm({ type: "income", amount: "", categoryId: "", description: "", transactionDate: todayStoredDate(), paymentMethod: "cash" })
      loadData()
    } catch {
      toast.error("Không thể lưu giao dịch")
    }
  }

  return (
    <ModulePageShell module="cashflow">
      <ModuleBrandHeader
        module="cashflow"
        subtitle="Theo dõi thu chi và dòng tiền kinh doanh cá nhân"
        actions={
          <AccentButton module="cashflow" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Thêm giao dịch
          </AccentButton>
        }
      />

      {loading ? (
        <SkeletonMetricCards />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <ModuleKpiCard module="cashflow" label="Tổng thu" value={displayMoney(stats.income)} icon={<TrendingUp className="h-5 w-5" />} delay={0} tone="income" onClick={() => router.push("/dashboard/transactions?type=income")} />
          <ModuleKpiCard module="cashflow" label="Tổng chi" value={displayMoney(stats.expense)} icon={<TrendingDown className="h-5 w-5" />} delay={60} tone="expense" onClick={() => router.push("/dashboard/transactions?type=expense")} />
          <ModuleKpiCard module="cashflow" label="Lợi nhuận" value={displayMoney(stats.profit)} hint="Thu trừ chi" icon={<PiggyBank className="h-5 w-5" />} delay={120} tone="profit" />
          <ModuleKpiCard module="cashflow" label="Tháng này" value={displayMoney(stats.monthIncome - stats.monthExpense)} hint={`${stats.count} giao dịch`} icon={<Wallet className="h-5 w-5" />} delay={180} tone="neutral" />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <MonthlyCashflowChart transactions={transactions} />
        <ProfitTrendChart transactions={transactions} />
        <CategoryPieChart transactions={transactions} type="income" />
        <CategoryPieChart transactions={transactions} type="expense" />
      </div>

      <ModuleSectionCard title="Giao dịch gần đây" description="8 giao dịch mới nhất">
        {loading ? (
          <div className="p-6"><SkeletonTable /></div>
        ) : (
          <ModuleResponsiveTable
            headers={["Ngày", "Loại", "Danh mục", "Mô tả", "Số tiền", "Thanh toán"]}
            rows={recentTransactions.map((t) => [
              formatDisplayDate(t.transaction_date),
              <TransactionTypeBadge key="type" type={t.type} />,
              t.category?.name || "—",
              t.description || "—",
              <span key="amt" className={t.type === "income" ? "text-income font-semibold font-mono tabular-nums" : "text-expense font-semibold font-mono tabular-nums"}>
                {t.type === "income" ? "+" : "-"}{displayMoney(t.amount)}
              </span>,
              <PaymentMethodLabel key="pm" method={t.payment_method} />,
            ])}
          />
        )}
      </ModuleSectionCard>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-500 to-green-700 rounded-t-2xl" />
          <DialogHeader>
            <DialogTitle>Thêm giao dịch mới</DialogTitle>
            <DialogDescription>Ghi nhận thu hoặc chi vào sổ quỹ</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Loại</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "income" | "expense", categoryId: "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Thu</SelectItem>
                    <SelectItem value="expense">Chi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ngày</Label>
                <Input type="date" value={toDateInputValue(form.transactionDate)} onChange={(e) => setForm({ ...form, transactionDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Số tiền (VND)</Label>
              <Input className="font-mono" value={form.amount} onChange={(e) => setForm({ ...form, amount: formatMoneyInput(e.target.value) })} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>Danh mục</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                <SelectTrigger><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ghi chú giao dịch" />
            </div>
            <div className="space-y-2">
              <Label>Phương thức</Label>
              <Select value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Tiền mặt</SelectItem>
                  <SelectItem value="bank">Chuyển khoản</SelectItem>
                  <SelectItem value="card">Thẻ</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Hủy</Button>
              <AccentButton module="cashflow" className="flex-1" onClick={handleSubmit}>Lưu</AccentButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ModulePageShell>
  )
}
