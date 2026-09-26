import { NextResponse } from "next/server"
import { getTelegramBotInfo, isTelegramConfigured } from "@/lib/telegram"

export async function GET() {
  const hasToken = Boolean(process.env.TELEGRAM_BOT_TOKEN)
  const hasChatId = Boolean(process.env.TELEGRAM_CHAT_ID)
  const chatId = process.env.TELEGRAM_CHAT_ID || ""

  if (!hasToken) {
    return NextResponse.json({
      configured: false,
      status: "missing_token",
      hasToken: false,
      hasChatId,
      chatId: hasChatId ? chatId.slice(0, 3) + "***" : "",
      message: "Chưa cấu hình TELEGRAM_BOT_TOKEN trong biến môi trường (.env.local hoặc Vercel)",
    })
  }

  const botInfo = await getTelegramBotInfo()

  if (!botInfo.ok) {
    return NextResponse.json({
      configured: false,
      status: "invalid_token",
      hasToken: true,
      hasChatId,
      chatId: hasChatId ? chatId.slice(0, 3) + "***" : "",
      error: botInfo.error,
      message: `Token Telegram không hợp lệ: ${botInfo.error}`,
    })
  }

  if (!hasChatId) {
    return NextResponse.json({
      configured: false,
      status: "missing_chat_id",
      hasToken: true,
      hasChatId: false,
      botUsername: botInfo.botUsername,
      botName: botInfo.botName,
      message: `Đã kết nối Bot @${botInfo.botUsername}, nhưng chưa cấu hình TELEGRAM_CHAT_ID`,
    })
  }

  return NextResponse.json({
    configured: true,
    status: "connected",
    hasToken: true,
    hasChatId: true,
    botUsername: botInfo.botUsername,
    botName: botInfo.botName,
    chatId: chatId.length > 4 ? `${chatId.slice(0, 3)}****${chatId.slice(-2)}` : chatId,
    message: `Bot @${botInfo.botUsername} đang hoạt động bình thường`,
  })
}
