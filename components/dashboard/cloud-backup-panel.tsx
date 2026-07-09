"use client"

import { useCallback, useEffect, useState } from "react"
import { Cloud, Download, RotateCcw, Trash2, HardDrive } from "lucide-react"
import { toast } from "sonner"
import { AccentButton, ModuleResponsiveTable } from "@/components/dashboard/module-shell"
import { SkeletonTable } from "@/components/ui/skeleton-loader"
import { Button } from "@/components/ui/button"
import {
  createCloudBackup,
  deleteCloudBackup,
  fetchCloudBackups,
  getCloudBackupSnapshot,
  type Lap68Backup,
} from "@/lib/supabase"
import { importUserDataFromBackup } from "@/lib/backup-import"
import { formatDisplayDateTime } from "@/lib/format-date"

function formatBytes(n: number | null) {
  if (!n) return "—"
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export function CloudBackupPanel({
  userId,
  onRestore,
  onLog,
}: {
  userId: string
  onRestore?: () => void
  onLog: (action: string, details: string) => void
}) {
  const [backups, setBackups] = useState<Lap68Backup[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setBackups(await fetchCloudBackups(userId))
    } catch {
      toast.error("Không tải được danh sách sao lưu")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    setCreating(true)
    try {
      await createCloudBackup(userId)
      onLog("Sao lưu trực tuyến", "Tạo bản snapshot mới trên cloud")
      toast.success("Đã lưu sao lưu trực tuyến")
      load()
    } catch {
      toast.error("Không thể tạo sao lưu")
    } finally {
      setCreating(false)
    }
  }

  const handleRestore = async (backup: Lap68Backup) => {
    if (!confirm(`Khôi phục dữ liệu từ "${backup.label || "bản sao lưu"}"? Dữ liệu mới sẽ được gộp thêm, không xóa dữ liệu hiện có.`)) return
    setRestoringId(backup.id)
    try {
      const { snapshot, label } = await getCloudBackupSnapshot(backup.id)
      const result = await importUserDataFromBackup(userId, snapshot)
      onLog("Khôi phục cloud", `${label || backup.id} — ${result.txCount} giao dịch`)
      toast.success("Đã khôi phục từ sao lưu trực tuyến")
      onRestore?.()
    } catch {
      toast.error("Không thể khôi phục")
    } finally {
      setRestoringId(null)
    }
  }

  const handleDownload = async (backup: Lap68Backup) => {
    try {
      const { snapshot } = await getCloudBackupSnapshot(backup.id)
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `lap68-${backup.id.slice(0, 8)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error("Không thể tải file")
    }
  }

  const handleDelete = async (backup: Lap68Backup) => {
    if (!confirm(`Xóa bản sao lưu "${backup.label || ""}"?`)) return
    try {
      await deleteCloudBackup(backup.id)
      onLog("Xóa sao lưu", backup.label || backup.id)
      toast.success("Đã xóa")
      load()
    } catch {
      toast.error("Không thể xóa")
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          Lưu snapshot dữ liệu lên Supabase — tối đa 15 bản gần nhất
        </p>
        <AccentButton module="cashflow" onClick={handleCreate} disabled={creating}>
          <Cloud className="h-4 w-4" />
          {creating ? "Đang lưu..." : "Tạo sao lưu ngay"}
        </AccentButton>
      </div>

      {loading ? (
        <SkeletonTable />
      ) : backups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-700 py-10 text-center">
          <HardDrive className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">Chưa có bản sao lưu trực tuyến</p>
          <p className="text-xs text-zinc-600 mt-1">Nhấn &quot;Tạo sao lưu ngay&quot; để lưu dữ liệu lên cloud</p>
        </div>
      ) : (
        <ModuleResponsiveTable
          headers={["Thời gian", "Nhãn", "Dung lượng", ""]}
          rows={backups.map((b) => [
            <span key="t" className="text-xs text-zinc-400">{formatDisplayDateTime(b.created_at)}</span>,
            <span key="l" className="text-sm text-zinc-200">{b.label || "Sao lưu"}</span>,
            <span key="s" className="text-xs font-mono text-zinc-500">{formatBytes(b.file_size)}</span>,
            <div key="a" className="flex gap-1 justify-end">
              <Button
                variant="ghost"
                size="icon"
                title="Khôi phục"
                disabled={restoringId === b.id}
                onClick={() => handleRestore(b)}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" title="Tải JSON" onClick={() => handleDownload(b)}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" title="Xóa" className="text-red-400" onClick={() => handleDelete(b)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>,
          ])}
        />
      )}
    </div>
  )
}
