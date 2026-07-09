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
  emerald: "text-emerald-600",
}

export const ACCENT_BTN_CLASS: Record<ModuleAccent, string> = {
  emerald: "bg-emerald-600 hover:bg-emerald-700 text-white",
}

export const ACCENT_KPI_HOVER_CLASS: Record<ModuleAccent, string> = {
  emerald: "hover:border-emerald-100",
}

export const ACCENT_BADGE_CLASS: Record<ModuleAccent, string> = {
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
}

export const MODULE_CHART_PALETTE = ["#059669", "#DC2626", "#2563EB", "#D97706", "#7C6BA8", "#64748B"]

export function getModuleTheme(module: ModuleId): ModuleTheme {
  return MODULE_THEME[module]
}
