"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Plus, Edit2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { ModulePageShell, ModuleSubpageHeader, ModuleSectionCard, ModuleResponsiveTable, AccentButton, moduleBadgeClass } from "@/components/dashboard/module-shell"
import { ScheduleFormDialog, scheduleFormToPayload } from "@/components/dashboard/schedule-form-dialog"
import { SkeletonTable } from "@/components/ui/skeleton-loader"
import { fetchSchedules, fetchCategories, insertSchedule, updateSchedule, deleteSchedule } from "@/lib/supabase"
import { displayMoney } from "@/lib/format-money"
import { formatDisplayDate } from "@/lib/format-date"
import { getEffectiveDueDate } from "@/lib/schedule-engine"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Schedule, Category } from "@/lib/types"

const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ",
  overdue: "Quá hạn",
  done: "Xong",
  skipped: "Bỏ qua",
  cancelled: "Hủy",
}

export default function BusinessSchedulesPage() {
  const { user, logAction } = useAuth()
  const params = useParams()
  const businessId = params.businessId as string
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Schedule | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    try {
      const [sch, cats] = await Promise.all([
        fetchSchedules(user.id, businessId),
        fetchCategories(user.id, businessId),
      ])
      setSchedules(sch)
      setCategories(cats)
    } catch {
      toast.error("Không tải được lịch thu/chi")
    } finally {
      setLoading(false)
    }
  }, [user, businessId])

  useEffect(() => { load() }, [load])

  const handleSave = async (form: Parameters<typeof scheduleFormToPayload>[0]) => {
    if (!user) return
    const payload = scheduleFormToPayload(form, user.id, businessId)
    if (editing) {
      await updateSchedule(editing.id, payload)
      logAction("Sửa lịch", form.title)
    } else {
      await insertSchedule(payload)
      logAction("Thêm lịch", form.title)
    }
    toast.success("Đã lưu")
    load()
  }

  const handleDelete = async (s: Schedule) => {
    if (!confirm(`Xóa lịch "${s.title}"?`)) return
    await deleteSchedule(s.id)
    logAction("Xóa lịch", s.title)
    load()
  }

  return (
    <ModulePageShell module="cashflow">
      <ModuleSubpageHeader module="cashflow" title="Lịch thu/chi" subtitle="Nhắc hẹn đóng tiền và thu tiền định kỳ" actions={<AccentButton module="cashflow" onClick={() => { setEditing(null); setDialogOpen(true) }}><Plus className="h-4 w-4" /> Thêm lịch</AccentButton>} />
      <ModuleSectionCard title={`${schedules.length} lịch`}>
        {loading ? <div className="p-6"><SkeletonTable /></div> : (
          <ModuleResponsiveTable
            headers={["Tiêu đề", "Loại", "Đến hạn", "Số tiền", "Trạng thái", ""]}
            rows={schedules.map((s) => [
              s.title,
              <span key="d" className={cn(moduleBadgeClass, s.direction === "collect" ? "badge-income" : "badge-expense")}>{s.direction === "collect" ? "Phải thu" : "Phải chi"}</span>,
              formatDisplayDate(getEffectiveDueDate(s)),
              s.amount ? displayMoney(s.amount) : "—",
              <span key="st" className={cn(moduleBadgeClass, s.status === "overdue" ? "badge-expense" : s.status === "done" ? "badge-income" : "")}>{STATUS_LABEL[s.status] || s.status}</span>,
              <div key="x" className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => { setEditing(s); setDialogOpen(true) }}><Edit2 className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDelete(s)} className="text-red-400"><Trash2 className="h-4 w-4" /></Button></div>,
            ])}
          />
        )}
      </ModuleSectionCard>

      <ScheduleFormDialog open={dialogOpen} onOpenChange={setDialogOpen} categories={categories} editing={editing} onSave={handleSave} />
    </ModulePageShell>
  )
}
