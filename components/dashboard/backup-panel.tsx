"use client"

import { useCallback, useEffect, useState } from "react"
import { Cloud, Download, Upload, RotateCcw, Trash2, HardDrive } from "lucide-react"
import { toast } from "sonner"
import { AccentButton } from "@/components/dashboard/module-shell"
import { SkeletonTable } from "@/components/ui/skeleton-loader"
import { Button } from "@/components/ui/button"
import {
  createCloudBackup,
  deleteCloudBackup,
  exportUserData,
  fetchCloudBackups,
  getCloudBackupSnapshot,
  type Lap68Backup,
} from "@/lib/supabase"
import { importUserDataFromBackup } from "@/lib/backup-import"
import { formatDisplayDateTime } from "@/lib/format-date"
import { cn } from "@/lib/utils"

function formatBytes(n: number | null) {
  if (!n) return "—"
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export function BackupPanel({
  userId,
  onLog,
}: {
  userId: string
  onLog: (action: string, details: string) => void
}) {
  const [backups, setBackups] = useState<Lap68Backup[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
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

  const handleCloudBackup = async () => {
    setCreating(true)
    try {
      await createCloudBackup(userId)
      onLog("Sao lưu trực tuyến", "Tạo bản snapshot trên cloud")
      toast.success("Đã lưu lên cloud")
      load()
    } catch {
      toast.error("Không thể tạo sao lưu")
    } finally {
      setCreating(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const data = await exportUserData(userId)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `lap68-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      onLog("Xuất file", "Sao lưu JSON local")
      toast.success("Đã xuất file")
    } catch {
      toast.error("Không thể xuất dữ liệu")
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const data = JSON.parse(await file.text())
      const result = await importUserDataFromBackup(userId, data)
      onLog("Nhập file", `${file.name} — ${result.txCount} giao dịch`)
      toast.success("Đã nhập từ file")
    } catch {
      toast.error("File không hợp lệ")
    } finally {
      setImporting(false)
      e.target.value = ""
    }
  }

  const handleRestore = async (backup: Lap68Backup) => {
    if (!confirm(`Khôi phục từ "${backup.label || "bản sao lưu"}"? Dữ liệu sẽ được gộp thêm.`)) return
    setRestoringId(backup.id)
    try {
      const { snapshot, label } = await getCloudBackupSnapshot(backup.id)
      const result = await importUserDataFromBackup(userId, snapshot)
      onLog("Khôi phục cloud", `${label || backup.id} — ${result.txCount} giao dịch`)
      toast.success("Đã khôi phục")
    } catch {
      toast.error("Không thể khôi phục")
    } finally {
      setRestoringId(null)
    }
  }

  const handleDownloadCloud = async (backup: Lap68Backup) => {
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
    if (!confirm(`Xóa "${backup.label || "bản sao lưu"}"?`)) return
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
    <div className="p-4 sm:p-5 flex flex-col flex-1 min-h-0 h-full gap-4">
      <div className="space-y-3 shrink-0">
        <AccentButton module="cashflow" onClick={handleCloudBackup} disabled={creating} className="w-full sm:w-auto">
          <Cloud className="h-4 w-4" />
          {creating ? "Đang lưu..." : "Lưu trực tuyến"}
        </AccentButton>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting} className="w-full">
            <Download className="h-3.5 w-3.5" />
            {exporting ? "Đang xuất..." : "Xuất file"}
          </Button>
          <label className="min-w-0">
            <input type="file" accept=".json" className="hidden" onChange={handleImport} disabled={importing} />
            <Button variant="outline" size="sm" className="w-full cursor-pointer" asChild>
              <span>
                <Upload className="h-3.5 w-3.5" />
                {importing ? "Đang nhập..." : "Nhập file"}
              </span>
            </Button>
          </label>
        </div>
        <p className="text-[11px] text-zinc-600 leading-relaxed">
          Cloud lưu tối đa 15 bản trên Supabase · File JSON dùng khi chuyển máy · Khôi phục/nhập gộp thêm, không xóa dữ liệu hiện có
        </p>
      </div>

      <div className="border-t border-zinc-800/80 pt-3 flex flex-col flex-1 min-h-0">
        <p className="text-xs font-semibold text-zinc-500 mb-2 shrink-0">Bản sao lưu cloud</p>
        {loading ? (
          <SkeletonTable />
        ) : backups.length === 0 ? (
          <div className="flex-1 flex items-center justify-center rounded-lg border border-dashed border-zinc-800 min-h-[200px]">
            <div className="text-center px-4">
              <HardDrive className="h-6 w-6 text-zinc-600 mx-auto mb-1.5" />
              <p className="text-xs text-zinc-500">Chưa có bản cloud — nhấn &quot;Lưu trực tuyến&quot;</p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-800/80 rounded-lg border border-zinc-800/80 overflow-hidden overflow-y-auto flex-1 min-h-0 max-h-[340px]">
            {backups.map((b) => (
              <li
                key={b.id}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-900/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-200 truncate">{b.label || "Sao lưu"}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {formatDisplayDateTime(b.created_at)} · {formatBytes(b.file_size)}
                  </p>
                </div>
                <div className="flex gap-0.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Khôi phục"
                    disabled={restoringId === b.id}
                    onClick={() => handleRestore(b)}
                  >
                    <RotateCcw className={cn("h-3.5 w-3.5", restoringId === b.id && "animate-spin")} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Tải JSON" onClick={() => handleDownloadCloud(b)}>
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400/80 hover:text-red-400" title="Xóa" onClick={() => handleDelete(b)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
