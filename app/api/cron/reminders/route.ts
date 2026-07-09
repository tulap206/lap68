import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { computeScheduleStatus, buildReminderItems, getEffectiveDueDate } from "@/lib/schedule-engine"

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
    const { data: schedules, error } = await supabase.from("lap68_schedules").select("*")
    if (error) throw error

    const today = new Date()
    let statusUpdates = 0
    let remindersLogged = 0

    for (const s of schedules || []) {
      const status = computeScheduleStatus(s, today)
      if (status !== s.status && !["done", "skipped", "cancelled"].includes(s.status)) {
        await supabase.from("lap68_schedules").update({ status }).eq("id", s.id)
        statusUpdates++
      }

      const items = buildReminderItems([s], today)
      for (const item of items) {
        const dueDate = getEffectiveDueDate(s)
        const daysBefore = item.daysUntil >= 0 ? item.daysUntil : 0
        const { error: logErr } = await supabase.from("lap68_reminder_logs").upsert(
          {
            schedule_id: s.id,
            user_id: s.user_id,
            remind_on_date: dueDate,
            days_before: daysBefore,
            channel: "cron",
            payload: { title: s.title, urgency: item.urgency },
          },
          { onConflict: "schedule_id,remind_on_date,days_before,channel", ignoreDuplicates: true }
        )
        if (!logErr) remindersLogged++
      }
    }

    return NextResponse.json({
      ok: true,
      schedules: (schedules || []).length,
      statusUpdates,
      remindersLogged,
      at: new Date().toISOString(),
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
