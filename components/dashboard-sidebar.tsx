"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  LayoutGrid,
  Bell,
  Calendar,
  BarChart3,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  Wallet,
  ArrowLeftRight,
  Tags,
  CalendarClock,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useState } from "react"

const globalItems = [
  { title: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
  { title: "Việc KD", href: "/dashboard/businesses", icon: LayoutGrid },
  { title: "Nhắc hẹn", href: "/dashboard/reminders", icon: Bell },
  { title: "Lịch", href: "/dashboard/calendar", icon: Calendar },
  { title: "Báo cáo", href: "/dashboard/reports", icon: BarChart3 },
  { title: "Lịch sử", href: "/dashboard/history", icon: History },
  { title: "Cài đặt", href: "/dashboard/settings", icon: Settings },
]

function businessSubItems(businessId: string) {
  const base = `/dashboard/b/${businessId}`
  return [
    { title: "Tổng quan", href: base, icon: LayoutDashboard },
    { title: "Giao dịch", href: `${base}/transactions`, icon: ArrowLeftRight },
    { title: "Danh mục", href: `${base}/categories`, icon: Tags },
    { title: "Lịch thu/chi", href: `${base}/schedules`, icon: CalendarClock },
    { title: "Đối tác", href: `${base}/counterparties`, icon: Users },
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

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const NavContent = () => (
    <>
      <Link
        href="/dashboard"
        className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white border border-zinc-800 mb-6 glow-green"
        title="LAP68"
      >
        <Wallet className="h-5 w-5 text-green-400" />
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-black" />
      </Link>

      {businessId && (
        <Link
          href="/dashboard"
          className="mb-3 flex h-8 w-12 items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 text-xs"
          title="Về hub"
        >
          ←
        </Link>
      )}

      <nav className="flex flex-col gap-2 flex-1">
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
                "group relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200",
                isActive
                  ? "bg-green-600/20 text-green-400 border border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.15)]"
                  : "text-zinc-500 border border-transparent hover:bg-zinc-800/80 hover:text-zinc-200 hover:border-zinc-700"
              )}
              title={item.title}
            >
              <Icon className="h-5 w-5" />
              <span className="absolute left-full ml-3 hidden group-hover:block whitespace-nowrap rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-200 z-50 shadow-xl">
                {item.title}
              </span>
            </Link>
          )
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="flex h-12 w-12 items-center justify-center rounded-2xl text-zinc-500 border border-transparent hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all"
        title="Đăng xuất"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-black/90 backdrop-blur-md border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800">
            <Wallet className="h-4 w-4 text-green-400" />
          </div>
          <span className="text-white font-bold tracking-tight">
            LAP<span className="text-red-500">68</span>
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)} className="text-zinc-300 hover:text-white hover:bg-zinc-800">
          {mobileOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-[72px] bg-black border-r border-zinc-800/80 flex flex-col items-center py-6 transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <NavContent />
      </aside>

      <main className="lg:pl-[72px] pt-14 lg:pt-0 min-h-screen p-4 lg:p-8 relative z-10">
        {user && (
          <div className="mb-5 hidden lg:flex justify-end items-center gap-2">
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
