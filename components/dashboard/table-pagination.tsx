"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function TablePagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: {
  page: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}) {
  if (totalItems === 0) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalItems)

  const pages = (() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const items: number[] = []
    if (page > 2) items.push(1)
    if (page > 3) items.push(-1)
    for (let p = Math.max(1, page - 1); p <= Math.min(totalPages, page + 1); p++) items.push(p)
    if (page < totalPages - 2) items.push(-1)
    if (page < totalPages - 1) items.push(totalPages)
    return [...new Set(items)]
  })()

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-zinc-800 bg-zinc-900/30">
      <p className="text-xs text-zinc-500">
        {from}–{to} / {totalItems} bản ghi
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Trang trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {pages.map((p, i) =>
          p === -1 ? (
            <span key={`ellipsis-${i}`} className="px-1 text-zinc-600 text-xs">…</span>
          ) : (
            <Button
              key={p}
              variant="outline"
              size="sm"
              className={cn("h-8 min-w-8 px-2 text-xs", p === page && "bg-green-600/20 border-green-500/30 text-green-400")}
              onClick={() => onPageChange(p)}
            >
              {p}
            </Button>
          )
        )}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Trang sau"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
