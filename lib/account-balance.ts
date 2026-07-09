export const PORTFOLIO_SETTINGS_COUNTERPARTY_NAME = "__LAP68_PORTFOLIO_SETTINGS__"

export interface LiquidAccount {
  id: string
  name: string
  balance: number
}

export interface UserPortfolioSettings {
  liquid_accounts: LiquidAccount[]
  updated_at: string | null
}

export function parseUserPortfolioSettings(settings: Record<string, unknown> | undefined | null): UserPortfolioSettings {
  const raw = settings || {}
  const accounts = Array.isArray(raw.liquid_accounts) ? raw.liquid_accounts : []
  return {
    liquid_accounts: accounts
      .filter((a): a is LiquidAccount => !!a && typeof a === "object" && "name" in a)
      .map((a) => ({
        id: String((a as LiquidAccount).id || crypto.randomUUID()),
        name: String((a as LiquidAccount).name || "Tài khoản"),
        balance: Number((a as LiquidAccount).balance) || 0,
      })),
    updated_at: raw.updated_at ? String(raw.updated_at) : null,
  }
}

export function totalLiquidBalance(settings: UserPortfolioSettings): number {
  return settings.liquid_accounts.reduce((sum, a) => sum + a.balance, 0)
}

export function buildPortfolioSettings(
  current: Record<string, unknown> | undefined,
  portfolio: UserPortfolioSettings
): Record<string, unknown> {
  return {
    ...(current || {}),
    liquid_accounts: portfolio.liquid_accounts,
    updated_at: portfolio.updated_at || new Date().toISOString(),
  }
}

export function defaultLiquidAccounts(): LiquidAccount[] {
  return [
    { id: crypto.randomUUID(), name: "Ngân hàng chính", balance: 0 },
    { id: crypto.randomUUID(), name: "Tiền mặt", balance: 0 },
  ]
}
