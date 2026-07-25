export type ModuleId = "cashflow";
export type ModuleAccent = "neutral";

export type ModuleTheme = {
  id: ModuleId;
  accent: ModuleAccent;
  titleSuffix: string;
  adminClass: string;
  label: string;
};

export const MODULE_THEME: Record<ModuleId, ModuleTheme> = {
  cashflow: {
    id: "cashflow",
    accent: "neutral",
    titleSuffix: "Dòng tiền",
    adminClass: "cashflow-admin",
    label: "Quản lý dòng tiền",
  },
};

export const ACCENT_TITLE_CLASS: Record<ModuleAccent, string> = {
  neutral: "text-foreground",
};

export const ACCENT_BTN_CLASS: Record<ModuleAccent, string> = {
  neutral:
    "bg-primary text-primary-foreground hover:bg-foreground/90 border border-transparent",
};

export const ACCENT_KPI_HOVER_CLASS: Record<ModuleAccent, string> = {
  neutral: "hover:border-foreground/15",
};

export const ACCENT_BADGE_CLASS: Record<ModuleAccent, string> = {
  neutral: "badge-income",
};

export const MODULE_CHART_PALETTE = [
  "#346538",
  "#9f2f2d",
  "#787774",
  "#1f6c9f",
  "#956400",
  "#52524e",
];

export function getModuleTheme(module: ModuleId): ModuleTheme {
  return MODULE_THEME[module];
}
