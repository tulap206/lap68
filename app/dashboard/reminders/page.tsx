"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { ModulePageShell, ModuleSubpageHeader, ModuleSectionCard } from "@/components/dashboard/module-shell"
import { ReminderPanel } from "@/components/dashboard/reminder-panel"
import { SkeletonTable } from "@/components/ui/skeleton-loader"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { AccentButton } from "@/components/dashboard/module-shell"
import {
  fetchSchedules,
  fetchBusinesses,
  completeSchedule,
  subscribeLap68Tables,
  syncScheduleStatuses,
} from "@/lib/supabase"
import { buildReminderItems } from "@/lib/schedule-engine"
import { displayMoney, formatMoneyInput, parseMoneyInput } from "@/lib/format-money"
import type { Schedule, Business, PaymentMethod } from "@/lib/types"

export default function RemindersPage() {
  const { user, logAction } = useAuth()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [completeTarget, setCompleteTarget] = useState<Schedule | null>(null)
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash")
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    try {
      await syncScheduleStatuses(user.id)
      const [sch, biz] = await Promise.all([fetchSchedules(user.id), fetchBusinesses(user.id)])
      setSchedules(sch)
      setBusinesses(biz)
    } catch {
      toast.error("Không tải được nhắc hẹn")
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!user) return
    return subscribeLap68Tables(user.id, load)
  }, [user, load])

  const businessMap = useMemo(() => new Map(businesses.map((b) => [b.id, b.name])), [businesses])
  const reminders = useMemo(() => buildReminderItems(schedules), [schedules])

  const openComplete = (scheduleId: string) => {
    const s = schedules.find((x) => x.id === scheduleId)
    if (!s) return
    setCompleteTarget(s)
    setAmount(s.amount ? formatMoneyInput(String(s.amount)) : "")
    setPaymentMethod("cash")
  }

  const handleComplete = async () => {
    if (!completeTarget) return
    const parsed = parseMoneyInput(amount)
    if (parsed <= 0) { toast.error("Nhập số tiền"); return }
    setSaving(true)
    try {
      await completeSchedule(completeTarget, parsed, paymentMethod)
      logAction("Hoàn thành lịch", completeTarget.title)
      toast.success("Đã ghi nhận giao dịch")
      setCompleteTarget(null)
      load()
    } catch {
      toast.error("Không thể hoàn thành")
    } finally {
      setSaving(false)
    }
  }

  const grouped = useMemo(() => {
    const overdue = reminders.filter((r) => r.urgency === "overdue")
    const today = reminders.filter((r) => r.urgency === "today")
    const soon = reminders.filter((r) => r.urgency === "soon" || r.urgency === "upcoming")
    return { overdue, today, soon }
  }, [reminders])

  return (
    <ModulePageShell module="cashflow">
      <ModuleSubpageHeader module="cashflow" title="Nhắc hẹn" subtitle="Theo dõi thu/chi sắp đến hạn trên tất cả việc kinh doanh" />

      {loading ? <SkeletonTable /> : (
        <div className="space-y-6">
          {grouped.overdue.length > 0 && (
            <ModuleSectionCard title={`Quá hạn (${grouped.overdue.length})`}>
              <div className="p-4 space-y-2">
                {grouped.overdue.map((r) => (
                  <div key={`${r.schedule.id}-${r.dueDate}`}>
                    <p className="text-xs text-zinc-500 mb-1">{businessMap.get(r.schedule.business_id) || "—"}</p>
                    <ReminderPanel items={[r]} onComplete={openComplete} />
                  </div>
                ))}
              </div>
            </ModuleSectionCard>
          )}
          {grouped.today.length > 0 && (
            <ModuleSectionCard title={`Hôm nay (${grouped.today.length})`}>
              <div className="p-4 space-y-2">
                {grouped.today.map((r) => (
                  <div key={`${r.schedule.id}-${r.dueDate}`}>
                    <p className="text-xs text-zinc-500 mb-1">{businessMap.get(r.schedule.business_id) || "—"}</p>
                    <ReminderPanel items={[r]} onComplete={openComplete} />
                  </div>
                ))}
              </div>
            </ModuleSectionCard>
          )}
          <ModuleSectionCard title={`Sắp tới (${grouped.soon.length})`}>
            <div className="p-4 space-y-2">
              {grouped.soon.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-4">Không có nhắc hẹn trong khoảng này</p>
              ) : grouped.soon.map((r) => (
                <div key={`${r.schedule.id}-${r.dueDate}`}>
                  <p className="text-xs text-zinc-500 mb-1">{businessMap.get(r.schedule.business_id) || "—"}</p>
                  <ReminderPanel items={[r]} onComplete={openComplete} />
                </div>
              ))}
            </div>
          </ModuleSectionCard>
        </div>
      )}

      <Dialog open={!!completeTarget} onOpenChange={(v) => !v && setCompleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đã {completeTarget?.direction === "collect" ? "thu" : "chi"} — {completeTarget?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Số tiền (VND)</Label>
              <Input className="font-mono" value={amount} onChange={(e) => setAmount(formatMoneyInput(e.target.value))} placeholder={completeTarget?.amount ? displayMoney(completeTarget.amount) : ""} />
            </div>
            <div className="space-y-2">
              <Label>Phương thức</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Tiền mặt</SelectItem>
                  <SelectItem value="bank">Chuyển khoản</SelectItem>
                  <SelectItem value="card">Thẻ</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setCompleteTarget(null)}>Hủy</Button>
              <AccentButton module="cashflow" className="flex-1" onClick={handleComplete} disabled={saving}>{saving ? "Đang lưu..." : "Xác nhận"}</AccentButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ModulePageShell>
  )
}
