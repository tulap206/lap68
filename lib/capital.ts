import type { Business } from "./types"

export type CapitalAdjustType = "deposit" | "withdraw"

export interface CapitalLedgerEntry {
  id: string
  type: CapitalAdjustType
  amount: number
  note: string | null
  created_at: string
}

export interface BusinessCapitalMeta {
  opening_capital: number
  capital_ledger: CapitalLedgerEntry[]
}

export interface CapitalSnapshot {
  opening_capital: number
  adjustments_net: number
  base_capital: number
  net_profit: number
  available_capital: number
}

export function parseBusinessCapital(ghiChu: Record<string, unknown> | undefined | null): BusinessCapitalMeta {
  const ghi = ghiChu || {}
  const ledger = Array.isArray(ghi.capital_ledger) ? ghi.capital_ledger : []
  return {
    opening_capital: Number(ghi.opening_capital) || 0,
    capital_ledger: ledger
      .filter((e): e is CapitalLedgerEntry => !!e && typeof e === "object" && "amount" in e)
      .map((e) => ({
        id: String((e as CapitalLedgerEntry).id || `${(e as CapitalLedgerEntry).created_at}-${(e as CapitalLedgerEntry).amount}`),
        type: (e as CapitalLedgerEntry).type === "withdraw" ? "withdraw" : "deposit",
        amount: Number((e as CapitalLedgerEntry).amount) || 0,
        note: (e as CapitalLedgerEntry).note ? String((e as CapitalLedgerEntry).note) : null,
        created_at: String((e as CapitalLedgerEntry).created_at || new Date().toISOString()),
      })),
  }
}

export function capitalAdjustmentsNet(ledger: CapitalLedgerEntry[]): number {
  return ledger.reduce((sum, e) => sum + (e.type === "deposit" ? e.amount : -e.amount), 0)
}

export function computeCapitalSnapshot(meta: BusinessCapitalMeta, netProfit: number): CapitalSnapshot {
  const adjustments_net = capitalAdjustmentsNet(meta.capital_ledger)
  const base_capital = meta.opening_capital + adjustments_net
  return {
    opening_capital: meta.opening_capital,
    adjustments_net,
    base_capital,
    net_profit: netProfit,
    available_capital: base_capital + netProfit,
  }
}

export function computePortfolioCapital(
  businesses: Business[],
  summaries: { business_id: string; net_profit: number }[]
): CapitalSnapshot {
  let opening_capital = 0
  let adjustments_net = 0
  let net_profit = 0

  for (const s of summaries) {
    const business = businesses.find((b) => b.id === s.business_id)
    if (!business) continue
    const meta = parseBusinessCapital(business.ghi_chu)
    const snap = computeCapitalSnapshot(meta, Number(s.net_profit))
    opening_capital += snap.opening_capital
    adjustments_net += snap.adjustments_net
    net_profit += snap.net_profit
  }

  const base_capital = opening_capital + adjustments_net
  return {
    opening_capital,
    adjustments_net,
    base_capital,
    net_profit,
    available_capital: base_capital + net_profit,
  }
}

export function buildCapitalGhiChu(
  current: Record<string, unknown> | undefined,
  meta: BusinessCapitalMeta
): Record<string, unknown> {
  return {
    ...(current || {}),
    opening_capital: meta.opening_capital,
    capital_ledger: meta.capital_ledger,
  }
}

export function capitalAdjustLabel(type: CapitalAdjustType) {
  return type === "deposit" ? "Nạp vốn" : "Rút vốn"
}
