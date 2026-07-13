import type { SupabaseClient } from "@supabase/supabase-js"
import { displayMoney } from "@/lib/format-money"
import { formatStoredDate, toDateOnly } from "@/lib/schedule-engine"
import { escapeTelegramHtml, isTelegramConfigured, sendTelegramMessage } from "@/lib/telegram"
import type { ReminderItem } from "@/lib/types"

const VN_TZ = "Asia/Ho_Chi_Minh"

/** "Today" in Vietnam for cron / reminder windows. */
export function getVietnamToday(): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: VN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())

  const y = Number(parts.find((p) => p.type === "year")?.value)
  const m = Number(parts.find((p) => p.type === "month")?.value)
  const d = Number(parts.find((p) => p.type === "day")?.value)
  return toDateOnly(new Date(y, m - 1, d))
}

function urgencyLabel(item: ReminderItem): string {
  if (item.urgency === "overdue") {
    return `Quá hạn ${Math.abs(item.daysUntil)} ngày`
  }
  if (item.urgency === "today") return "Hôm nay đến hạn"
  if (item.daysUntil === 1) return "Còn 1 ngày"
  return `Còn ${item.daysUntil} ngày`
}

export function formatTelegramReminder(item: ReminderItem): string {
  const { schedule, dueDate } = item
  const direction = schedule.direction === "collect" ? "Phải thu" : "Phải chi"
  const business = schedule.business?.name
    ? `\nViệc: <b>${escapeTelegramHtml(schedule.business.name)}</b>`
    : ""
  const amount =
    schedule.amount != null && schedule.amount > 0
      ? `\nSố tiền: <b>${escapeTelegramHtml(displayMoney(schedule.amount))}</b>${
          schedule.amount_is_estimate ? " (ước tính)" : ""
        }`
      : ""
  const counterparty = schedule.counterparty?.name
    ? `\nĐối tác: ${escapeTelegramHtml(schedule.counterparty.name)}`
    : ""

  return [
    `<b>LAP68 — Nhắc hẹn</b>`,
    `${urgencyLabel(item)}`,
    ``,
    `<b>${escapeTelegramHtml(schedule.title)}</b>`,
    `${direction} · Hạn: ${escapeTelegramHtml(dueDate)}${amount}${business}${counterparty}`,
  ].join("\n")
}

export type TelegramDeliverResult = {
  considered: number
  sent: number
  skipped: number
  failed: number
  configured: boolean
}

/**
 * Dedup via lap68_reminder_logs (channel=telegram), then send Telegram.
 * remind_on_date = ngày chạy (VN) → mỗi mốc/ngày chỉ gửi 1 lần.
 */
export async function deliverTelegramReminders(
  supabase: SupabaseClient,
  items: ReminderItem[],
  today = getVietnamToday()
): Promise<TelegramDeliverResult> {
  const result: TelegramDeliverResult = {
    considered: items.length,
    sent: 0,
    skipped: 0,
    failed: 0,
    configured: isTelegramConfigured(),
  }

  if (!result.configured) {
    result.skipped = items.length
    return result
  }

  const remindOnDate = formatStoredDate(today)

  for (const item of items) {
    const message = formatTelegramReminder(item)
    const daysBefore = item.daysUntil >= 0 ? item.daysUntil : 0

    const { error: insertErr } = await supabase.from("lap68_reminder_logs").insert({
      schedule_id: item.schedule.id,
      user_id: item.schedule.user_id,
      remind_on_date: remindOnDate,
      days_before: daysBefore,
      channel: "telegram",
      status: "failed",
      message,
    })

    if (insertErr) {
      // Unique violation → already claimed/sent for this day
      if (insertErr.code === "23505") {
        result.skipped++
        continue
      }
      result.failed++
      continue
    }

    const send = await sendTelegramMessage(message)
    if (send.ok) {
      await supabase
        .from("lap68_reminder_logs")
        .update({ status: "sent" })
        .eq("schedule_id", item.schedule.id)
        .eq("remind_on_date", remindOnDate)
        .eq("days_before", daysBefore)
        .eq("channel", "telegram")
      result.sent++
    } else {
      await supabase
        .from("lap68_reminder_logs")
        .update({ status: "failed", message: `${message}\n\n[error] ${send.error}` })
        .eq("schedule_id", item.schedule.id)
        .eq("remind_on_date", remindOnDate)
        .eq("days_before", daysBefore)
        .eq("channel", "telegram")
      result.failed++
    }
  }

  return result
}
