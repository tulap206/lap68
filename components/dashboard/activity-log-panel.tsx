"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { History } from "lucide-react"
import { ModuleResponsiveTable } from "@/components/dashboard/module-shell"
import { TablePagination } from "@/components/dashboard/table-pagination"
import { SkeletonTable } from "@/components/ui/skeleton-loader"
import { fetchAccessLogs, type AccessLog } from "@/lib/supabase"
import { formatDisplayDateTime } from "@/lib/format-date"
import { toast } from "sonner"

const PAGE_SIZE = 10
const FETCH_LIMIT = 500

const panelBodyClass = "p-4 sm:p-5 flex flex-col flex-1 min-h-0 h-full"

export function ActivityLogPanel({ userId }: { userId: string }) {
  const [logs, setLogs] = useState<AccessLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    try {
      setLogs(await fetchAccessLogs(userId, FETCH_LIMIT))
      setPage(1)
    } catch {
      toast.error("Không tải được lịch sử")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { load() }, [load])

  const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE))
  const pageLogs = useMemo(
    () => logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [logs, page]
  )

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  if (loading) {
    return (
      <div className={panelBodyClass}>
        <SkeletonTable />
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className={panelBodyClass}>
        <div className="flex-1 flex items-center justify-center rounded-lg border border-dashed border-zinc-800 min-h-[200px]">
          <div className="text-center px-4">
            <History className="h-6 w-6 text-zinc-600 mx-auto mb-1.5" />
            <p className="text-xs text-zinc-500">Chưa có hoạt động nào được ghi nhận</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <ModuleResponsiveTable
          headers={["Thời gian", "Hành động", "Chi tiết"]}
          rows={pageLogs.map((l) => [
            <span key="t" className="text-zinc-400 text-xs whitespace-nowrap">{formatDisplayDateTime(l.created_at)}</span>,
            <span key="a" className="font-medium text-zinc-200 text-sm">{l.action}</span>,
            <span key="d" className="text-zinc-500 text-sm truncate block max-w-[140px] lg:max-w-[200px] xl:max-w-none">{l.details || "—"}</span>,
          ])}
        />
      </div>
      <TablePagination
        page={page}
        totalPages={totalPages}
        totalItems={logs.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  )
}
