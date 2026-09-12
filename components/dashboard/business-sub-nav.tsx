"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Receipt, Tag, CalendarClock } from "lucide-react";

const tabs = (businessId: string) => [
  { label: "Tổng quan", href: `/dashboard/b/${businessId}`, icon: LayoutDashboard },
  { label: "Giao dịch", href: `/dashboard/b/${businessId}/transactions`, icon: Receipt },
  { label: "Danh mục", href: `/dashboard/b/${businessId}/categories`, icon: Tag },
  { label: "Lịch thu/chi", href: `/dashboard/b/${businessId}/schedules`, icon: CalendarClock },
];

export function BusinessSubNav({ businessId }: { businessId: string }) {
  const pathname = usePathname();
  const items = tabs(businessId);

  return (
    <div className="mb-5 overflow-x-auto pb-1 scrollbar-hide">
      <div className="inline-flex p-1 bg-zinc-200/60 dark:bg-zinc-800/70 backdrop-blur-md rounded-2xl border border-black/[0.04] dark:border-white/[0.06] gap-1">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap active:scale-[0.98]",
                active
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

