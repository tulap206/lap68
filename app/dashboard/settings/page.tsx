"use client"

import { useState } from "react"
import { Download, Upload, FileJson } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { ModulePageShell, ModuleSubpageHeader, ModuleSectionCard, AccentButton } from "@/components/dashboard/module-shell"
import { CloudBackupPanel } from "@/components/dashboard/cloud-backup-panel"
import { ActivityLogPanel } from "@/components/dashboard/activity-log-panel"
import { exportUserData } from "@/lib/supabase"
import { importUserDataFromBackup } from "@/lib/backup-import"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
  const { user, logAction } = useAuth()
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    if (!user) return
    setExporting(true)
    try {
      const data = await exportUserData(user.id)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `lap68-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      logAction("Xuất file", "Sao lưu JSON local")
      toast.success("Đã xuất file")
    } catch {
      toast.error("Không thể xuất dữ liệu")
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setImporting(true)
    try {
      const data = JSON.parse(await file.text())
      const result = await importUserDataFromBackup(user.id, data)
      logAction("Nhập file", `${file.name} — ${result.txCount} giao dịch`)
      toast.success("Đã nhập dữ liệu từ file")
    } catch {
      toast.error("File không hợp lệ")
    } finally {
      setImporting(false)
      e.target.value = ""
    }
  }

  if (!user) return null

  return (
    <ModulePageShell module="cashflow">
      <div className="space-y-8">
        <ModuleSubpageHeader
          module="cashflow"
          title="Cài đặt & Sao lưu"
          subtitle="Sao lưu trực tuyến, xuất file và nhật ký hoạt động"
        />

        <ModuleSectionCard
          title="Sao lưu trực tuyến"
          description="Lưu snapshot dữ liệu lên Supabase — khôi phục hoặc tải về bất cứ lúc nào"
        >
          <CloudBackupPanel userId={user.id} onLog={logAction} />
        </ModuleSectionCard>

        <ModuleSectionCard
          title="Sao lưu ra file"
          description="Xuất hoặc nhập file JSON — dùng khi cần copy sang máy khác"
        >
          <div className="p-6 flex flex-col sm:flex-row gap-3">
            <AccentButton module="cashflow" onClick={handleExport} disabled={exporting}>
              <Download className="h-4 w-4" />
              {exporting ? "Đang xuất..." : "Xuất file JSON"}
            </AccentButton>
            <label>
              <input type="file" accept=".json" className="hidden" onChange={handleImport} disabled={importing} />
              <Button variant="outline" className="cursor-pointer" asChild>
                <span>
                  <Upload className="h-4 w-4" />
                  {importing ? "Đang nhập..." : "Nhập từ file JSON"}
                </span>
              </Button>
            </label>
          </div>
          <p className="px-6 pb-4 text-xs text-zinc-600 flex items-center gap-1.5">
            <FileJson className="h-3.5 w-3.5" />
            Nhập file sẽ gộp thêm dữ liệu, không xóa dữ liệu hiện có
          </p>
        </ModuleSectionCard>

        <ModuleSectionCard
          title="Lịch sử hoạt động"
          description="Nhật ký đăng nhập, sao lưu và thao tác trên hệ thống"
        >
          <ActivityLogPanel userId={user.id} limit={150} />
        </ModuleSectionCard>

        <ModuleSectionCard title="Thông tin hệ thống">
          <div className="p-6 text-sm text-zinc-400 space-y-2">
            <p><strong className="text-zinc-300">Ứng dụng:</strong> LAP68 — Quản lý dòng tiền</p>
            <p><strong className="text-zinc-300">Phiên bản:</strong> 2.1.0</p>
            <p><strong className="text-zinc-300">Tài khoản:</strong> {user.displayName} ({user.username})</p>
            <p className="text-xs text-zinc-600 pt-2">
              Chỉ thao tác bảng lap68_* — không ảnh hưởng 3lmoto/79moto
            </p>
          </div>
        </ModuleSectionCard>
      </div>
    </ModulePageShell>
  )
}
