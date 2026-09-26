const TELEGRAM_API = "https://api.telegram.org"

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID)
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

export function escapeTelegramHtml(text: string): string {
  return escapeHtml(text)
}

export async function getTelegramBotInfo(customToken?: string): Promise<{
  ok: boolean
  botUsername?: string
  botName?: string
  error?: string
}> {
  const token = customToken || process.env.TELEGRAM_BOT_TOKEN
  if (!token) return { ok: false, error: "Chưa cấu hình TELEGRAM_BOT_TOKEN" }
  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/getMe`)
    const data = (await res.json()) as { ok?: boolean; result?: { username?: string; first_name?: string }; description?: string }
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.description || "Token không hợp lệ" }
    }
    return {
      ok: true,
      botUsername: data.result?.username,
      botName: data.result?.first_name,
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Không thể kết nối Telegram API" }
  }
}

export async function sendTelegramMessage(
  text: string,
  options?: { token?: string; chatId?: string; parseMode?: "HTML" | "Markdown" }
): Promise<{ ok: boolean; error?: string }> {
  const token = options?.token || process.env.TELEGRAM_BOT_TOKEN
  const chatId = options?.chatId || process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    return { ok: false, error: "Chưa cấu hình TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID" }
  }

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: options?.parseMode ?? "HTML",
        disable_web_page_preview: true,
      }),
    })

    const data = (await res.json()) as { ok?: boolean; description?: string }
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.description || `HTTP ${res.status}` }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Không thể gửi tin nhắn Telegram" }
  }
}
