"use client";

import { Wallet } from "lucide-react";
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
        "rounded-xl border border-border bg-card overflow-hidden text-left w-full transition-colors",
        onClick && "hover:border-foreground/15 cursor-pointer",
        className,
      )}
    >
      <div className="px-4 py-3 border-b border-border flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-[#1f6c9f] shrink-0" />
            <p className="text-sm font-semibold text-foreground">
              Số dư tài khoản
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Tự cập nhật theo giao dịch thu/chi · có thể đối soát thủ công
          </p>
        </div>
        {onClick && (
          <span className="text-[10px] text-muted-foreground shrink-0">
            Cập nhật
          </span>
        )}
      </div>

      <div className={cn("px-4 py-3", compact ? "space-y-2" : "space-y-3")}>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Tổng hiện có
          </p>
          <p className="font-mono font-bold text-xl text-[#1f6c9f] tabular-nums mt-0.5">
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
              "divide-y divide-border rounded-lg border border-border overflow-hidden",
              compact && "text-sm",
            )}
          >
            {accounts.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 px-3 py-2 bg-muted/30"
              >
                <span className="text-muted-foreground truncate text-xs sm:text-sm">
                  {a.name}
                </span>
                <span className="font-mono text-foreground/90 tabular-nums text-xs sm:text-sm shrink-0">
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
