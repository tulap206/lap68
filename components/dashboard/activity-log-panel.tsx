"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { History, Clock, Shield } from "lucide-react";
import { TablePagination } from "@/components/dashboard/table-pagination";
import { SkeletonTable } from "@/components/ui/skeleton-loader";
import { fetchAccessLogs, type AccessLog } from "@/lib/supabase";
import { formatDisplayDateTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PAGE_SIZE = 12;
const FETCH_LIMIT = 500;

function getActionColor(action: string) {
  const act = action.toLowerCase();
  if (act.includes("xóa") || act.includes("xoá") || act.includes("hủy") || act.includes("huỷ")) {
    return "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-900/40";
  }
  if (act.includes("thêm") || act.includes("tạo") || act.includes("mới")) {
    return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/40";
  }
  if (act.includes("sửa") || act.includes("cập nhật") || act.includes("đổi") || act.includes("khôi phục")) {
    return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-900/40";
  }
  if (act.includes("sao lưu") || act.includes("xuất") || act.includes("nhập")) {
    return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-900/40";
  }
  if (act.includes("đăng nhập")) {
    return "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/60 dark:border-indigo-900/40";
  }
  if (act.includes("đăng xuất")) {
    return "text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700";
  }
  return "text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/80 border-zinc-200/60 dark:border-zinc-700/60";
}

export function ActivityLogPanel({ userId }: { userId: string }) {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    try {
      setLogs(await fetchAccessLogs(userId, FETCH_LIMIT));
      setPage(1);
    } catch {
      toast.error("Không tải được lịch sử thao tác");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
  const pageLogs = useMemo(
    () => logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [logs, page],
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <SkeletonTable />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-12 bg-card">
          <div className="text-center">
            <History className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">
              Chưa có lịch sử hoạt động
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Các thao tác thêm, sửa, xoá và đăng nhập trong 60 ngày sẽ được ghi nhận tại đây.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* HEADER STATS / INFO */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-foreground">
            Lịch sử hoạt động ({logs.length})
          </span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-muted-foreground border border-zinc-200/60 dark:border-zinc-700/60">
            Tự động lưu 60 ngày
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          Trang {page}/{totalPages}
        </span>
      </div>

      {/* TABLE */}
      <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-900/50 text-muted-foreground font-semibold">
                <th className="py-3 px-3.5 sm:px-4 w-14 text-center">STT</th>
                <th className="py-3 px-3.5 sm:px-4 w-44 whitespace-nowrap">Thời gian</th>
                <th className="py-3 px-3.5 sm:px-4 w-36 whitespace-nowrap">Hành động</th>
                <th className="py-3 px-3.5 sm:px-4">Chi tiết thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {pageLogs.map((l, idx) => {
                const itemIndex = (page - 1) * PAGE_SIZE + idx + 1;
                const actionBadgeClass = getActionColor(l.action);

                return (
                  <tr
                    key={l.id || `${l.created_at}-${idx}`}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors"
                  >
                    {/* STT */}
                    <td className="py-3 px-3.5 sm:px-4 text-center font-mono font-medium text-muted-foreground/80">
                      #{String(itemIndex).padStart(2, "0")}
                    </td>

                    {/* THỜI GIAN */}
                    <td className="py-3 px-3.5 sm:px-4 whitespace-nowrap font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                      {formatDisplayDateTime(l.created_at)}
                    </td>

                    {/* HÀNH ĐỘNG */}
                    <td className="py-3 px-3.5 sm:px-4 whitespace-nowrap">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border",
                          actionBadgeClass
                        )}
                      >
                        {l.action}
                      </span>
                    </td>

                    {/* CHI TIẾT */}
                    <td className="py-3 px-3.5 sm:px-4 text-foreground/90 font-medium leading-relaxed">
                      {l.details || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={logs.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
