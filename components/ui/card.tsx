import * as React from "react"
import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-border py-6 shadow-[0_4px_24px_rgba(0,0,0,0.35)]",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("grid gap-2 px-6", className)} {...props} />
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("font-semibold leading-none text-foreground", className)} {...props} />
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-muted-foreground text-sm", className)} {...props} />
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-6", className)} {...props} />
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent }
