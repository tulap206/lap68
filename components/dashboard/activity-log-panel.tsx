"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ModuleResponsiveTable } from "@/components/dashboard/module-shell"
import { TablePagination } from "@/components/dashboard/table-pagination"
import { SkeletonTable } from "@/components/ui/skeleton-loader"
import { fetchAccessLogs, type AccessLog } from "@/lib/supabase"
import { formatDisplayDateTime } from "@/lib/format-date"
import { toast } from "sonner"

const PAGE_SIZE = 10
const FETCH_LIMIT = 500

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
    return <div className="p-4"><SkeletonTable /></div>
  }

  if (logs.length === 0) {
    return <p className="p-6 text-sm text-zinc-500 text-center">Chưa có hoạt động nào được ghi nhận</p>
  }

  return (
    <div>
      <ModuleResponsiveTable
        headers={["Thời gian", "Hành động", "Chi tiết"]}
        rows={pageLogs.map((l) => [
          <span key="t" className="text-zinc-400 text-xs whitespace-nowrap">{formatDisplayDateTime(l.created_at)}</span>,
          <span key="a" className="font-medium text-zinc-200 text-sm">{l.action}</span>,
          <span key="d" className="text-zinc-500 text-sm truncate max-w-[220px] block">{l.details || "—"}</span>,
        ])}
      />
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
