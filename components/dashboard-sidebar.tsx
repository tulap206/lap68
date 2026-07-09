"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tags,
  BarChart3,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const menuItems = [
  { title: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
  { title: "Giao dịch", href: "/dashboard/transactions", icon: ArrowLeftRight },
  { title: "Danh mục", href: "/dashboard/categories", icon: Tags },
  { title: "Báo cáo", href: "/dashboard/reports", icon: BarChart3 },
  { title: "Lịch sử", href: "/dashboard/history", icon: History },
  { title: "Cài đặt", href: "/dashboard/settings", icon: Settings },
]

export function DashboardSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const NavContent = () => (
    <>
      <Link
        href="/dashboard"
        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-900/30 ring-2 ring-emerald-500/30 mb-6"
        title="LAP68"
      >
        <Wallet className="h-5 w-5" />
      </Link>

      <nav className="flex flex-col gap-2 flex-1">
        {menuItems.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all",
                active
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
              title={item.title}
            >
              <Icon className="h-5 w-5" />
              <span className="absolute left-full ml-3 hidden group-hover:block whitespace-nowrap rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-white z-50">
                {item.title}
              </span>
            </Link>
          )
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="flex h-12 w-12 items-center justify-center rounded-2xl text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-all"
        title="Đăng xuất"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-2 text-white font-bold">
          <Wallet className="h-5 w-5 text-emerald-500" />
          LAP68
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)} className="text-white">
          {mobileOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-[72px] bg-slate-950 border-r border-slate-800 flex flex-col items-center py-6 transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <NavContent />
      </aside>

      <main className="lg:pl-[72px] pt-14 lg:pt-0 min-h-screen p-4 lg:p-8">
        {user && (
          <div className="mb-4 hidden lg:flex justify-end">
            <span className="text-xs text-slate-500">
              Xin chào, <strong className="text-slate-700">{user.displayName}</strong>
            </span>
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
