"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { AccentButton } from "./module-shell"
import { formatMoneyInput, parseMoneyInput } from "@/lib/format-money"
import { toDateInputValue, toStoredDateValue, todayStoredDate } from "@/lib/format-date"
import type { Category, Counterparty, Schedule, ScheduleDirection, ScheduleKind } from "@/lib/types"

export type ScheduleFormValues = {
  direction: ScheduleDirection
  title: string
  description: string
  amount: string
  amountIsEstimate: boolean
  scheduleKind: ScheduleKind
  dueDate: string
  frequency: string
  interval: string
  dayOfMonth: string
  endDate: string
  categoryId: string
  counterpartyId: string
  reminderDays: string
}

const defaultForm = (): ScheduleFormValues => ({
  direction: "collect",
  title: "",
  description: "",
  amount: "",
  amountIsEstimate: false,
  scheduleKind: "once",
  dueDate: toDateInputValue(todayStoredDate()),
  frequency: "monthly",
  interval: "1",
  dayOfMonth: "1",
  endDate: "",
  categoryId: "",
  counterpartyId: "",
  reminderDays: "3,1,0",
})

export function ScheduleFormDialog({
  open,
  onOpenChange,
  categories,
  counterparties,
  editing,
  onSave,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  categories: Category[]
  counterparties: Counterparty[]
  editing: Schedule | null
  onSave: (values: ScheduleFormValues) => Promise<void>
}) {
  const [form, setForm] = useState<ScheduleFormValues>(defaultForm())
  const [saving, setSaving] = useState(false)

  const resetFromEditing = () => {
    if (!editing) {
      setForm(defaultForm())
      return
    }
    setForm({
      direction: editing.direction,
      title: editing.title,
      description: editing.description || "",
      amount: editing.amount ? formatMoneyInput(String(editing.amount)) : "",
      amountIsEstimate: editing.amount_is_estimate,
      scheduleKind: editing.schedule_kind,
      dueDate: toDateInputValue(editing.due_date),
      frequency: editing.recurrence?.frequency || "monthly",
      interval: String(editing.recurrence?.interval || 1),
      dayOfMonth: String(editing.recurrence?.day_of_month || 1),
      endDate: editing.recurrence?.end_date ? toDateInputValue(editing.recurrence.end_date) : "",
      categoryId: editing.category_id || "",
      counterpartyId: editing.counterparty_id || "",
      reminderDays: (editing.reminder_days || [3, 1, 0]).join(","),
    })
  }

  const handleOpen = (v: boolean) => {
    if (v) resetFromEditing()
    onOpenChange(v)
  }

  const filteredCats = categories.filter((c) =>
    form.direction === "collect" ? c.type === "income" : c.type === "expense"
  )

  const submit = async () => {
    setSaving(true)
    try {
      await onSave(form)
      onOpenChange(false)
      setForm(defaultForm())
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-500 to-green-700 rounded-t-2xl" />
        <DialogHeader>
          <DialogTitle>{editing ? "Sửa lịch thu/chi" : "Thêm lịch thu/chi"}</DialogTitle>
          <DialogDescription>Nhắc hẹn đóng tiền hoặc thu tiền theo thời gian</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Loại</Label>
              <Select value={form.direction} onValueChange={(v) => setForm({ ...form, direction: v as ScheduleDirection, categoryId: "" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="collect">Phải thu</SelectItem>
                  <SelectItem value="pay">Phải chi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tần suất</Label>
              <Select value={form.scheduleKind} onValueChange={(v) => setForm({ ...form, scheduleKind: v as ScheduleKind })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Một lần</SelectItem>
                  <SelectItem value="recurring">Lặp lại</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tiêu đề</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="VD: Tiền thuê mặt bằng" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Ngày đến hạn</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Số tiền (VND)</Label>
              <Input className="font-mono" value={form.amount} onChange={(e) => setForm({ ...form, amount: formatMoneyInput(e.target.value) })} />
            </div>
          </div>
          {form.scheduleKind === "recurring" && (
            <div className="grid grid-cols-3 gap-2 rounded-xl border border-zinc-800 p-3 bg-zinc-900/40">
              <div className="space-y-1">
                <Label className="text-xs">Chu kỳ</Label>
                <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Ngày</SelectItem>
                    <SelectItem value="weekly">Tuần</SelectItem>
                    <SelectItem value="monthly">Tháng</SelectItem>
                    <SelectItem value="yearly">Năm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Mỗi</Label>
                <Input className="h-8 text-xs" value={form.interval} onChange={(e) => setForm({ ...form, interval: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ngày trong tháng</Label>
                <Input className="h-8 text-xs" value={form.dayOfMonth} onChange={(e) => setForm({ ...form, dayOfMonth: e.target.value })} />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label>Nhắc trước (ngày, cách nhau dấu phẩy)</Label>
            <Input value={form.reminderDays} onChange={(e) => setForm({ ...form, reminderDays: e.target.value })} placeholder="7,3,1,0" />
          </div>
          <div className="space-y-2">
            <Label>Danh mục</Label>
            <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
              <SelectTrigger><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
              <SelectContent>
                {filteredCats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Mô tả</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Hủy</Button>
            <AccentButton module="cashflow" className="flex-1" onClick={submit} disabled={saving || !form.title.trim()}>
              {saving ? "Đang lưu..." : "Lưu"}
            </AccentButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function scheduleFormToPayload(
  form: ScheduleFormValues,
  userId: string,
  businessId: string
) {
  const reminder_days = form.reminderDays
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n))

  const due_date = toStoredDateValue(form.dueDate)
  const recurrence =
    form.scheduleKind === "recurring"
      ? {
          frequency: form.frequency as "daily" | "weekly" | "monthly" | "yearly",
          interval: parseInt(form.interval, 10) || 1,
          day_of_month: parseInt(form.dayOfMonth, 10) || undefined,
          end_date: form.endDate ? toStoredDateValue(form.endDate) : undefined,
        }
      : {}

  return {
    user_id: userId,
    business_id: businessId,
    direction: form.direction,
    title: form.title.trim(),
    description: form.description || null,
    amount: form.amount ? parseMoneyInput(form.amount) : null,
    amount_is_estimate: form.amountIsEstimate,
    schedule_kind: form.scheduleKind,
    due_date,
    next_due_date: due_date,
    recurrence,
    reminder_days,
    category_id: form.categoryId || null,
    counterparty_id: form.counterpartyId || null,
    status: "pending" as const,
    linked_transaction_id: null,
    completed_at: null,
    ghi_chu: {},
  }
}
