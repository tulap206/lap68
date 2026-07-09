import type { PaymentMethod, TransactionType } from "./types"

export const PORTFOLIO_SETTINGS_COUNTERPARTY_NAME = "__LAP68_PORTFOLIO_SETTINGS__"

export interface LiquidAccount {
  id: string
  name: string
  balance: number
}

export interface UserPortfolioSettings {
  liquid_accounts: LiquidAccount[]
  updated_at: string | null
  /** Tài khoản mặc định khi không khớp phương thức thanh toán */
  primary_account_id?: string | null
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
    primary_account_id: raw.primary_account_id ? String(raw.primary_account_id) : null,
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
    primary_account_id: portfolio.primary_account_id ?? (portfolio.liquid_accounts[0]?.id ?? null),
  }
}

export function defaultLiquidAccounts(): LiquidAccount[] {
  return [
    { id: crypto.randomUUID(), name: "Ngân hàng chính", balance: 0 },
    { id: crypto.randomUUID(), name: "Tiền mặt", balance: 0 },
  ]
}

/** Thu +amount, chi -amount */
export function transactionBalanceDelta(type: TransactionType, amount: number): number {
  const n = Number(amount) || 0
  return type === "income" ? n : -n
}

function nameMatches(name: string, patterns: RegExp[]) {
  const n = name.toLowerCase()
  return patterns.some((p) => p.test(n))
}

/** Chọn tài khoản thanh khoản bị ảnh hưởng bởi giao dịch */
export function resolveAccountForPayment(
  settings: UserPortfolioSettings,
  paymentMethod: PaymentMethod
): LiquidAccount | null {
  const accounts = settings.liquid_accounts
  if (accounts.length === 0) return null

  if (settings.primary_account_id) {
    const primary = accounts.find((a) => a.id === settings.primary_account_id)
    if (primary && paymentMethod === "other") return primary
  }

  if (paymentMethod === "cash") {
    return (
      accounts.find((a) => nameMatches(a.name, [/tiền mặt/, /cash/, /mặt/])) ||
      accounts.find((a) => a.id === settings.primary_account_id) ||
      accounts[0]
    )
  }

  if (paymentMethod === "bank" || paymentMethod === "card") {
    return (
      accounts.find((a) => nameMatches(a.name, [/ngân hàng/, /bank/, /vietcombank/, /techcombank/, /acb/, /vcb/])) ||
      accounts.find((a) => !nameMatches(a.name, [/tiền mặt/, /cash/, /mặt/])) ||
      accounts[0]
    )
  }

  return accounts.find((a) => a.id === settings.primary_account_id) || accounts[0]
}

export function applyDeltaToAccounts(
  accounts: LiquidAccount[],
  accountId: string,
  delta: number
): LiquidAccount[] {
  return accounts.map((a) =>
    a.id === accountId ? { ...a, balance: a.balance + delta } : a
  )
}

export type TransactionBalanceFields = {
  type: TransactionType
  amount: number
  payment_method: PaymentMethod
}

export function applyTransactionToPortfolio(
  settings: UserPortfolioSettings,
  tx: TransactionBalanceFields
): UserPortfolioSettings {
  let accounts = settings.liquid_accounts.length > 0 ? [...settings.liquid_accounts] : defaultLiquidAccounts()
  const account = resolveAccountForPayment({ ...settings, liquid_accounts: accounts }, tx.payment_method)
  if (!account) return settings

  const delta = transactionBalanceDelta(tx.type, tx.amount)
  accounts = applyDeltaToAccounts(accounts, account.id, delta)

  return {
    ...settings,
    liquid_accounts: accounts,
    updated_at: new Date().toISOString(),
    primary_account_id: settings.primary_account_id || accounts[0]?.id || null,
  }
}

export function reverseTransactionFromPortfolio(
  settings: UserPortfolioSettings,
  tx: TransactionBalanceFields
): UserPortfolioSettings {
  let accounts = settings.liquid_accounts.length > 0 ? [...settings.liquid_accounts] : defaultLiquidAccounts()
  const account = resolveAccountForPayment({ ...settings, liquid_accounts: accounts }, tx.payment_method)
  if (!account) return settings

  const delta = -transactionBalanceDelta(tx.type, tx.amount)
  accounts = applyDeltaToAccounts(accounts, account.id, delta)

  return {
    ...settings,
    liquid_accounts: accounts,
    updated_at: new Date().toISOString(),
    primary_account_id: settings.primary_account_id || accounts[0]?.id || null,
  }
}

export function syncPortfolioForTransactionChange(
  settings: UserPortfolioSettings,
  before: TransactionBalanceFields | null,
  after: TransactionBalanceFields | null
): UserPortfolioSettings {
  let next = { ...settings, liquid_accounts: [...settings.liquid_accounts] }
  if (next.liquid_accounts.length === 0) {
    next = { ...next, liquid_accounts: defaultLiquidAccounts() }
  }
  if (before) next = reverseTransactionFromPortfolio(next, before)
  if (after) next = applyTransactionToPortfolio(next, after)
  return next
}
