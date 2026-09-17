"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  Wallet,
  ArrowLeftRight,
  Tags,
  CalendarClock,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const globalItems = [
  { title: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
  { title: "Lịch & Nhắc hẹn", href: "/dashboard/calendar", icon: CalendarClock },
  { title: "Mảng việc", href: "/dashboard/businesses", icon: LayoutGrid },
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
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);

  // Auto close menu on route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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
          title="Về tổng quan"
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
                labeled ? "h-10 w-full gap-3 px-3" : "h-10.5 w-10.5 justify-center",
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
            ? "h-10 w-full gap-3 px-3 mt-2"
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
    <div className="min-h-dvh bg-background flex flex-col">
      {/* MOBILE TOP BAR */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 safe-top bg-card/92 backdrop-blur-xl border-b border-zinc-200/80 dark:border-zinc-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs">
            <Wallet className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="text-foreground font-bold tracking-tight block text-sm leading-tight">
              LAP68
            </span>
            {user && (
              <span className="text-[10px] text-muted-foreground truncate block max-w-[150px] leading-tight">
                {user.displayName}
              </span>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="shrink-0 rounded-full h-9 w-9 text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/30 backdrop-blur-[2px] transition-opacity animate-in fade-in-0 duration-200"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* MACOS TRANSLUCENT SIDEBAR */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-dvh bg-card/95 backdrop-blur-xl border-r border-zinc-200/80 dark:border-zinc-800 flex flex-col transition-transform duration-200 ease-out",
          "w-[min(280px,85vw)] px-3.5 py-5 safe-top safe-bottom shadow-xl lg:shadow-none",
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
        className="flex-1 w-full min-h-dvh pt-[calc(4.25rem+env(safe-area-inset-top))] pb-[calc(6.25rem+env(safe-area-inset-bottom))] px-3.5 sm:px-6 lg:pt-6 lg:pb-10 lg:pl-[88px] lg:px-8 relative z-10"
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
        className="lg:hidden fixed bottom-3 left-3 right-3 sm:left-6 sm:right-6 z-40 bg-card/95 backdrop-blur-2xl border border-zinc-200/90 dark:border-zinc-800 rounded-2xl px-1.5 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
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
                "flex-1 flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-xl transition-all duration-150 min-h-[44px] active:scale-95 text-center select-none",
                isActive
                  ? "text-zinc-900 dark:text-zinc-100 font-bold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200",
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-xl transition-all duration-150",
                  isActive && "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100",
                )}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
              </div>
              <span className="text-[10px] leading-tight tracking-tight truncate max-w-full font-medium">
                {item.title}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

