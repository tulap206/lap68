"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { BusinessIcon } from "@/components/dashboard/business-icon";
import type { Business } from "@/lib/types";
import { useState } from "react";

export function BusinessSwitcher({
  businesses,
  currentId,
}: {
  businesses: Business[];
  currentId?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = businesses.find((b) => b.id === currentId);

  if (!currentId || !current) return null;

  return (
    <div className="relative mb-4 w-full sm:w-auto">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full sm:w-auto items-center gap-2.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card px-3.5 py-2 text-sm text-foreground shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
      >
        <BusinessIcon name={current.name} color={current.color} size="sm" />
        <span className="font-bold truncate flex-1 text-left sm:max-w-[200px]">
          {current.name}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform shrink-0",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 sm:right-auto top-full mt-1.5 z-50 sm:min-w-[240px] rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-card shadow-xl p-1.5 max-h-[min(60dvh,340px)] overflow-y-auto">
            {businesses.map((b) => (
              <Link
                key={b.id}
                href={pathname.replace(currentId, b.id)}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors",
                  b.id === currentId
                    ? "bg-zinc-100 dark:bg-zinc-800 text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <BusinessIcon name={b.name} color={b.color} size="sm" />
                <span className="truncate">{b.name}</span>
              </Link>
            ))}
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl border-t border-zinc-100 dark:border-zinc-800 mt-1"
            >
              ← Về trang tổng quan
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
