"use client"

import { useCallback, useEffect, useState } from "react"
import { ModuleResponsiveTable } from "@/components/dashboard/module-shell"
import { SkeletonTable } from "@/components/ui/skeleton-loader"
import { fetchAccessLogs, type AccessLog } from "@/lib/supabase"
import { formatDisplayDateTime } from "@/lib/format-date"
import { toast } from "sonner"

export function ActivityLogPanel({ userId, limit = 100 }: { userId: string; limit?: number }) {
  const [logs, setLogs] = useState<AccessLog[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setLogs(await fetchAccessLogs(userId, limit))
    } catch {
      toast.error("Không tải được lịch sử")
    } finally {
      setLoading(false)
    }
  }, [userId, limit])

  useEffect(() => { load() }, [load])

  if (loading) {
    return <div className="p-4"><SkeletonTable /></div>
  }

  if (logs.length === 0) {
    return <p className="p-6 text-sm text-zinc-500 text-center">Chưa có hoạt động nào được ghi nhận</p>
  }

  return (
    <ModuleResponsiveTable
      headers={["Thời gian", "Hành động", "Chi tiết"]}
      rows={logs.map((l) => [
        <span key="t" className="text-zinc-400 text-xs whitespace-nowrap">{formatDisplayDateTime(l.created_at)}</span>,
        <span key="a" className="font-medium text-zinc-200">{l.action}</span>,
        <span key="d" className="text-zinc-500 truncate max-w-[200px] block">{l.details || "—"}</span>,
      ])}
    />
  )
}
