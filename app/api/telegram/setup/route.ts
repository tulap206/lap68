import { NextRequest, NextResponse } from "next/server"

/**
 * Dev helper: list chat ids from recent bot updates.
 * 1) Open t.me/lap68_bot and send /start
 * 2) GET /api/telegram/setup?secret=CRON_SECRET (or Authorization: Bearer)
 * 3) Copy chat_id into TELEGRAM_CHAT_ID
 */
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

  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    return NextResponse.json({ error: "Missing TELEGRAM_BOT_TOKEN" }, { status: 400 })
  }

  try {
    const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`)
    const me = (await meRes.json()) as { ok?: boolean; result?: { username?: string }; description?: string }

    const updRes = await fetch(`https://api.telegram.org/bot${token}/getUpdates`)
    const upd = (await updRes.json()) as {
      ok?: boolean
      result?: Array<{ message?: { chat?: { id: number; type?: string; username?: string; first_name?: string } } }>
      description?: string
    }

    const seen = new Set<number>()
    const chats: Array<{ id: number; type?: string; username?: string; first_name?: string }> = []
    for (const u of upd.result || []) {
      const chat = u.message?.chat
      if (!chat || seen.has(chat.id)) continue
      seen.add(chat.id)
      chats.push({
        id: chat.id,
        type: chat.type,
        username: chat.username,
        first_name: chat.first_name,
      })
    }

    return NextResponse.json({
      ok: true,
      bot: me.result?.username,
      chatIdConfigured: Boolean(process.env.TELEGRAM_CHAT_ID),
      chats,
      hint:
        chats.length === 0
          ? "Mở t.me/lap68_bot, gửi /start, rồi gọi lại endpoint này."
          : "Copy chats[0].id vào TELEGRAM_CHAT_ID trong .env.local / Vercel.",
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Telegram setup failed" },
      { status: 500 }
    )
  }
}
