"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const tabs = (businessId: string) => [
  { label: "Tổng quan", href: `/dashboard/b/${businessId}` },
  { label: "Giao dịch", href: `/dashboard/b/${businessId}/transactions` },
  { label: "Danh mục", href: `/dashboard/b/${businessId}/categories` },
  { label: "Lịch thu/chi", href: `/dashboard/b/${businessId}/schedules` },
]

export function BusinessSubNav({ businessId }: { businessId: string }) {
  const pathname = usePathname()
  const items = tabs(businessId)

  return (
    <div className="-mx-4 px-4 sm:mx-0 sm:px-0 mb-4 border-b border-zinc-800 pb-3 overflow-x-auto scrollbar-hide">
      <div className="flex gap-1 min-w-max sm:min-w-0 sm:flex-wrap">
        {items.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0",
                active ? "bg-green-600/20 text-green-400" : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
