"use client";

import { Wallet, ChevronRight } from "lucide-react";
import { displayMoney } from "@/lib/format-money";
import { formatDisplayDateTime } from "@/lib/format-date";
import {
  totalLiquidBalance,
  type UserPortfolioSettings,
} from "@/lib/account-balance";
import { cn } from "@/lib/utils";

export function AccountBalanceCard({
  settings,
  compact = false,
  onClick,
  className,
}: {
  settings: UserPortfolioSettings;
  compact?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const total = totalLiquidBalance(settings);
  const accounts = settings.liquid_accounts.filter((a) => a.name);
  const Comp = onClick ? "button" : "div";

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-card/90 dark:bg-card/95 backdrop-blur-xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] overflow-hidden text-left w-full transition-all duration-200",
        onClick && "hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)] active:scale-[0.99] cursor-pointer",
        className,
      )}
    >
      <div className="px-5 py-3.5 border-b border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#007aff]/12 text-[#007aff]">
              <Wallet className="h-4 w-4 shrink-0" />
            </div>
            <p className="text-sm font-semibold text-foreground tracking-tight">
              Tài khoản thanh toán
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 ml-9.5">
            Tự động theo giao dịch chuyển khoản
          </p>
        </div>
        {onClick && (
          <div className="flex items-center gap-1 text-[11px] font-semibold text-[#007aff] shrink-0">
            <span>Cập nhật</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
        )}
      </div>

      <div className={cn("px-5 py-4", compact ? "space-y-2.5" : "space-y-3.5")}>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tổng số dư khả dụng
          </p>
          <p className="font-mono font-bold text-2xl text-[#007aff] dark:text-[#0a84ff] tabular-nums mt-0.5">
            {displayMoney(total)}
          </p>
          {settings.updated_at && (
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              Cập nhật {formatDisplayDateTime(settings.updated_at)}
            </p>
          )}
        </div>

        {accounts.length > 0 && (
          <ul
            className={cn(
              "divide-y divide-black/[0.04] dark:divide-white/[0.06] rounded-xl border border-black/[0.05] dark:border-white/[0.07] overflow-hidden bg-black/[0.02] dark:bg-white/[0.03]",
              compact && "text-sm",
            )}
          >
            {accounts.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 px-3.5 py-2.5"
              >
                <span className="text-muted-foreground font-medium truncate text-xs sm:text-sm">
                  {a.name}
                </span>
                <span className="font-mono font-semibold text-foreground tabular-nums text-xs sm:text-sm shrink-0">
                  {displayMoney(a.balance)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Comp>
  );
}

