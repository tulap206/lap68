import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { computeScheduleStatus, buildReminderItems } from "@/lib/schedule-engine"
import { deliverTelegramReminders, getVietnamToday } from "@/lib/reminder-service"
import type { Schedule } from "@/lib/types"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")
  const secret = process.env.CRON_SECRET
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { data: schedules, error } = await supabase
      .from("lap68_schedules")
      .select("*, business:lap68_businesses(*), counterparty:lap68_counterparties(*)")
    if (error) throw error

    const today = getVietnamToday()
    let statusUpdates = 0

    for (const s of (schedules || []) as Schedule[]) {
      const status = computeScheduleStatus(s, today)
      if (status !== s.status && !["done", "skipped", "cancelled"].includes(s.status)) {
        await supabase.from("lap68_schedules").update({ status }).eq("id", s.id)
        statusUpdates++
        s.status = status
      }
    }

    const items = buildReminderItems((schedules || []) as Schedule[], today)
    const telegram = await deliverTelegramReminders(supabase, items, today)

    // toISOString() là UTC — trả thêm ngày VN đúng calendar
    const todayVn = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`

    return NextResponse.json({
      ok: true,
      schedules: (schedules || []).length,
      statusUpdates,
      reminders: items.length,
      reminderTitles: items.map((i) => ({
        title: i.schedule.title,
        daysUntil: i.daysUntil,
        urgency: i.urgency,
      })),
      telegram,
      at: new Date().toISOString(),
      todayVn,
      hint: !telegram.configured
        ? "Thiếu TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID trên Vercel"
        : items.length === 0
          ? "Không có lịch trong cửa sổ nhắc (mặc định 3/1/0 ngày hoặc quá hạn)"
          : undefined,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
