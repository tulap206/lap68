"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Cloud,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  HardDrive,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { AccentButton } from "@/components/dashboard/module-shell";
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
    <div className="p-4 sm:p-6 space-y-6">
      {/* ACTION HERO BANNER */}
      <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-foreground">
              Sao lưu & Xuất nhập dữ liệu an toàn
            </h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/60">
              Supabase Cloud
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Hệ thống lưu trữ tối đa 15 bản snapshot trên Cloud. Có thể tải tệp JSON về máy để chuyển dữ liệu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="default"
            size="sm"
            onClick={handleCloudBackup}
            disabled={creating}
            className="rounded-full text-xs gap-1.5 h-9 px-4 font-semibold shadow-xs"
          >
            <Cloud className={cn("h-4 w-4", creating && "animate-spin")} />
            {creating ? "Đang lưu..." : "Sao lưu ngay"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
            className="rounded-full text-xs gap-1.5 h-9 px-3.5"
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
              className="rounded-full text-xs gap-1.5 h-9 px-3.5 cursor-pointer"
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
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-foreground/70" /> Danh sách bản sao lưu đám mây ({backups.length})
          </h4>
          <span className="text-xs text-muted-foreground">
            Tối đa 15 bản gần nhất
          </span>
        </div>

        {loading ? (
          <SkeletonTable />
        ) : backups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center bg-card space-y-2">
            <HardDrive className="h-8 w-8 text-muted-foreground/40 mx-auto" />
            <p className="text-sm font-semibold text-foreground">
              Chưa có bản sao lưu nào trên đám mây
            </p>
            <p className="text-xs text-muted-foreground">
              Nhấn nút &quot;Sao lưu ngay&quot; để tạo bản snapshot đầu tiên của bạn.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800 shadow-xs">
            {backups.map((b) => (
              <div
                key={b.id}
                className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                    <Cloud className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {b.label || "Bản sao lưu tự động"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatDisplayDateTime(b.created_at)}</span>
                      <span>•</span>
                      <span className="font-mono">{formatBytes(b.file_size)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1 rounded-lg px-2.5"
                    onClick={() => handleRestore(b)}
                    disabled={restoringId === b.id}
                    title="Khôi phục dữ liệu từ bản này"
                  >
                    <RotateCcw
                      className={cn(
                        "h-3.5 w-3.5",
                        restoringId === b.id && "animate-spin",
                      )}
                    />
                    Khôi phục
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs gap-1 rounded-lg px-2.5 text-zinc-600 dark:text-zinc-400"
                    onClick={() => handleDownloadCloud(b)}
                    title="Tải tệp JSON về máy"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Tải về
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400"
                    onClick={() => handleDelete(b)}
                    title="Xóa bản sao lưu"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
