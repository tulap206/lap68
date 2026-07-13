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

    return NextResponse.json({
      ok: true,
      schedules: (schedules || []).length,
      statusUpdates,
      reminders: items.length,
      telegram,
      at: new Date().toISOString(),
      todayVn: today.toISOString().slice(0, 10),
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
