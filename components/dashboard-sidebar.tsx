"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const globalItems = [
  { title: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
  { title: "Nhắc hẹn", href: "/dashboard/reminders", icon: Bell },
  { title: "Lịch", href: "/dashboard/calendar", icon: Calendar },
  { title: "Cài đặt", href: "/dashboard/settings", icon: Settings },
]

function businessSubItems(businessId: string) {
  const base = `/dashboard/b/${businessId}`
  return [
    { title: "Tổng quan", href: base, icon: LayoutDashboard },
    { title: "Giao dịch", href: `${base}/transactions`, icon: ArrowLeftRight },
    { title: "Danh mục", href: `${base}/categories`, icon: Tags },
    { title: "Lịch thu/chi", href: `${base}/schedules`, icon: CalendarClock },
  ]
}

export function DashboardSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const businessMatch = pathname.match(/^\/dashboard\/b\/([^/]+)/)
  const businessId = businessMatch?.[1]
  const menuItems = businessId ? businessSubItems(businessId) : globalItems

  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [mobileOpen])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const NavContent = ({ labeled }: { labeled: boolean }) => (
    <>
      <Link
        href="/dashboard"
        onClick={() => setMobileOpen(false)}
        className={cn(
          "relative flex items-center rounded-2xl bg-zinc-900 text-white border border-zinc-800 mb-6 glow-green shrink-0",
          labeled ? "h-12 w-full gap-3 px-4" : "h-12 w-12 justify-center"
        )}
        title="LAP68"
      >
        <Wallet className="h-5 w-5 text-green-400 shrink-0" />
        {labeled && <span className="text-sm font-bold text-zinc-100">LAP<span className="text-red-500">68</span></span>}
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-black" />
      </Link>

      {businessId && (
        <Link
          href="/dashboard"
          onClick={() => setMobileOpen(false)}
          className={cn(
            "mb-3 flex items-center rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 text-xs shrink-0",
            labeled ? "h-10 w-full gap-2 px-4" : "h-8 w-12 justify-center"
          )}
          title="Về hub"
        >
          ← {labeled && <span>Về tổng quan</span>}
        </Link>
      )}

      <nav className={cn("flex flex-col gap-1.5 flex-1 w-full", !labeled && "items-center gap-2")}>
        {menuItems.map((item) => {
          const active = pathname === item.href || (item.href !== `/dashboard/b/${businessId}` && pathname.startsWith(item.href + "/"))
          const isExactBusinessHome = item.href === `/dashboard/b/${businessId}` && pathname === item.href
          const isActive = businessId && item.href === `/dashboard/b/${businessId}` ? isExactBusinessHome : active
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group relative flex items-center rounded-2xl transition-all duration-200",
                labeled ? "h-11 w-full gap-3 px-4" : "h-12 w-12 justify-center",
                isActive
                  ? "bg-green-600/20 text-green-400 border border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.15)]"
                  : "text-zinc-500 border border-transparent hover:bg-zinc-800/80 hover:text-zinc-200 hover:border-zinc-700"
              )}
              title={item.title}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {labeled ? (
                <span className="text-sm font-medium truncate">{item.title}</span>
              ) : (
                <span className="absolute left-full ml-3 hidden group-hover:block whitespace-nowrap rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-200 z-50 shadow-xl">
                  {item.title}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <button
        onClick={handleLogout}
        className={cn(
          "flex items-center rounded-2xl text-zinc-500 border border-transparent hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all shrink-0",
          labeled ? "h-11 w-full gap-3 px-4 mt-2" : "h-12 w-12 justify-center"
        )}
        title="Đăng xuất"
      >
        <LogOut className="h-5 w-5 shrink-0" />
        {labeled && <span className="text-sm font-medium">Đăng xuất</span>}
      </button>
    </>
  )

  return (
    <div className="min-h-dvh bg-background">
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 safe-top bg-black/90 backdrop-blur-md border-b border-zinc-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800">
            <Wallet className="h-4 w-4 text-green-400" />
          </div>
          <div className="min-w-0">
            <span className="text-white font-bold tracking-tight block">
              LAP<span className="text-red-500">68</span>
            </span>
            {user && (
              <span className="text-[10px] text-zinc-500 truncate block max-w-[140px]">{user.displayName}</span>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)} className="text-zinc-300 hover:text-white hover:bg-zinc-800 shrink-0" aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}>
          {mobileOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-hidden />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-dvh bg-black border-r border-zinc-800/80 flex flex-col transition-transform duration-200 ease-out",
          "w-[min(280px,85vw)] px-4 py-6 safe-top safe-bottom",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:w-[72px] lg:items-center lg:px-0 lg:py-6"
        )}
      >
        <div className="lg:hidden flex flex-col flex-1 min-h-0 w-full">
          <NavContent labeled />
        </div>
        <div className="hidden lg:flex flex-col flex-1 items-center w-full">
          <NavContent labeled={false} />
        </div>
      </aside>

      <main className="lg:pl-[72px] pt-[calc(3.5rem+env(safe-area-inset-top))] lg:pt-0 min-h-dvh px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 safe-bottom relative z-10">
        {user && (
          <div className="mb-4 sm:mb-5 hidden lg:flex justify-end items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-zinc-500">
              Xin chào, <strong className="text-zinc-300 font-semibold">{user.displayName}</strong>
            </span>
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
