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
          "relative flex items-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shrink-0 shadow-xs transition-transform active:scale-[0.96]",
          labeled
            ? "h-10.5 w-full gap-3 px-3.5 mb-6"
            : "h-10.5 w-10.5 justify-center mb-6 lg:mb-8",
        )}
        title="LAP68"
      >
        <Wallet className="h-5 w-5 shrink-0" />
        {labeled && (
          <span className="text-sm font-bold tracking-tight">
            LAP<span className="opacity-70">68</span>
          </span>
        )}
      </Link>

      {businessId && (
        <Link
          href="/dashboard"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "mb-3 flex items-center rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium shrink-0 transition-colors",
            labeled ? "h-8.5 w-full gap-2 px-3" : "h-8 w-10.5 justify-center",
          )}
          title="Về hub"
        >
          ← {labeled && <span>Về tổng quan</span>}
        </Link>
      )}

      <nav
        className={cn(
          "flex flex-col gap-1 flex-1 w-full",
          !labeled && "items-center gap-1.5 lg:mt-1",
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
                "group relative flex items-center rounded-xl transition-all duration-150 active:scale-[0.97]",
                labeled ? "h-9.5 w-full gap-3 px-3" : "h-10.5 w-10.5 justify-center",
                isActive
                  ? "bg-zinc-900 text-white font-medium shadow-xs dark:bg-white dark:text-zinc-950"
                  : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100",
              )}
              title={item.title}
            >
              <Icon
                className={cn(
                  "h-4.5 w-4.5 shrink-0",
                  isActive ? "text-white dark:text-zinc-950" : "text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100",
                )}
              />
              {labeled ? (
                <span className="text-sm font-medium tracking-tight truncate">
                  {item.title}
                </span>
              ) : (
                <span className="absolute left-full ml-3 hidden group-hover:block whitespace-nowrap rounded-lg border border-zinc-200 dark:border-zinc-800 bg-card px-2.5 py-1 text-xs font-medium text-foreground z-50 shadow-md">
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
          "flex items-center rounded-xl text-zinc-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 transition-all shrink-0 active:scale-[0.96]",
          labeled
            ? "h-9.5 w-full gap-3 px-3 mt-2"
            : "h-10.5 w-10.5 justify-center lg:mt-3",
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
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 safe-top bg-card/90 backdrop-blur-xl border-b border-zinc-200/80 dark:border-zinc-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs">
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
          className="lg:hidden fixed inset-0 z-30 bg-black/20 backdrop-blur-[2px] transition-opacity"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* MACOS TRANSLUCENT SIDEBAR */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-dvh bg-card/90 backdrop-blur-xl border-r border-zinc-200/80 dark:border-zinc-800 flex flex-col transition-transform duration-200 ease-out",
          "w-[min(280px,85vw)] px-3.5 py-5 safe-top safe-bottom",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:w-[72px] lg:items-center lg:px-0 lg:pt-6 lg:pb-6",
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
        className="lg:pl-[72px] pt-[calc(3.5rem+env(safe-area-inset-top))] lg:pt-0 min-h-dvh px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-8 safe-bottom relative z-10"
      >
        {user && (
          <div className="mb-4 sm:mb-6 hidden lg:flex justify-end items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
            <span className="text-xs text-zinc-500 font-medium">
              Xin chào,{" "}
              <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">
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
        className="lg:hidden fixed bottom-3 left-3 right-3 sm:left-6 sm:right-6 z-40 bg-card/95 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800 rounded-2xl px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
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
                "flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all duration-150 min-w-[56px] min-h-[44px] active:scale-95",
                isActive
                  ? "text-zinc-900 dark:text-zinc-100 font-bold"
                  : "text-zinc-500 hover:text-zinc-900",
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-xl transition-all duration-150",
                  isActive && "bg-zinc-100 dark:bg-zinc-800",
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

