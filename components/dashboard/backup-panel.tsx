"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Cloud,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  HardDrive,
  Plus,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { SkeletonTable } from "@/components/ui/skeleton-loader";
import { Button } from "@/components/ui/button";
import {
  createCloudBackup,
  deleteCloudBackup,
  exportUserData,
  fetchCloudBackups,
  getCloudBackupSnapshot,
  type Lap68Backup,
} from "@/lib/supabase";
import { importUserDataFromBackup } from "@/lib/backup-import";
import { formatDisplayDateTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";

function formatBytes(n: number | null) {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function BackupPanel({
  userId,
  onLog,
}: {
  userId: string;
  onLog: (action: string, details: string) => void;
}) {
  const [backups, setBackups] = useState<Lap68Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setBackups(await fetchCloudBackups(userId));
    } catch {
      toast.error("Không tải được danh sách sao lưu");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCloudBackup = async () => {
    setCreating(true);
    try {
      await createCloudBackup(userId);
      onLog("Sao lưu trực tuyến", "Tạo bản snapshot trên cloud");
      toast.success("Đã tạo bản sao lưu trên cloud thành công");
      load();
    } catch {
      toast.error("Không thể tạo sao lưu");
    } finally {
      setCreating(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await exportUserData(userId);
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lap68-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      onLog("Xuất file", "Sao lưu JSON local");
      toast.success("Đã xuất tệp sao lưu JSON");
    } catch {
      toast.error("Không thể xuất dữ liệu");
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const data = JSON.parse(await file.text());
      const result = await importUserDataFromBackup(userId, data);
      onLog("Nhập file", `${file.name} — ${result.txCount} giao dịch`);
      toast.success(`Đã khôi phục thành công ${result.txCount} giao dịch`);
      load();
    } catch {
      toast.error("Tệp JSON không hợp lệ hoặc sai cấu trúc");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const handleRestore = async (backup: Lap68Backup) => {
    if (
      !confirm(
        `Khôi phục dữ liệu từ "${backup.label || "bản sao lưu"}"? Dữ liệu sẽ được đồng bộ và gộp thêm an toàn.`,
      )
    )
      return;
    setRestoringId(backup.id);
    try {
      const { snapshot, label } = await getCloudBackupSnapshot(backup.id);
      const result = await importUserDataFromBackup(userId, snapshot);
      onLog(
        "Khôi phục cloud",
        `${label || backup.id} — ${result.txCount} giao dịch`,
      );
      toast.success("Đã khôi phục dữ liệu từ đám mây thành công");
      load();
    } catch {
      toast.error("Không thể khôi phục dữ liệu");
    } finally {
      setRestoringId(null);
    }
  };

  const handleDownloadCloud = async (backup: Lap68Backup) => {
    try {
      const { snapshot } = await getCloudBackupSnapshot(backup.id);
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lap68-${backup.id.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Đã tải tệp JSON về máy");
    } catch {
      toast.error("Không thể tải tệp");
    }
  };

  const handleDelete = async (backup: Lap68Backup) => {
    if (!confirm(`Xóa bản sao lưu "${backup.label || "bản sao lưu"}"?`)) return;
    try {
      await deleteCloudBackup(backup.id);
      onLog("Xóa sao lưu", backup.label || backup.id);
      toast.success("Đã xóa bản sao lưu");
      load();
    } catch {
      toast.error("Không thể xóa bản sao lưu");
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* ACTION TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-foreground">
            Bản sao lưu ({backups.length})
          </span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40">
            Tự động lưu 60 ngày
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleCloudBackup}
            disabled={creating}
            className="rounded-xl text-xs gap-1.5 h-8.5 px-3.5 font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 shadow-xs"
          >
            <Cloud className={cn("h-3.5 w-3.5", creating && "animate-spin")} />
            {creating ? "Đang sao lưu..." : "Tạo bản sao lưu"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
            className="rounded-xl text-xs gap-1.5 h-8.5 px-3"
          >
            <Download className="h-3.5 w-3.5" />
            {exporting ? "Đang xuất..." : "Xuất JSON"}
          </Button>

          <label className="inline-flex">
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
              disabled={importing}
            />
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs gap-1.5 h-8.5 px-3 cursor-pointer"
              asChild
            >
              <span>
                <Upload className="h-3.5 w-3.5" />
                {importing ? "Đang nhập..." : "Nhập JSON"}
              </span>
            </Button>
          </label>
        </div>
      </div>

      {/* BACKUPS LIST */}
      {loading ? (
        <SkeletonTable />
      ) : backups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-10 text-center bg-card space-y-2">
          <HardDrive className="h-8 w-8 text-muted-foreground/40 mx-auto" />
          <p className="text-sm font-semibold text-foreground">
            Chưa có bản sao lưu nào trên đám mây
          </p>
          <p className="text-xs text-muted-foreground">
            Nhấn nút &quot;Tạo bản sao lưu&quot; để lưu trữ dữ liệu an toàn.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-900/50 text-muted-foreground font-semibold">
                  <th className="py-3 px-3.5 sm:px-4 w-14 text-center">STT</th>
                  <th className="py-3 px-3.5 sm:px-4">Tên bản sao lưu</th>
                  <th className="py-3 px-3.5 sm:px-4 w-44 whitespace-nowrap">Thời gian tạo</th>
                  <th className="py-3 px-3.5 sm:px-4 w-28 whitespace-nowrap">Kích thước</th>
                  <th className="py-3 px-3.5 sm:px-4 w-44 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {backups.map((b, idx) => (
                  <tr
                    key={b.id}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors"
                  >
                    {/* STT */}
                    <td className="py-3 px-3.5 sm:px-4 text-center font-mono font-medium text-muted-foreground/80">
                      #{String(idx + 1).padStart(2, "0")}
                    </td>

                    {/* TÊN */}
                    <td className="py-3 px-3.5 sm:px-4 font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <Cloud className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span className="truncate max-w-[200px] sm:max-w-xs">{b.label || "Bản sao lưu"}</span>
                      </div>
                    </td>

                    {/* THỜI GIAN */}
                    <td className="py-3 px-3.5 sm:px-4 whitespace-nowrap font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                      {formatDisplayDateTime(b.created_at)}
                    </td>

                    {/* KÍCH THƯỚC */}
                    <td className="py-3 px-3.5 sm:px-4 whitespace-nowrap font-mono text-[11px] text-zinc-500">
                      {formatBytes(b.file_size)}
                    </td>

                    {/* THAO TÁC */}
                    <td className="py-3 px-3.5 sm:px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7.5 text-[11px] font-medium gap-1 rounded-lg px-2.5"
                          onClick={() => handleRestore(b)}
                          disabled={restoringId === b.id}
                          title="Khôi phục dữ liệu"
                        >
                          <RotateCcw
                            className={cn(
                              "h-3 w-3",
                              restoringId === b.id && "animate-spin"
                            )}
                          />
                          Khôi phục
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7.5 text-[11px] font-medium gap-1 rounded-lg px-2 text-zinc-600 dark:text-zinc-400"
                          onClick={() => handleDownloadCloud(b)}
                          title="Tải về máy"
                        >
                          <Download className="h-3 w-3" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7.5 w-7.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400"
                          onClick={() => handleDelete(b)}
                          title="Xóa bản sao lưu"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
