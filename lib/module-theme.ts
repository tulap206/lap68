export type ModuleId = "cashflow"
export type ModuleAccent = "emerald"

export type ModuleTheme = {
  id: ModuleId
  accent: ModuleAccent
  titleSuffix: string
  adminClass: string
  label: string
}

export const MODULE_THEME: Record<ModuleId, ModuleTheme> = {
  cashflow: {
    id: "cashflow",
    accent: "emerald",
    titleSuffix: "DÒNG TIỀN LAP68",
    adminClass: "cashflow-admin",
    label: "Quản lý dòng tiền",
  },
}

export const ACCENT_TITLE_CLASS: Record<ModuleAccent, string> = {
  emerald: "text-green-400",
}

export const ACCENT_BTN_CLASS: Record<ModuleAccent, string> = {
  emerald:
    "bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/40 border border-green-500/20",
}

export const ACCENT_KPI_HOVER_CLASS: Record<ModuleAccent, string> = {
  emerald: "hover:border-green-500/30",
}

export const ACCENT_BADGE_CLASS: Record<ModuleAccent, string> = {
  emerald: "badge-income",
}

export const MODULE_CHART_PALETTE = ["#22c55e", "#ef4444", "#71717a", "#16a34a", "#dc2626", "#52525b"]

export function getModuleTheme(module: ModuleId): ModuleTheme {
  return MODULE_THEME[module]
}
