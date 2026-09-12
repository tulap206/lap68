"use client";

import { useState } from "react";
import {
  User,
  ShieldCheck,
  Database,
  Cloud,
  History,
  HardDrive,
  Info,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import {
  ModulePageShell,
  ModuleSubpageHeader,
  ModuleSectionCard,
} from "@/components/dashboard/module-shell";
import { BackupPanel } from "@/components/dashboard/backup-panel";
import { ActivityLogPanel } from "@/components/dashboard/activity-log-panel";
import { cn } from "@/lib/utils";

type SettingsTab = "backup" | "logs" | "about";

export default function SettingsPage() {
  const { user, logAction } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("backup");

  if (!user) return null;

  return (
    <ModulePageShell module="cashflow">
      <div className="space-y-6 w-full">
        <ModuleSubpageHeader
          module="cashflow"
          title="Cài đặt hệ thống & Dữ liệu"
          subtitle="Quản lý sao lưu đám mây, nhật ký thao tác và bảo mật tài khoản"
        />

        {/* PROFILE & STATUS HEADER CARD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Profile Card */}
          <div className="md:col-span-2 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
                    {user.displayName}
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 uppercase tracking-wider">
                    {user.role}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tài khoản: <strong className="font-mono text-foreground/80">{user.username}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-100 dark:border-zinc-800">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" /> Đã xác thực
              </span>
              <span>•</span>
              <span>LAP68 Pro v2.2</span>
            </div>
          </div>

          {/* Cloud Database Status */}
          <div className="p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Đám mây Supabase
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Trực tuyến
              </span>
            </div>
            <div className="my-2">
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Bảng độc lập `lap68_*`
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tự động đồng bộ hóa & đối soát thời gian thực
              </p>
            </div>
          </div>
        </div>

        {/* TAB SWITCHER */}
        <div className="flex items-center gap-1 p-1 bg-zinc-200/60 dark:bg-zinc-800/70 backdrop-blur-md rounded-2xl border border-black/[0.04] dark:border-white/[0.06] w-fit overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("backup")}
            className={cn(
              "px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap active:scale-[0.98]",
              activeTab === "backup"
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100",
            )}
          >
            <Cloud className="h-4 w-4" /> Sao lưu & Phục hồi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("logs")}
            className={cn(
              "px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap active:scale-[0.98]",
              activeTab === "logs"
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100",
            )}
          >
            <History className="h-4 w-4" /> Lịch sử thao tác
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("about")}
            className={cn(
              "px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap active:scale-[0.98]",
              activeTab === "about"
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100",
            )}
          >
            <ShieldCheck className="h-4 w-4" /> An toàn & Nguyên tắc
          </button>
        </div>

        {/* TAB PANELS */}
        {activeTab === "backup" && (
          <div className="space-y-4">
            <ModuleSectionCard
              title="Sao lưu & Khôi phục dữ liệu"
              description="Tạo bản sao lưu đám mây snapshot hoặc xuất/nhập tệp JSON an toàn"
            >
              <BackupPanel userId={user.id} onLog={logAction} />
            </ModuleSectionCard>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="space-y-4">
            <ModuleSectionCard
              title="Nhật ký hoạt động hệ thống"
              description="Ghi nhận các thao tác thêm, sửa, xóa giao dịch và sao lưu"
            >
              <ActivityLogPanel userId={user.id} />
            </ModuleSectionCard>
          </div>
        )}

        {activeTab === "about" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card space-y-3 shadow-xs">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Nguyên tắc độc lập dữ liệu
              </h3>
              <ul className="text-xs sm:text-sm text-muted-foreground space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  Dự án <strong>LAP68</strong> hoạt động hoàn toàn độc lập với các hệ thống khác.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  Mọi dữ liệu chỉ được lưu trữ trên các bảng có tiền tố <code className="text-foreground font-mono font-semibold bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">lap68_*</code>.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  Không can thiệp hoặc sửa đổi bất kỳ bảng nào thuộc hệ thống khác.
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card space-y-3 shadow-xs">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Đối soát & Dòng tiền thực
              </h3>
              <ul className="text-xs sm:text-sm text-muted-foreground space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  Mọi giao dịch thu/chi được ghi nhận trực tiếp vào số dư tài khoản ngân hàng thực tế.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  Vốn đầu tư ban đầu được quản lý cố định, lãi/lỗ kinh doanh được cộng dồn vào Vốn ròng khả dụng.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </ModulePageShell>
  );
}

