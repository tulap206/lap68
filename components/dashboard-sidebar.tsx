"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bell,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  Wallet,
  ArrowLeftRight,
  Tags,
  CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const globalItems = [
  { title: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
  { title: "Nhắc hẹn", href: "/dashboard/reminders", icon: Bell },
  { title: "Lịch", href: "/dashboard/calendar", icon: Calendar },
  { title: "Cài đặt", href: "/dashboard/settings", icon: Settings },
];

function businessSubItems(businessId: string) {
  const base = `/dashboard/b/${businessId}`;
  return [
    { title: "Tổng quan", href: base, icon: LayoutDashboard },
    { title: "Giao dịch", href: `${base}/transactions`, icon: ArrowLeftRight },
    { title: "Danh mục", href: `${base}/categories`, icon: Tags },
    { title: "Lịch thu/chi", href: `${base}/schedules`, icon: CalendarClock },
  ];
}

export function DashboardSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const businessMatch = pathname.match(/^\/dashboard\/b\/([^/]+)/);
  const businessId = businessMatch?.[1];
  const menuItems = businessId ? businessSubItems(businessId) : globalItems;

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const NavContent = ({ labeled }: { labeled: boolean }) => (
    <>
      {!labeled && (
        <div className="hidden lg:block w-full h-3 mb-4 shrink-0" aria-hidden />
      )}

      <Link
        href="/dashboard"
        onClick={() => setMobileOpen(false)}
        className={cn(
          "relative flex items-center rounded-2xl bg-gradient-to-br from-[#007aff] to-[#0055b3] text-white shrink-0 shadow-[0_4px_12px_rgba(0,122,255,0.3)] transition-transform active:scale-[0.95]",
          labeled
            ? "h-11 w-full gap-3 px-3.5 mb-6"
            : "h-11 w-11 justify-center mb-6 lg:mb-8",
        )}
        title="LAP68"
      >
        <Wallet className="h-5 w-5 shrink-0" />
        {labeled && (
          <span className="text-sm font-bold tracking-tight">
            LAP<span className="opacity-80">68</span>
          </span>
        )}
      </Link>

      {businessId && (
        <Link
          href="/dashboard"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "mb-3 flex items-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-xs font-medium shrink-0 transition-colors",
            labeled ? "h-9 w-full gap-2 px-3" : "h-8 w-11 justify-center",
          )}
          title="Về hub"
        >
          ← {labeled && <span>Về tổng quan</span>}
        </Link>
      )}

      <nav
        className={cn(
          "flex flex-col gap-1.5 flex-1 w-full",
          !labeled && "items-center gap-2 lg:mt-1",
        )}
      >
        {menuItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== `/dashboard/b/${businessId}` &&
              pathname.startsWith(item.href + "/"));
          const isExactBusinessHome =
            item.href === `/dashboard/b/${businessId}` &&
            pathname === item.href;
          const isActive =
            businessId && item.href === `/dashboard/b/${businessId}`
              ? isExactBusinessHome
              : active;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group relative flex items-center rounded-xl transition-all duration-200 active:scale-[0.97]",
                labeled ? "h-10 w-full gap-3 px-3.5" : "h-11 w-11 justify-center",
                isActive
                  ? "bg-[#007aff]/10 text-[#007aff] font-semibold dark:bg-[#0a84ff]/20 dark:text-[#0a84ff]"
                  : "text-muted-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-foreground",
              )}
              title={item.title}
            >
              <Icon
                className={cn(
                  "h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:scale-105",
                  isActive && "text-[#007aff] dark:text-[#0a84ff]",
                )}
              />
              {labeled ? (
                <span className="text-sm tracking-tight truncate">
                  {item.title}
                </span>
              ) : (
                <span className="absolute left-full ml-3 hidden group-hover:block whitespace-nowrap rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-card/95 backdrop-blur-xl px-3 py-1.5 text-xs font-semibold text-foreground z-50 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                  {item.title}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className={cn(
          "flex items-center rounded-xl text-muted-foreground hover:bg-[#ff3b30]/10 hover:text-[#ff3b30] transition-all shrink-0 active:scale-[0.96]",
          labeled
            ? "h-10 w-full gap-3 px-3.5 mt-2"
            : "h-11 w-11 justify-center lg:mt-3",
        )}
        title="Đăng xuất"
      >
        <LogOut className="h-4.5 w-4.5 shrink-0" />
        {labeled && <span className="text-sm font-medium">Đăng xuất</span>}
      </button>
    </>
  );

  return (
    <div className="min-h-dvh bg-background">
      {/* MOBILE TOP BAR */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 safe-top bg-card/85 backdrop-blur-2xl border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#007aff] to-[#0055b3] text-white shadow-sm">
            <Wallet className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="text-foreground font-bold tracking-tight block text-sm">
              LAP68
            </span>
            {user && (
              <span className="text-[10px] text-muted-foreground truncate block max-w-[140px]">
                {user.displayName}
              </span>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="shrink-0 rounded-full h-8.5 w-8.5"
          aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </header>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/30 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* MACOS TRANSLUCENT SIDEBAR */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-dvh bg-sidebar/85 backdrop-blur-2xl border-r border-black/[0.06] dark:border-white/[0.08] flex flex-col transition-transform duration-300 ease-out",
          "w-[min(280px,85vw)] px-3.5 py-6 safe-top safe-bottom",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:w-[76px] lg:items-center lg:px-0 lg:pt-7 lg:pb-7",
        )}
      >
        <div className="lg:hidden flex flex-col flex-1 min-h-0 w-full">
          <NavContent labeled />
        </div>
        <div className="hidden lg:flex flex-col flex-1 items-center w-full">
          <NavContent labeled={false} />
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main
        id="main-content"
        className="lg:pl-[76px] pt-[calc(3.5rem+env(safe-area-inset-top))] lg:pt-0 min-h-dvh px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-8 safe-bottom relative z-10"
      >
        {user && (
          <div className="mb-4 sm:mb-6 hidden lg:flex justify-end items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-[#34c759] shadow-[0_0_8px_rgba(52,199,89,0.5)]" />
            <span className="text-xs text-muted-foreground font-medium">
              Xin chào,{" "}
              <strong className="text-foreground font-semibold">
                {user.displayName}
              </strong>
            </span>
          </div>
        )}
        {children}
      </main>

      {/* MOBILE FLOATING TAB BAR (iOS Dock) */}
      <nav
        aria-label="Thanh điều hướng di động"
        className="lg:hidden fixed bottom-3 left-3 right-3 sm:left-6 sm:right-6 z-40 bg-card/90 dark:bg-[#1c1c1e]/90 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.1] rounded-2xl px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
      >
        {menuItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== `/dashboard/b/${businessId}` &&
              pathname.startsWith(item.href + "/"));
          const isExactBusinessHome =
            item.href === `/dashboard/b/${businessId}` &&
            pathname === item.href;
          const isActive =
            businessId && item.href === `/dashboard/b/${businessId}`
              ? isExactBusinessHome
              : active;
          const Icon = item.icon;

          return (
            <Link
              key={`mobile-bottom-${item.href}`}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 min-w-[56px] min-h-[44px] active:scale-95",
                isActive
                  ? "text-[#007aff] dark:text-[#0a84ff] font-bold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-xl transition-all duration-200",
                  isActive && "bg-[#007aff]/12 dark:bg-[#0a84ff]/20 shadow-xs",
                )}
              >
                <Icon className="h-4.5 w-4.5" />
              </div>
              <span className="text-[10px] leading-none tracking-tight">
                {item.title}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

