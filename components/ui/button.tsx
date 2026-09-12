import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 active:scale-[0.97] select-none",
  {
    variants: {
      variant: {
        default: "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-xs font-semibold",
        primary: "bg-[#007aff] text-white hover:bg-[#0071e3] shadow-xs font-semibold",
        destructive:
          "bg-rose-600 text-white hover:bg-rose-700 shadow-xs",
        outline: "border border-zinc-200 dark:border-zinc-800 bg-card hover:bg-zinc-100/70 dark:hover:bg-zinc-800 text-foreground font-medium",
        secondary: "bg-zinc-100 dark:bg-zinc-800/80 text-foreground hover:bg-zinc-200/70 dark:hover:bg-zinc-800 font-medium",
        ghost: "hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-muted-foreground hover:text-foreground",
        link: "text-zinc-900 dark:text-zinc-100 underline-offset-4 hover:underline",
        pill: "rounded-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 font-semibold shadow-xs",
        glass: "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800 text-foreground hover:bg-white shadow-xs",
      },
      size: {
        default: "h-9 px-4 py-2 text-sm",
        sm: "h-8 rounded-lg px-3 text-xs font-medium",
        lg: "h-10.5 rounded-xl px-5 text-sm font-semibold",
        pill: "h-8.5 px-4 rounded-full text-xs font-semibold",
        icon: "size-8.5 rounded-xl",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };

