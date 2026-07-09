import { parseDisplayDate, toStoredDateValue } from "./format-date"
import type { Schedule, ScheduleRecurrence, ScheduleStatus, ReminderItem } from "./types"

function pad2(n: number) {
  return String(n).padStart(2, "0")
}

export function toDateOnly(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function parseStoredDate(value: string): Date | null {
  return parseDisplayDate(value)
}

export function daysBetween(from: Date, to: Date): number {
  const a = toDateOnly(from).getTime()
  const b = toDateOnly(to).getTime()
  return Math.round((b - a) / (1000 * 60 * 60 * 24))
}

export function formatStoredDate(d: Date): string {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`
}

export function getEffectiveDueDate(schedule: Schedule): string {
  return schedule.next_due_date || schedule.due_date
}

export function computeScheduleStatus(schedule: Schedule, today = new Date()): ScheduleStatus {
  if (schedule.status === "done" || schedule.status === "skipped" || schedule.status === "cancelled") {
    return schedule.status
  }
  const due = parseStoredDate(getEffectiveDueDate(schedule))
  if (!due) return schedule.status
  if (toDateOnly(due) < toDateOnly(today)) return "overdue"
  return "pending"
}

export function computeNextDueDate(
  dueDate: string,
  recurrence: ScheduleRecurrence,
  fromDate = new Date()
): string | null {
  if (!recurrence?.frequency) return null

  const current = parseStoredDate(dueDate)
  if (!current) return null

  const interval = recurrence.interval || 1
  let next = new Date(current)

  if (recurrence.frequency === "daily") {
    next.setDate(next.getDate() + interval)
  } else if (recurrence.frequency === "weekly") {
    next.setDate(next.getDate() + 7 * interval)
  } else if (recurrence.frequency === "monthly") {
    next.setMonth(next.getMonth() + interval)
    if (recurrence.day_of_month) next.setDate(recurrence.day_of_month)
  } else if (recurrence.frequency === "yearly") {
    next.setFullYear(next.getFullYear() + interval)
  }

  if (recurrence.end_date) {
    const end = parseStoredDate(recurrence.end_date)
    if (end && toDateOnly(next) > toDateOnly(end)) return null
  }

  while (toDateOnly(next) <= toDateOnly(fromDate)) {
    const advanced = computeNextDueDate(formatStoredDate(next), recurrence, fromDate)
    if (!advanced) return null
    next = parseStoredDate(advanced)!
  }

  return formatStoredDate(next)
}

export function buildReminderItems(schedules: Schedule[], today = new Date()): ReminderItem[] {
  const items: ReminderItem[] = []

  for (const schedule of schedules) {
    if (["done", "skipped", "cancelled"].includes(schedule.status)) continue

    const dueStr = getEffectiveDueDate(schedule)
    const due = parseStoredDate(dueStr)
    if (!due) continue

    const daysUntil = daysBetween(today, due)
    const reminderDays = schedule.reminder_days?.length ? schedule.reminder_days : [3, 1, 0]

    const shouldRemind = reminderDays.some((d) => d === daysUntil) || daysUntil < 0

    if (!shouldRemind) continue

    let urgency: ReminderItem["urgency"] = "upcoming"
    if (daysUntil < 0) urgency = "overdue"
    else if (daysUntil === 0) urgency = "today"
    else if (daysUntil <= 3) urgency = "soon"

    items.push({ schedule, dueDate: dueStr, daysUntil, urgency })
  }

  return items.sort((a, b) => a.daysUntil - b.daysUntil)
}

export function countOverdueSchedules(schedules: Schedule[], today = new Date()): number {
  return schedules.filter((s) => computeScheduleStatus(s, today) === "overdue").length
}

export function scheduleToTransactionType(direction: Schedule["direction"]) {
  return direction === "collect" ? "income" as const : "expense" as const
}

export function initNextDueDate(dueDate: string, kind: Schedule["schedule_kind"], recurrence: ScheduleRecurrence) {
  if (kind === "once") return dueDate
  return dueDate
}
