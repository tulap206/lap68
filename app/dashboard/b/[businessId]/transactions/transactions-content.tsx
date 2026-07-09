"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Plus, Edit2, Trash2, Search } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { ModulePageShell, ModuleSubpageHeader, ModuleSectionCard, ModuleResponsiveTable, AccentButton } from "@/components/dashboard/module-shell"
import { TransactionTypeBadge, PaymentMethodLabel } from "@/components/dashboard/cashflow-ui"
import { SkeletonTable } from "@/components/ui/skeleton-loader"
import { fetchTransactions, fetchCategories, insertTransaction, updateTransaction, deleteTransaction } from "@/lib/supabase"
import { displayMoney, formatMoneyInput, parseMoneyInput } from "@/lib/format-money"
import { formatDisplayDate, todayStoredDate, toDateInputValue, toStoredDateValue } from "@/lib/format-date"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import type { Transaction, Category } from "@/lib/types"

export default function BusinessTransactionsPage() {
  const { user, logAction } = useAuth()
  const params = useParams()
  const searchParams = useSearchParams()
  const businessId = params.businessId as string
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [form, setForm] = useState({
    type: "income" as "income" | "expense",
    amount: "",
    categoryId: "",
    description: "",
    transactionDate: todayStoredDate(),
    paymentMethod: "cash",
  })

  const load = useCallback(async () => {
    if (!user) return
    try {
      const [txs, cats] = await Promise.all([
        fetchTransactions(user.id, businessId),
        fetchCategories(user.id, businessId),
      ])
      setTransactions(txs)
      setCategories(cats)
    } catch {
      toast.error("Không tải được dữ liệu")
    } finally {
      setLoading(false)
    }
  }, [user, businessId])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => transactions.filter((t) => {
    if (typeFilter !== "all" && t.type !== typeFilter) return false
    const q = search.toLowerCase()
    if (!q) return true
    return (t.description || "").toLowerCase().includes(q) || displayMoney(t.amount).includes(q)
  }), [transactions, search, typeFilter])

  const filteredCategories = categories.filter((c) => c.type === form.type)

  const openCreate = () => {
    setEditing(null)
    setForm({ type: "income", amount: "", categoryId: "", description: "", transactionDate: todayStoredDate(), paymentMethod: "cash" })
    setDialogOpen(true)
  }

  const openEdit = (t: Transaction) => {
    setEditing(t)
    setForm({
      type: t.type,
      amount: formatMoneyInput(String(t.amount)),
      categoryId: t.category_id || "",
      description: t.description || "",
      transactionDate: toDateInputValue(t.transaction_date),
      paymentMethod: t.payment_method,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!user) return
    const amount = parseMoneyInput(form.amount)
    if (amount <= 0) { toast.error("Số tiền phải lớn hơn 0"); return }
    const payload = {
      user_id: user.id,
      business_id: businessId,
      type: form.type,
      amount,
      category_id: form.categoryId || null,
      counterparty_id: null,
      schedule_id: null,
      description: form.description || null,
      transaction_date: toStoredDateValue(form.transactionDate),
      payment_method: form.paymentMethod as Transaction["payment_method"],
      ghi_chu: {},
    }
    try {
      if (editing) {
        await updateTransaction(editing.id, payload)
        logAction("Sửa giao dịch", displayMoney(amount))
      } else {
        await insertTransaction(payload)
        logAction("Thêm giao dịch", displayMoney(amount))
      }
      toast.success("Đã lưu")
      setDialogOpen(false)
      load()
    } catch {
      toast.error("Không thể lưu")
    }
  }

  const handleDelete = async (t: Transaction) => {
    if (!confirm("Xóa giao dịch?")) return
    await deleteTransaction(t.id)
    logAction("Xóa giao dịch", displayMoney(t.amount))
    load()
  }

  return (
    <ModulePageShell module="cashflow">
      <ModuleSubpageHeader module="cashflow" title="Giao dịch" subtitle="Thu chi của việc kinh doanh này" actions={<AccentButton module="cashflow" onClick={openCreate}><Plus className="h-4 w-4" /> Thêm</AccentButton>} />
      <ModuleSectionCard
        title={`${filtered.length} giao dịch`}
        filters={
          <div className="flex gap-2">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" /><Input className="pl-9 w-44 h-9" placeholder="Tìm..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger className="w-28 h-9"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả</SelectItem><SelectItem value="income">Thu</SelectItem><SelectItem value="expense">Chi</SelectItem></SelectContent></Select>
          </div>
        }
      >
        {loading ? <div className="p-6"><SkeletonTable /></div> : (
          <ModuleResponsiveTable
            headers={["Ngày", "Loại", "Mô tả", "Số tiền", "TT", ""]}
            rows={filtered.map((t) => [
              formatDisplayDate(t.transaction_date),
              <TransactionTypeBadge key="t" type={t.type} />,
              t.description || "—",
              <span key="a" className={`font-mono font-semibold ${t.type === "income" ? "text-income" : "text-expense"}`}>{t.type === "income" ? "+" : "-"}{displayMoney(t.amount)}</span>,
              <PaymentMethodLabel key="p" method={t.payment_method} />,
              <div key="x" className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Edit2 className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDelete(t)} className="text-red-400"><Trash2 className="h-4 w-4" /></Button></div>,
            ])}
          />
        )}
      </ModuleSectionCard>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Sửa giao dịch" : "Thêm giao dịch"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Loại</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "income" | "expense", categoryId: "" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="income">Thu</SelectItem><SelectItem value="expense">Chi</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Ngày</Label><Input type="date" value={toDateInputValue(form.transactionDate)} onChange={(e) => setForm({ ...form, transactionDate: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Số tiền</Label><Input className="font-mono" value={form.amount} onChange={(e) => setForm({ ...form, amount: formatMoneyInput(e.target.value) })} /></div>
            <div className="space-y-2"><Label>Danh mục</Label><Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}><SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger><SelectContent>{filteredCategories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Mô tả</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Hủy</Button><AccentButton module="cashflow" className="flex-1" onClick={handleSave}>Lưu</AccentButton></div>
          </div>
        </DialogContent>
      </Dialog>
    </ModulePageShell>
  )
}
