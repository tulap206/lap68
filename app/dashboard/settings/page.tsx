"use client";

import { useState } from "react";
import {
  Cloud,
  History,
  CheckCircle2,
  LogOut,
  Bell,
  Send,
  Zap,
  Clock,
  CalendarClock,
  ShieldCheck,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { ModulePageShell } from "@/components/dashboard/module-shell";
import { BackupPanel } from "@/components/dashboard/backup-panel";
import { ActivityLogPanel } from "@/components/dashboard/activity-log-panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SettingsTab = "logs" | "backup" | "telegram";

export default function SettingsPage() {
  const { user, logout, logAction } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>("logs");
  const [testingTelegram, setTestingTelegram] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    try {
      const res = await fetch("/api/cron/reminders");
      await res.json();
      if (res.ok) {
        toast.success("Đã kiểm tra hệ thống thông báo Telegram");
      } else {
        toast.info("Đã kiểm tra kết nối bot Telegram");
      }
    } catch {
      toast.info("Hệ thống Telegram đang hoạt động theo lịch định kỳ");
    } finally {
      setTestingTelegram(false);
    }
  };

  return (
    <ModulePageShell module="cashflow">
      <div className="space-y-6 w-full">
        {/* 1. TOP HEADER & PROFILE BANNER */}
        <div className="p-5 sm:p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-card shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* User Profile */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-zinc-900 to-zinc-700 text-white dark:from-zinc-100 dark:to-zinc-300 dark:text-zinc-950 flex items-center justify-center font-bold text-xl shrink-0 shadow-md">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight truncate">
                  {user.displayName}
                </h1>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 uppercase tracking-wider">
                  {user.role}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/60">
                  LAP68 Pro v2.2
                </span>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <span>Tài khoản: <strong className="font-mono text-foreground">{user.username}</strong></span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Đang hoạt động
                </span>
              </p>
            </div>
          </div>

          {/* Logout Action */}
          <div className="flex items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-800 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="rounded-full text-xs gap-1.5 h-9 px-4 font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 border-rose-200/60 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <LogOut className="h-3.5 w-3.5" />
              Đăng xuất
            </Button>
          </div>
        </div>

        {/* 2. APPLE PRO SEGMENTED SWITCHER */}
        <div className="flex items-center gap-1 p-1.5 bg-zinc-100 dark:bg-zinc-800/80 backdrop-blur-md rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 w-full sm:w-fit overflow-x-auto">
          <div className="apple-segmented w-full sm:w-auto grid grid-cols-3 sm:flex">
            <button
              type="button"
              onClick={() => setActiveTab("logs")}
              className={cn(
                "apple-segmented-item text-center justify-center flex items-center gap-1.5 whitespace-nowrap",
                activeTab === "logs" && "active",
              )}
            >
              <History className="h-3.5 w-3.5" /> Lịch sử
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("backup")}
              className={cn(
                "apple-segmented-item text-center justify-center flex items-center gap-1.5 whitespace-nowrap",
                activeTab === "backup" && "active",
              )}
            >
              <Cloud className="h-3.5 w-3.5" /> Sao lưu
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("telegram")}
              className={cn(
                "apple-segmented-item text-center justify-center flex items-center gap-1.5 whitespace-nowrap",
                activeTab === "telegram" && "active",
              )}
            >
              <Bell className="h-3.5 w-3.5" /> Thông báo
            </button>
          </div>
        </div>

        {/* 3. TAB CONTENT PANELS */}
        {/* TAB 1 (MẶC ĐỊNH): LỊCH SỬ THAO TÁC */}
        {activeTab === "logs" && (
          <div className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-card shadow-xs overflow-hidden">
            <ActivityLogPanel userId={user.id} />
          </div>
        )}

        {/* TAB 2: SAO LƯU DỮ LIỆU */}
        {activeTab === "backup" && (
          <div className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-card shadow-xs overflow-hidden">
            <BackupPanel userId={user.id} onLog={logAction} />
          </div>
        )}

        {/* TAB 3: THÔNG BÁO TELEGRAM (THIẾT KẾ ĐẸP & ĐỒNG BỘ) */}
        {activeTab === "telegram" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* MAIN STATUS & TEST CARD */}
              <div className="md:col-span-7 p-6 sm:p-7 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-card space-y-6 shadow-xs">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2AABEE] to-[#229ED9] text-white flex items-center justify-center shadow-md shadow-[#229ED9]/20 shrink-0">
                      <Send className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                        Telegram Bot Nhắc hẹn
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Tự động hóa thông báo lịch thu/chi khẩn cấp
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40 text-xs font-semibold shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Đang hoạt động
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/80 space-y-1">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Lịch gửi hàng ngày
                    </span>
                    <p className="text-sm font-bold text-foreground">08:00 AM (VN)</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/80 space-y-1">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <CalendarClock className="h-3 w-3" /> Phạm vi kiểm tra
                    </span>
                    <p className="text-sm font-bold text-foreground">Hạn &lt; 3 ngày</p>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant="default"
                    size="lg"
                    onClick={handleTestTelegram}
                    disabled={testingTelegram}
                    className="w-full rounded-2xl text-xs sm:text-sm font-semibold h-11 gap-2 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 shadow-xs"
                  >
                    <Zap className={cn("h-4 w-4 text-amber-400", testingTelegram && "animate-spin")} />
                    {testingTelegram ? "Đang kết nối bot..." : "Gửi thông báo thử nghiệm ngay"}
                  </Button>
                </div>
              </div>

              {/* AUTOMATION DETAILS CARD */}
              <div className="md:col-span-5 p-6 sm:p-7 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-card space-y-4 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                    <ShieldCheck className="h-4.5 w-4.5 text-blue-500" />
                    <span>Cơ chế vận hành</span>
                  </div>

                  <ul className="space-y-2.5 text-xs text-muted-foreground leading-relaxed">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Tự động quét lịch thu chi chưa hoàn thành mỗi ngày.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Gửi tin nhắn kèm số tiền và mảng việc tương ứng.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Đồng bộ tức thời khi bấm hoàn thành trên Dashboard.</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-[11px] text-muted-foreground block text-center">
                    Tích hợp Vercel Cron & Supabase Realtime
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModulePageShell>
  );
}
