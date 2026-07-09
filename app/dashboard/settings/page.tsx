"use client"

import { useState } from "react"
import { Download, Upload } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { ModulePageShell, ModuleSubpageHeader, ModuleSectionCard, AccentButton } from "@/components/dashboard/module-shell"
import {
  exportUserData,
  fetchCategories,
  fetchBusinesses,
  insertBusiness,
  insertCategory,
  insertTransaction,
  insertSchedule,
  insertCounterparty,
} from "@/lib/supabase"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
  const { user, logAction } = useAuth()
  const [importing, setImporting] = useState(false)

  const handleExport = async () => {
    if (!user) return
    try {
      const data = await exportUserData(user.id)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `lap68-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      logAction("Sao lưu", "Xuất file JSON v2")
      toast.success("Đã xuất dữ liệu")
    } catch {
      toast.error("Không thể xuất dữ liệu")
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)

      const existingBiz = await fetchBusinesses(user.id)
      const bizMap = new Map<string, string>()
      for (const b of existingBiz) {
        if (b.code) bizMap.set(b.code, b.id)
        bizMap.set(b.name, b.id)
      }

      if (Array.isArray(data.businesses)) {
        for (const b of data.businesses) {
          const key = b.code || b.name
          if (!bizMap.has(key)) {
            const created = await insertBusiness({
              user_id: user.id,
              name: b.name,
              code: b.code || null,
              color: b.color || "#059669",
              icon: b.icon || "wallet",
              description: b.description || null,
              status: b.status || "active",
              sort_order: b.sort_order || 0,
              ghi_chu: b.ghi_chu || {},
            })
            bizMap.set(key, created.id)
            if (b.name) bizMap.set(b.name, created.id)
          }
        }
      }

      const defaultBizId = existingBiz[0]?.id || bizMap.values().next().value
      const existingCats = await fetchCategories(user.id)
      const catMap = new Map<string, string>()
      for (const c of existingCats) catMap.set(`${c.business_id}:${c.name}`, c.id)

      if (Array.isArray(data.categories)) {
        for (const c of data.categories) {
          const businessId = c.business_id && bizMap.has(c.business_id) ? bizMap.get(c.business_id)! : (c.business_id || defaultBizId)
          const mapKey = `${businessId}:${c.name}`
          if (!catMap.has(mapKey)) {
            const created = await insertCategory({
              user_id: user.id,
              business_id: businessId || null,
              name: c.name,
              type: c.type,
              color: c.color || "#059669",
              icon: c.icon || "wallet",
            })
            catMap.set(mapKey, created.id)
          }
        }
      }

      if (Array.isArray(data.counterparties)) {
        for (const cp of data.counterparties) {
          const businessId = cp.business_id || defaultBizId
          await insertCounterparty({
            user_id: user.id,
            business_id: businessId || null,
            name: cp.name,
            phone: cp.phone || null,
            email: cp.email || null,
            role: cp.role || "customer",
            ghi_chu: cp.ghi_chu || {},
          })
        }
      }

      if (Array.isArray(data.transactions)) {
        for (const t of data.transactions) {
          const businessId = t.business_id || defaultBizId
          const catName = t.category?.name
          const catKey = catName ? `${businessId}:${catName}` : null
          await insertTransaction({
            user_id: user.id,
            business_id: businessId || null,
            type: t.type,
            amount: t.amount,
            category_id: catKey ? catMap.get(catKey) || null : t.category_id || null,
            counterparty_id: t.counterparty_id || null,
            schedule_id: null,
            description: t.description,
            transaction_date: t.transaction_date,
            payment_method: t.payment_method || "cash",
            ghi_chu: t.ghi_chu || {},
          })
        }
      }

      if (Array.isArray(data.schedules)) {
        for (const s of data.schedules) {
          const businessId = s.business_id || defaultBizId
          if (!businessId) continue
          await insertSchedule({
            user_id: user.id,
            business_id: businessId,
            direction: s.direction,
            title: s.title,
            description: s.description || null,
            amount: s.amount,
            amount_is_estimate: s.amount_is_estimate || false,
            schedule_kind: s.schedule_kind || "once",
            due_date: s.due_date,
            next_due_date: s.next_due_date || s.due_date,
            recurrence: s.recurrence || {},
            reminder_days: s.reminder_days || [3, 1, 0],
            category_id: s.category_id || null,
            counterparty_id: s.counterparty_id || null,
            status: s.status || "pending",
            linked_transaction_id: null,
            completed_at: null,
            ghi_chu: s.ghi_chu || {},
          })
        }
      }

      logAction("Khôi phục", file.name)
      toast.success("Đã nhập dữ liệu")
    } catch {
      toast.error("File không hợp lệ")
    } finally {
      setImporting(false)
      e.target.value = ""
    }
  }

  return (
    <ModulePageShell module="cashflow">
      <ModuleSubpageHeader module="cashflow" title="Cài đặt & Sao lưu" subtitle="Xuất nhập dữ liệu đa việc kinh doanh (v2)" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ModuleSectionCard title="Sao lưu dữ liệu" description="Tải file JSON: việc KD, danh mục, giao dịch, lịch, đối tác">
          <div className="p-6">
            <AccentButton module="cashflow" onClick={handleExport}>
              <Download className="h-4 w-4" /> Xuất file JSON
            </AccentButton>
          </div>
        </ModuleSectionCard>

        <ModuleSectionCard title="Khôi phục dữ liệu" description="Nhập từ file sao lưu trước đó">
          <div className="p-6">
            <label>
              <input type="file" accept=".json" className="hidden" onChange={handleImport} disabled={importing} />
              <Button variant="outline" className="cursor-pointer" asChild>
                <span><Upload className="h-4 w-4" /> {importing ? "Đang nhập..." : "Chọn file JSON"}</span>
              </Button>
            </label>
          </div>
        </ModuleSectionCard>
      </div>

      <ModuleSectionCard title="Thông tin hệ thống">
        <div className="p-6 text-sm text-zinc-400 space-y-2">
          <p><strong>Ứng dụng:</strong> LAP68 — Quản lý dòng tiền đa việc kinh doanh</p>
          <p><strong>Phiên bản:</strong> 2.0.0</p>
          <p><strong>Tài khoản:</strong> {user?.displayName} ({user?.username})</p>
          <p><strong>Lưu ý:</strong> Chỉ thao tác bảng <code className="text-zinc-300">lap68_*</code> — không ảnh hưởng 3lmoto/79moto</p>
        </div>
      </ModuleSectionCard>
    </ModulePageShell>
  )
}
