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
        <div className="hidden lg:block w-full h-5 mb-5 shrink-0" aria-hidden />
      )}

      <Link
        href="/dashboard"
        onClick={() => setMobileOpen(false)}
        className={cn(
          "relative flex items-center rounded-xl bg-primary text-primary-foreground shrink-0 transition-transform active:scale-[0.98]",
          labeled
            ? "h-11 w-full gap-3 px-3.5 mb-6"
            : "h-11 w-11 justify-center mb-6 lg:mb-8",
        )}
        title="LAP68"
      >
        <Wallet className="h-4.5 w-4.5 shrink-0" />
        {labeled && (
          <span className="text-sm font-semibold tracking-tight">
            LAP<span className="opacity-70">68</span>
          </span>
        )}
      </Link>

      {businessId && (
        <Link
          href="/dashboard"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "mb-3 flex items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted text-xs shrink-0 transition-colors",
            labeled ? "h-9 w-full gap-2 px-3" : "h-8 w-11 justify-center",
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
                "group relative flex items-center rounded-xl transition-colors duration-200",
                labeled ? "h-10 w-full gap-3 px-3" : "h-11 w-11 justify-center",
                isActive
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              title={item.title}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              {labeled ? (
                <span className="text-sm font-medium truncate">
                  {item.title}
                </span>
              ) : (
                <span className="absolute left-full ml-3 hidden group-hover:block whitespace-nowrap rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground z-50 shadow-[0_4px_16px_rgba(28,28,26,0.08)]">
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
          "flex items-center rounded-xl text-muted-foreground hover:bg-[var(--pale-red)] hover:text-expense transition-colors shrink-0",
          labeled
            ? "h-10 w-full gap-3 px-3 mt-2"
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
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 safe-top bg-card backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wallet className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="text-foreground font-semibold tracking-tight block">
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
          className="shrink-0"
          aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
        >
          {mobileOpen ? <X /> : <Menu />}
        </Button>
      </header>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-foreground/20 backdrop-blur-[1px]"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-dvh bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-200 ease-out",
          "w-[min(280px,85vw)] px-3 py-5 safe-top safe-bottom",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:w-[72px] lg:items-center lg:px-0 lg:pt-8 lg:pb-8",
        )}
      >
        <div className="lg:hidden flex flex-col flex-1 min-h-0 w-full">
          <NavContent labeled />
        </div>
        <div className="hidden lg:flex flex-col flex-1 items-center w-full">
          <NavContent labeled={false} />
        </div>
      </aside>

      <main
        id="main-content"
        className="lg:pl-[72px] pt-[calc(3.5rem+env(safe-area-inset-top))] lg:pt-0 min-h-dvh px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 safe-bottom relative z-10"
      >
        {user && (
          <div className="mb-4 sm:mb-5 hidden lg:flex justify-end items-center gap-2">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            <span className="text-xs text-muted-foreground">
              Xin chào,{" "}
              <strong className="text-foreground font-medium">
                {user.displayName}
              </strong>
            </span>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
