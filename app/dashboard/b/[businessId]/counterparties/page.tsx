"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Plus, Edit2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { ModulePageShell, ModuleSubpageHeader, ModuleSectionCard, ModuleResponsiveTable, AccentButton } from "@/components/dashboard/module-shell"
import { SkeletonTable } from "@/components/ui/skeleton-loader"
import { fetchCounterparties, insertCounterparty, updateCounterparty, deleteCounterparty } from "@/lib/supabase"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import type { Counterparty, CounterpartyRole } from "@/lib/types"

const ROLE_LABEL: Record<CounterpartyRole, string> = {
  customer: "Khách hàng",
  supplier: "Nhà cung cấp",
  both: "Cả hai",
}

export default function BusinessCounterpartiesPage() {
  const { user, logAction } = useAuth()
  const params = useParams()
  const businessId = params.businessId as string
  const [items, setItems] = useState<Counterparty[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Counterparty | null>(null)
  const [form, setForm] = useState({ name: "", phone: "", email: "", role: "customer" as CounterpartyRole })

  const load = useCallback(async () => {
    if (!user) return
    try {
      setItems(await fetchCounterparties(user.id, businessId))
    } catch {
      toast.error("Không tải được đối tác")
    } finally {
      setLoading(false)
    }
  }, [user, businessId])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: "", phone: "", email: "", role: "customer" })
    setDialogOpen(true)
  }

  const openEdit = (c: Counterparty) => {
    setEditing(c)
    setForm({ name: c.name, phone: c.phone || "", email: c.email || "", role: c.role })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!user || !form.name.trim()) { toast.error("Nhập tên"); return }
    const payload = {
      user_id: user.id,
      business_id: businessId,
      name: form.name.trim(),
      phone: form.phone || null,
      email: form.email || null,
      role: form.role,
      ghi_chu: {},
    }
    try {
      if (editing) {
        await updateCounterparty(editing.id, payload)
        logAction("Sửa đối tác", form.name)
      } else {
        await insertCounterparty(payload)
        logAction("Thêm đối tác", form.name)
      }
      toast.success("Đã lưu")
      setDialogOpen(false)
      load()
    } catch {
      toast.error("Không thể lưu")
    }
  }

  const handleDelete = async (c: Counterparty) => {
    if (!confirm(`Xóa "${c.name}"?`)) return
    await deleteCounterparty(c.id)
    logAction("Xóa đối tác", c.name)
    load()
  }

  return (
    <ModulePageShell module="cashflow">
      <ModuleSubpageHeader module="cashflow" title="Đối tác" subtitle="Khách hàng và nhà cung cấp" actions={<AccentButton module="cashflow" onClick={openCreate}><Plus className="h-4 w-4" /> Thêm</AccentButton>} />
      <ModuleSectionCard title={`${items.length} đối tác`}>
        {loading ? <div className="p-6"><SkeletonTable /></div> : (
          <ModuleResponsiveTable
            headers={["Tên", "Vai trò", "Điện thoại", "Email", ""]}
            rows={items.map((c) => [
              c.name,
              ROLE_LABEL[c.role],
              c.phone || "—",
              c.email || "—",
              <div key="x" className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Edit2 className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDelete(c)} className="text-red-400"><Trash2 className="h-4 w-4" /></Button></div>,
            ])}
          />
        )}
      </ModuleSectionCard>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Sửa đối tác" : "Thêm đối tác"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Tên</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Vai trò</Label><Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as CounterpartyRole })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="customer">Khách hàng</SelectItem><SelectItem value="supplier">Nhà cung cấp</SelectItem><SelectItem value="both">Cả hai</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Điện thoại</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>Hủy</Button><AccentButton module="cashflow" className="flex-1" onClick={handleSave}>Lưu</AccentButton></div>
          </div>
        </DialogContent>
      </Dialog>
    </ModulePageShell>
  )
}
