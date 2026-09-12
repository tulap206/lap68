import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 outline-none focus-visible:ring-[#007aff]/30 focus-visible:ring-[3px] active:scale-[0.96] select-none",
  {
    variants: {
      variant: {
        default: "bg-[#007aff] text-white hover:bg-[#0071e3] shadow-[0_2px_8px_rgba(0,122,255,0.25)]",
        dark: "bg-foreground text-background hover:opacity-90 shadow-sm",
        destructive:
          "bg-[#ff3b30] text-white hover:bg-[#e0352b] shadow-[0_2px_8px_rgba(255,59,48,0.25)]",
        outline: "border border-black/[0.08] dark:border-white/[0.1] bg-card/80 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-foreground",
        secondary: "bg-black/[0.06] dark:bg-white/[0.08] text-foreground hover:bg-black/[0.09] dark:hover:bg-white/[0.12]",
        ghost: "hover:bg-black/[0.05] dark:hover:bg-white/[0.07] text-muted-foreground hover:text-foreground",
        link: "text-[#007aff] underline-offset-4 hover:underline",
        pill: "rounded-full bg-[#007aff] text-white hover:bg-[#0071e3] shadow-[0_2px_8px_rgba(0,122,255,0.2)]",
        glass: "bg-white/70 dark:bg-white/10 backdrop-blur-md border border-white/40 dark:border-white/10 text-foreground hover:bg-white/90 shadow-sm",
      },
      size: {
        default: "h-9.5 px-4 py-2 text-sm",
        sm: "h-8 rounded-lg px-3 text-xs font-medium",
        lg: "h-11 rounded-xl px-6 text-sm font-semibold",
        pill: "h-9 px-4 rounded-full text-xs font-semibold",
        icon: "size-9 rounded-xl",
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

