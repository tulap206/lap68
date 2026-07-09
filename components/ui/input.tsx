import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-xl border border-border bg-input px-3 py-1 text-sm text-foreground shadow-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-green-500 focus-visible:ring-green-500/25 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
