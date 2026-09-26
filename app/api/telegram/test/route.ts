import { NextRequest, NextResponse } from "next/server"
import { isTelegramConfigured, sendTelegramMessage } from "@/lib/telegram"

/** Send a test message to verify Telegram bot connection. */
export async function POST(req: NextRequest) {
  try {
    let customToken: string | undefined
    let customChatId: string | undefined

    try {
      const body = await req.json()
      customToken = body?.token
      customChatId = body?.chatId
    } catch {
      // JSON body is optional
    }

    const token = customToken || process.env.TELEGRAM_BOT_TOKEN
    const chatId = customChatId || process.env.TELEGRAM_CHAT_ID

    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          error: "Chưa cấu hình TELEGRAM_BOT_TOKEN trong biến môi trường (.env.local / Vercel)",
        },
        { status: 400 }
      )
    }

    if (!chatId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Chưa cấu hình TELEGRAM_CHAT_ID trong biến môi trường (.env.local / Vercel)",
        },
        { status: 400 }
      )
    }

    const now = new Date().toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      dateStyle: "full",
      timeStyle: "medium",
    })

    const message = [
      `🔔 <b>LAP68 — KIỂM TRA KẾT NỐI BOT</b>`,
      `━━━━━━━━━━━━━━━━━━━`,
      `✅ Kết nối Telegram Bot thành công!`,
      `⏱️ <i>Thời gian: ${now}</i>`,
      `📌 <i>Hệ thống tự động nhắc hẹn thu/chi sẵn sàng hoạt động.</i>`,
    ].join("\n")

    const send = await sendTelegramMessage(message, {
      token,
      chatId,
      parseMode: "HTML",
    })

    if (!send.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: send.error || "Gửi tin nhắn Telegram thất bại",
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      ok: true,
      message: "Đã gửi tin nhắn thử nghiệm thành công tới Telegram!",
      sentAt: now,
    })
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Đã xảy ra lỗi không xác định",
      },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  return POST(req)
}
