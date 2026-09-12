import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.05] px-3.5 py-1.5 text-base sm:text-sm text-foreground transition-all outline-none placeholder:text-muted-foreground/70 focus-visible:bg-card focus-visible:border-[#007aff] focus-visible:ring-4 focus-visible:ring-[#007aff]/15 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };

