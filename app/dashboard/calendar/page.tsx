"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { ModulePageShell, ModuleSubpageHeader, ModuleSectionCard } from "@/components/dashboard/module-shell"
import { fetchSchedules, fetchBusinesses, syncScheduleStatuses } from "@/lib/supabase"
import { getEffectiveDueDate, parseStoredDate } from "@/lib/schedule-engine"
import { displayMoney } from "@/lib/format-money"
import { cn } from "@/lib/utils"
import type { Schedule, Business } from "@/lib/types"
import { Button } from "@/components/ui/button"

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function storedToKey(stored: string): string | null {
  const d = parseStoredDate(stored)
  if (!d) return null
  return dateKey(d)
}

export default function CalendarPage() {
  const { user } = useAuth()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [cursor, setCursor] = useState(() => new Date())
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    try {
      await syncScheduleStatuses(user.id)
      const [sch, biz] = await Promise.all([fetchSchedules(user.id), fetchBusinesses(user.id)])
      setSchedules(sch.filter((s) => !["done", "skipped", "cancelled"].includes(s.status)))
      setBusinesses(biz)
    } catch {
      toast.error("Không tải được lịch")
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { load() }, [load])

  const businessMap = useMemo(() => new Map(businesses.map((b) => [b.id, b])), [businesses])

  const byDate = useMemo(() => {
    const map = new Map<string, Schedule[]>()
    for (const s of schedules) {
      const key = storedToKey(getEffectiveDueDate(s))
      if (!key) continue
      const list = map.get(key) || []
      list.push(s)
      map.set(key, list)
    }
    return map
  }, [schedules])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstDay = new Date(year, month, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const selectedItems = selected ? byDate.get(selected) || [] : []

  return (
    <ModulePageShell module="cashflow">
      <ModuleSubpageHeader module="cashflow" title="Lịch thu/chi" subtitle="Xem lịch đến hạn theo tháng" />

      <div className="grid xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
        <ModuleSectionCard title=" ">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={() => setCursor(new Date(year, month - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
              <h3 className="font-bold text-zinc-100">Tháng {month + 1}/{year}</h3>
              <Button variant="ghost" size="icon" onClick={() => setCursor(new Date(year, month + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
            </div>
            {loading ? (
              <div className="h-64 animate-pulse bg-zinc-800/50 rounded-xl" />
            ) : (
              <>
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {WEEKDAYS.map((w) => <div key={w} className="text-center text-xs text-zinc-500 py-1">{w}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {cells.map((day, i) => {
                    if (day === null) return <div key={`e-${i}`} />
                    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                    const count = byDate.get(key)?.length || 0
                    const isToday = key === dateKey(new Date())
                    const isSelected = selected === key
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelected(key)}
                        className={cn(
                          "aspect-square rounded-lg border text-sm flex flex-col items-center justify-center gap-0.5 transition-colors",
                          isSelected ? "border-green-500/50 bg-green-500/10" : "border-zinc-800 hover:border-zinc-600",
                          isToday && "ring-1 ring-green-500/40"
                        )}
                      >
                        <span className={cn("font-medium", isToday ? "text-green-400" : "text-zinc-300")}>{day}</span>
                        {count > 0 && <span className="text-[10px] text-amber-400">{count}</span>}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </ModuleSectionCard>
        </div>

        <ModuleSectionCard title={selected ? `Ngày ${selected.split("-").reverse().join("/")}` : "Chọn ngày"}>
          <div className="p-4 space-y-3">
            {!selected ? (
              <p className="text-sm text-zinc-500">Nhấn vào ngày trên lịch để xem chi tiết</p>
            ) : selectedItems.length === 0 ? (
              <p className="text-sm text-zinc-500">Không có lịch trong ngày này</p>
            ) : selectedItems.map((s) => {
              const biz = businessMap.get(s.business_id)
              return (
                <div key={s.id} className="rounded-lg border border-zinc-800 p-3">
                  <p className="font-semibold text-zinc-100 text-sm">{s.title}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {biz?.name} · {s.direction === "collect" ? "Phải thu" : "Phải chi"}
                    {s.amount ? ` · ${displayMoney(s.amount)}` : ""}
                  </p>
                </div>
              )
            })}
          </div>
        </ModuleSectionCard>
      </div>
    </ModulePageShell>
  )
}
