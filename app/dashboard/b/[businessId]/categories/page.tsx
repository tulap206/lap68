"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Plus, Edit2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import {
  ModulePageShell,
  ModuleSubpageHeader,
  ModuleSectionCard,
  ModuleResponsiveTable,
  AccentButton,
  moduleBadgeClass,
} from "@/components/dashboard/module-shell"
import { SkeletonTable } from "@/components/ui/skeleton-loader"
import { fetchCategories, insertCategory, updateCategory, deleteCategory } from "@/lib/supabase"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Category } from "@/lib/types"

const COLORS = ["#059669", "#2563EB", "#DC2626", "#D97706", "#7C6BA8", "#64748B"]

export default function BusinessCategoriesPage() {
  const { user, logAction } = useAuth()
  const params = useParams()
  const businessId = params.businessId as string
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState({ name: "", type: "income" as "income" | "expense", color: COLORS[0] })

  const loadData = useCallback(async () => {
    if (!user) return
    try {
      setCategories(await fetchCategories(user.id, businessId))
    } catch {
      toast.error("Không tải được danh mục")
    } finally {
      setLoading(false)
    }
  }, [user, businessId])

  useEffect(() => { loadData() }, [loadData])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: "", type: "income", color: COLORS[0] })
    setDialogOpen(true)
  }

  const openEdit = (c: Category) => {
    setEditing(c)
    setForm({ name: c.name, type: c.type, color: c.color })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!user || !form.name.trim()) { toast.error("Nhập tên danh mục"); return }
    try {
      if (editing) {
        await updateCategory(editing.id, { name: form.name, type: form.type, color: form.color })
        logAction("Sửa danh mục", form.name)
      } else {
        await insertCategory({ user_id: user.id, business_id: businessId, name: form.name, type: form.type, color: form.color, icon: "wallet" })
        logAction("Thêm danh mục", form.name)
      }
      toast.success("Đã lưu")
      setDialogOpen(false)
      loadData()
    } catch {
      toast.error("Không thể lưu")
    }
  }

  const handleDelete = async (c: Category) => {
    if (!confirm(`Xóa danh mục "${c.name}"?`)) return
    try {
      await deleteCategory(c.id)
      logAction("Xóa danh mục", c.name)
      toast.success("Đã xóa")
      loadData()
    } catch {
      toast.error("Không thể xóa — có thể đang được dùng")
    }
  }

  return (
    <ModulePageShell module="cashflow">
      <ModuleSubpageHeader module="cashflow" title="Danh mục" subtitle="Phân loại thu chi theo việc kinh doanh" actions={<AccentButton module="cashflow" onClick={openCreate}><Plus className="h-4 w-4" /> Thêm</AccentButton>} />
      <ModuleSectionCard title="Danh sách danh mục">
        {loading ? <div className="p-6"><SkeletonTable /></div> : (
          <ModuleResponsiveTable
            headers={["Tên", "Loại", "Màu", ""]}
            rows={categories.map((c) => [
              c.name,
              <span key="type" className={cn(moduleBadgeClass, c.type === "income" ? "badge-income" : "badge-expense")}>{c.type === "income" ? "Thu" : "Chi"}</span>,
              <span key="color" className="inline-flex items-center gap-2"><span className="h-4 w-4 rounded-full border" style={{ backgroundColor: c.color }} />{c.color}</span>,
              <div key="actions" className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Edit2 className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDelete(c)} className="text-red-400"><Trash2 className="h-4 w-4" /></Button></div>,
            ])}
          />
        )}
      </ModuleSectionCard>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Sửa danh mục" : "Thêm danh mục"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Tên</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Loại</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "income" | "expense" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="income">Thu</SelectItem><SelectItem value="expense">Chi</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Màu</Label><div className="flex gap-2">{COLORS.map((c) => <button key={c} type="button" className={cn("h-8 w-8 rounded-full border-2", form.color === c ? "border-white" : "border-transparent")} style={{ backgroundColor: c }} onClick={() => setForm({ ...form, color: c })} />)}</div></div>
            <div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Hủy</Button><AccentButton module="cashflow" className="flex-1" onClick={handleSave}>Lưu</AccentButton></div>
          </div>
        </DialogContent>
      </Dialog>
    </ModulePageShell>
  )
}
