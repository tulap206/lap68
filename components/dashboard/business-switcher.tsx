"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
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
        className="flex w-full sm:w-auto items-center gap-2 rounded-xl border border-border bg-muted/80 px-3 py-2 text-sm text-foreground/90 hover:border-border"
      >
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: current.color }}
        />
        <span className="font-semibold truncate flex-1 text-left sm:max-w-[200px]">
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
          <div className="absolute left-0 right-0 sm:right-auto top-full mt-1 z-50 sm:min-w-[220px] rounded-xl border border-border bg-card shadow-[0_4px_16px_rgba(28,28,26,0.08)] py-1 max-h-[min(60dvh,320px)] overflow-y-auto">
            {businesses.map((b) => (
              <Link
                key={b.id}
                href={pathname.replace(currentId, b.id)}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted",
                  b.id === currentId ? "text-foreground font-medium" : "text-foreground/80",
                )}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: b.color }}
                />
                {b.name}
              </Link>
            ))}
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-xs text-muted-foreground hover:bg-muted border-t border-border mt-1"
            >
              ← Tất cả việc
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
