"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Business } from "@/lib/types"
import { useState } from "react"

export function BusinessSwitcher({ businesses, currentId }: { businesses: Business[]; currentId?: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const current = businesses.find((b) => b.id === currentId)

  if (!currentId || !current) return null

  return (
    <div className="relative mb-4 w-full sm:w-auto">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full sm:w-auto items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-200 hover:border-zinc-700"
      >
        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: current.color }} />
        <span className="font-semibold truncate flex-1 text-left sm:max-w-[200px]">{current.name}</span>
        <ChevronDown className={cn("h-4 w-4 text-zinc-500 transition-transform shrink-0", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 sm:right-auto top-full mt-1 z-50 sm:min-w-[220px] rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl py-1 max-h-[min(60dvh,320px)] overflow-y-auto">
            {businesses.map((b) => (
              <Link
                key={b.id}
                href={pathname.replace(currentId, b.id)}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-800",
                  b.id === currentId ? "text-green-400" : "text-zinc-300"
                )}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: b.color }} />
                {b.name}
              </Link>
            ))}
            <Link href="/dashboard" onClick={() => setOpen(false)} className="block px-3 py-2 text-xs text-zinc-500 hover:bg-zinc-800 border-t border-zinc-800 mt-1">
              ← Tất cả việc
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
