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
          <div className="md:col-span-2 p-5 rounded-2xl border border-border bg-card shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shrink-0 shadow-sm">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
                    {user.displayName}
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-income/15 text-income border border-income/20 uppercase tracking-wider">
                    {user.role}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tài khoản: <strong className="font-mono text-foreground/80">{user.username}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground border-t sm:border-t-0 pt-2 sm:pt-0 border-border">
              <span className="flex items-center gap-1 text-income font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" /> Đã xác thực
              </span>
              <span>•</span>
              <span>LAP68 v2.1</span>
            </div>
          </div>

          {/* Cloud Database Status */}
          <div className="p-5 rounded-2xl border border-border bg-card shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Đám mây Supabase
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-income">
                <span className="w-2 h-2 rounded-full bg-income animate-pulse" /> Trực tuyến
              </span>
            </div>
            <div className="my-2">
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Database className="h-4 w-4 text-income" /> Bảng độc lập `lap68_*`
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tự động đồng bộ hóa & đối soát thời gian thực
              </p>
            </div>
          </div>
        </div>

        {/* TAB SWITCHER */}
        <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("backup")}
            className={cn(
              "px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === "backup"
                ? "bg-card text-foreground shadow-sm border border-border font-bold text-income"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Cloud className="h-4 w-4" /> Sao lưu & Phục hồi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("logs")}
            className={cn(
              "px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === "logs"
                ? "bg-card text-foreground shadow-sm border border-border font-bold text-income"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <History className="h-4 w-4" /> Lịch sử thao tác
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("about")}
            className={cn(
              "px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === "about"
                ? "bg-card text-foreground shadow-sm border border-border font-bold text-income"
                : "text-muted-foreground hover:text-foreground",
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
            <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-income" /> Nguyên tắc độc lập dữ liệu
              </h3>
              <ul className="text-xs sm:text-sm text-muted-foreground space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-income font-bold">•</span>
                  Dự án <strong>LAP68</strong> hoạt động hoàn toàn độc lập với các hệ thống khác.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-income font-bold">•</span>
                  Mọi dữ liệu chỉ được lưu trữ trên các bảng có tiền tố <code className="text-foreground font-mono font-semibold bg-muted px-1.5 py-0.5 rounded">lap68_*</code>.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-income font-bold">•</span>
                  Không can thiệp hoặc sửa đổi bất kỳ bảng nào thuộc hệ thống khác.
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-income" /> Đối soát & Dòng tiền thực
              </h3>
              <ul className="text-xs sm:text-sm text-muted-foreground space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-income font-bold">•</span>
                  Mọi giao dịch thu/chi được ghi nhận trực tiếp vào số dư tài khoản ngân hàng thực tế.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-income font-bold">•</span>
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
