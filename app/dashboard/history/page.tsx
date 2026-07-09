"use client"

import { useCallback, useEffect, useState } from "react"
import { ModulePageShell, ModuleSubpageHeader, ModuleSectionCard, ModuleResponsiveTable } from "@/components/dashboard/module-shell"
import { SkeletonTable } from "@/components/ui/skeleton-loader"
import { fetchAccessLogs, type AccessLog } from "@/lib/supabase"
import { formatDisplayDateTime } from "@/lib/format-date"
import { toast } from "sonner"

export default function HistoryPage() {
  const [logs, setLogs] = useState<AccessLog[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      setLogs(await fetchAccessLogs(200))
    } catch {
      toast.error("Không tải được lịch sử")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  return (
    <ModulePageShell module="cashflow">
      <ModuleSubpageHeader module="cashflow" title="Lịch sử hoạt động" subtitle="Nhật ký thao tác trên hệ thống" />

      <ModuleSectionCard title={`${logs.length} bản ghi`}>
        {loading ? (
          <div className="p-6"><SkeletonTable /></div>
        ) : (
          <ModuleResponsiveTable
            headers={["Thời gian", "Người dùng", "Hành động", "Chi tiết"]}
            rows={logs.map((l) => [
              formatDisplayDateTime(l.created_at),
              l.display_name || l.username || "—",
              l.action,
              l.details || "—",
            ])}
          />
        )}
      </ModuleSectionCard>
    </ModulePageShell>
  )
}
