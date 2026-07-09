"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus, Edit2, Archive } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { ModulePageShell, ModuleSubpageHeader, ModuleSectionCard, ModuleResponsiveTable, AccentButton } from "@/components/dashboard/module-shell"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { fetchBusinesses, insertBusiness, updateBusiness } from "@/lib/supabase"
import type { Business } from "@/lib/types"

const COLORS = ["#22c55e", "#ef4444", "#71717a", "#2563EB", "#D97706", "#7C6BA8"]

export default function BusinessesPage() {
  const { user, logAction } = useAuth()
  const [items, setItems] = useState<Business[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Business | null>(null)
  const [form, setForm] = useState({ name: "", code: "", color: COLORS[0], description: "" })

  const load = useCallback(async () => {
    if (!user) return
    setItems(await fetchBusinesses(user.id))
  }, [user])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: "", code: "", color: COLORS[0], description: "" })
    setOpen(true)
  }

  const openEdit = (b: Business) => {
    setEditing(b)
    setForm({ name: b.name, code: b.code || "", color: b.color, description: b.description || "" })
    setOpen(true)
  }

  const save = async () => {
    if (!user || !form.name.trim()) return
    try {
      if (editing) {
        await updateBusiness(editing.id, { ...form, code: form.code || null, description: form.description || null })
        logAction("Sửa việc KD", form.name)
      } else {
        await insertBusiness({
          user_id: user.id,
          name: form.name.trim(),
          code: form.code || null,
          color: form.color,
          icon: "briefcase",
          description: form.description || null,
          status: "active",
          sort_order: items.length,
          ghi_chu: {},
        })
        logAction("Thêm việc KD", form.name)
      }
      toast.success("Đã lưu")
      setOpen(false)
      load()
    } catch {
      toast.error("Không thể lưu")
    }
  }

  const archive = async (b: Business) => {
    if (!confirm(`Lưu trữ việc "${b.name}"?`)) return
    await updateBusiness(b.id, { status: "archived" })
    logAction("Lưu trữ việc", b.name)
    load()
  }

  return (
    <ModulePageShell module="cashflow">
      <ModuleSubpageHeader module="cashflow" title="Quản lý việc kinh doanh" subtitle="Tạo và sắp xếp các mảng thu chi" actions={<AccentButton module="cashflow" onClick={openCreate}><Plus className="h-4 w-4" /> Thêm việc</AccentButton>} />
      <ModuleSectionCard title={`${items.length} việc đang hoạt động`}>
        <ModuleResponsiveTable
          headers={["Tên", "Mã", "Màu", ""]}
          rows={items.map((b) => [
            b.name,
            b.code || "—",
            <span key="c" className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: b.color }} />{b.color}</span>,
            <div key="a" className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => openEdit(b)}><Edit2 className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => archive(b)} className="text-zinc-500"><Archive className="h-4 w-4" /></Button>
            </div>,
          ])}
        />
      </ModuleSectionCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Sửa việc" : "Thêm việc kinh doanh"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Tên</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Mã (tùy chọn)</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
            <div className="space-y-2"><Label>Mô tả</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="flex gap-2">{COLORS.map((c) => <button key={c} type="button" onClick={() => setForm({ ...form, color: c })} className="h-8 w-8 rounded-full border-2" style={{ backgroundColor: c, borderColor: form.color === c ? "#fff" : "transparent" }} />)}</div>
            <div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Hủy</Button><AccentButton module="cashflow" className="flex-1" onClick={save}>Lưu</AccentButton></div>
          </div>
        </DialogContent>
      </Dialog>
    </ModulePageShell>
  )
}
