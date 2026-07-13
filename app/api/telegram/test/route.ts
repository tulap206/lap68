import { NextRequest, NextResponse } from "next/server"
import { isTelegramConfigured, sendTelegramMessage } from "@/lib/telegram"

/** Send a one-off test message to TELEGRAM_CHAT_ID. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get("authorization")
  const q = req.nextUrl.searchParams.get("secret")
  const allowed =
    (!secret && process.env.NODE_ENV !== "production") ||
    (secret && (auth === `Bearer ${secret}` || q === secret))

  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!isTelegramConfigured()) {
    return NextResponse.json(
      { error: "Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID first" },
      { status: 400 }
    )
  }

  const now = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
  const send = await sendTelegramMessage(
    `<b>LAP68 — Test</b>\nKết nối Telegram OK.\n${now}`
  )

  return NextResponse.json(send.ok ? { ok: true } : { ok: false, error: send.error }, {
    status: send.ok ? 200 : 502,
  })
}
