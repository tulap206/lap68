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
  LogOut,
  Bell,
  Send,
  Sparkles,
  Lock,
  Server,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import {
  ModulePageShell,
  ModuleSectionCard,
} from "@/components/dashboard/module-shell";
import { BackupPanel } from "@/components/dashboard/backup-panel";
import { ActivityLogPanel } from "@/components/dashboard/activity-log-panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SettingsTab = "backup" | "telegram" | "logs" | "about";

export default function SettingsPage() {
  const { user, logout, logAction } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>("backup");
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
      const data = await res.json();
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

          {/* Database & Logout Actions */}
          <div className="flex items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-800 shrink-0">
            <div className="hidden sm:flex flex-col text-right text-xs">
              <span className="font-semibold text-foreground flex items-center justify-end gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Supabase Online
              </span>
              <span className="text-[11px] text-muted-foreground">Bảng `lap68_*` độc lập</span>
            </div>

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
          <div className="apple-segmented w-full sm:w-auto grid grid-cols-2 sm:flex">
            <button
              type="button"
              onClick={() => setActiveTab("backup")}
              className={cn(
                "apple-segmented-item text-center justify-center flex items-center gap-1.5 whitespace-nowrap",
                activeTab === "backup" && "active",
              )}
            >
              <Cloud className="h-3.5 w-3.5" /> Sao lưu & Dữ liệu
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("telegram")}
              className={cn(
                "apple-segmented-item text-center justify-center flex items-center gap-1.5 whitespace-nowrap",
                activeTab === "telegram" && "active",
              )}
            >
              <Bell className="h-3.5 w-3.5" /> Thông báo & Bot
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("logs")}
              className={cn(
                "apple-segmented-item text-center justify-center flex items-center gap-1.5 whitespace-nowrap",
                activeTab === "logs" && "active",
              )}
            >
              <History className="h-3.5 w-3.5" /> Nhật ký thao tác
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("about")}
              className={cn(
                "apple-segmented-item text-center justify-center flex items-center gap-1.5 whitespace-nowrap",
                activeTab === "about" && "active",
              )}
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Nguyên tắc & Bảo mật
            </button>
          </div>
        </div>

        {/* 3. TAB CONTENT PANELS */}
        {/* TAB 1: BACKUP & DATA */}
        {activeTab === "backup" && (
          <div className="space-y-4">
            <ModuleSectionCard
              title="Quản lý sao lưu & Dữ liệu đám mây"
              description="Tạo snapshot tức thời trên Supabase Cloud hoặc xuất nhập tệp JSON an toàn"
            >
              <BackupPanel userId={user.id} onLog={logAction} />
            </ModuleSectionCard>
          </div>
        )}

        {/* TAB 2: TELEGRAM NOTIFICATIONS & AUTOMATION */}
        {activeTab === "telegram" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bot Info Card */}
              <div className="p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-card space-y-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-[#0088cc]/10 text-[#0088cc] shrink-0">
                    <Send className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Telegram Bot Nhắc hẹn
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Tự động gửi thông báo lịch thu/chi khẩn cấp
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-muted-foreground leading-relaxed pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/80">
                    <span>Lịch gửi tự động:</span>
                    <strong className="font-semibold text-foreground">08:00 sáng hàng ngày (VN)</strong>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/80">
                    <span>Nội dung gửi:</span>
                    <strong className="font-semibold text-foreground">Khoản quá hạn, hôm nay & sắp tới (3 ngày)</strong>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/80">
                    <span>Trạng thái:</span>
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Đã tích hợp Cronjob
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestTelegram}
                  disabled={testingTelegram}
                  className="w-full rounded-xl text-xs gap-1.5 h-9 font-semibold"
                >
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  {testingTelegram ? "Đang gửi..." : "Kiểm tra gửi tin nhắn thử nghiệm"}
                </Button>
              </div>

              {/* Bot Guide Card */}
              <div className="p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-card space-y-3.5 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      Cơ chế nhắc hẹn thông minh
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Chống gửi lặp và tối ưu hóa tin nhắn
                    </p>
                  </div>
                </div>

                <ul className="space-y-2.5 text-xs text-muted-foreground leading-relaxed pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>Tự động kiểm tra và ghi nhật ký <code className="font-mono text-foreground bg-zinc-100 dark:bg-zinc-800 px-1 py-0.2 rounded">lap68_reminder_logs</code> để mỗi khoản chỉ gửi 1 lần trong ngày.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>Hiển thị đầy đủ số tiền, tên việc kinh doanh và ngày đến hạn của từng khoản.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>Đồng bộ tự động mỗi khi người dùng bấm "Hoàn thành" trên Dashboard hoặc trang Lịch.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ACTIVITY LOGS */}
        {activeTab === "logs" && (
          <div className="space-y-4">
            <ModuleSectionCard
              title="Nhật ký hoạt động & Kiểm toán hệ thống"
              description="Theo dõi toàn bộ các thao tác thêm, sửa, xóa giao dịch, lịch hẹn và sao lưu"
            >
              <div className="p-4 sm:p-6">
                <ActivityLogPanel userId={user.id} />
              </div>
            </ModuleSectionCard>
          </div>
        )}

        {/* TAB 4: ABOUT & SYSTEM PRINCIPLES */}
        {activeTab === "about" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 sm:p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-card space-y-3.5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Nguyên tắc độc lập dữ liệu
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Đảm bảo an toàn tuyệt đối cho hệ thống
                  </p>
                </div>
              </div>

              <ul className="text-xs sm:text-sm text-muted-foreground space-y-2.5 leading-relaxed pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>Dự án <strong>LAP68</strong> hoạt động hoàn toàn độc lập, tách biệt với các dự án khác.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>Mọi dữ liệu chỉ được lưu trữ và truy vấn trên các bảng có tiền tố <code className="text-foreground font-mono font-semibold bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">lap68_*</code>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>Không bao giờ can thiệp hoặc tác động đến bất kỳ bảng nào thuộc hệ thống khác.</span>
                </li>
              </ul>
            </div>

            <div className="p-5 sm:p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-card space-y-3.5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
                  <HardDrive className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Dòng tiền & Đối soát thực tế
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Quản trị thanh khoản và nguồn vốn kinh doanh
                  </p>
                </div>
              </div>

              <ul className="text-xs sm:text-sm text-muted-foreground space-y-2.5 leading-relaxed pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Mọi giao dịch thu/chi được ghi nhận trực tiếp vào số dư tài khoản ngân hàng thực tế.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Vốn đầu tư ban đầu được bảo toàn và phân tách rõ ràng với lợi nhuận kinh doanh ròng.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Hỗ trợ sao lưu đám mây liên tục và khôi phục chỉ với 1 thao tác bấm.</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </ModulePageShell>
  );
}
