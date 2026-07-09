"use client"

import { useState } from "react"
import { Download, Upload } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { ModulePageShell, ModuleSubpageHeader, ModuleSectionCard, AccentButton } from "@/components/dashboard/module-shell"
import { exportUserData, fetchCategories, insertCategory, insertTransaction } from "@/lib/supabase"
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
      logAction("Sao lưu", "Xuất file JSON")
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
      const existing = await fetchCategories(user.id)
      const catMap = new Map<string, string>()

      for (const c of existing) catMap.set(c.name, c.id)

      if (Array.isArray(data.categories)) {
        for (const c of data.categories) {
          if (!catMap.has(c.name)) {
            const created = await insertCategory({
              user_id: user.id,
              name: c.name,
              type: c.type,
              color: c.color || "#059669",
              icon: c.icon || "wallet",
            })
            catMap.set(c.name, created.id)
          }
        }
      }

      if (Array.isArray(data.transactions)) {
        for (const t of data.transactions) {
          const catName = t.category?.name
          await insertTransaction({
            user_id: user.id,
            type: t.type,
            amount: t.amount,
            category_id: catName ? catMap.get(catName) || null : null,
            description: t.description,
            transaction_date: t.transaction_date,
            payment_method: t.payment_method || "cash",
            ghi_chu: t.ghi_chu || {},
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
      <ModuleSubpageHeader module="cashflow" title="Cài đặt & Sao lưu" subtitle="Xuất nhập dữ liệu thu chi" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ModuleSectionCard title="Sao lưu dữ liệu" description="Tải file JSON chứa danh mục và giao dịch">
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
          <p><strong>Ứng dụng:</strong> LAP68 — Quản lý dòng tiền</p>
          <p><strong>Phiên bản:</strong> 1.0.0</p>
          <p><strong>Tài khoản:</strong> {user?.displayName} ({user?.username})</p>
        </div>
      </ModuleSectionCard>
    </ModulePageShell>
  )
}
