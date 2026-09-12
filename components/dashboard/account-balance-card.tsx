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
        "rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card shadow-xs overflow-hidden text-left w-full transition-all duration-150",
        onClick && "hover:border-zinc-300 dark:hover:border-zinc-700 active:scale-[0.99] cursor-pointer",
        className,
      )}
    >
      <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
              <Wallet className="h-4 w-4 shrink-0" />
            </div>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Tài khoản thanh toán
            </p>
          </div>
          <p className="text-[11px] text-zinc-500 mt-0.5 ml-9.5">
            Tự động theo giao dịch chuyển khoản
          </p>
        </div>
        {onClick && (
          <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">
            <span>Cập nhật</span>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
          </div>
        )}
      </div>

      <div className={cn("px-5 py-4", compact ? "space-y-2.5" : "space-y-3.5")}>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Tổng số dư khả dụng
          </p>
          <p className="font-mono font-bold text-2xl text-zinc-900 dark:text-zinc-100 tabular-nums mt-0.5">
            {displayMoney(total)}
          </p>
          {settings.updated_at && (
            <p className="text-[10px] text-zinc-400 mt-1">
              Cập nhật {formatDisplayDateTime(settings.updated_at)}
            </p>
          )}
        </div>

        {accounts.length > 0 && (
          <ul
            className={cn(
              "divide-y divide-zinc-100 dark:divide-zinc-800 rounded-xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden bg-zinc-50/60 dark:bg-zinc-900/40",
              compact && "text-sm",
            )}
          >
            {accounts.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 px-3.5 py-2.5"
              >
                <span className="text-zinc-600 dark:text-zinc-400 font-medium truncate text-xs sm:text-sm">
                  {a.name}
                </span>
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums text-xs sm:text-sm shrink-0">
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

