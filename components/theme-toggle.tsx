"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "button" | "segmented";
  size?: "sm" | "default" | "icon";
}

export function ThemeToggle({
  className,
  variant = "button",
  size = "icon",
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "h-9 w-9 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse",
          className
        )}
      />
    );
  }

  if (variant === "segmented") {
    return (
      <div className={cn("apple-segmented p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60", className)}>
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={cn(
            "apple-segmented-item flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all",
            theme === "light" && "active"
          )}
        >
          <Sun className="h-3.5 w-3.5 text-amber-500" />
          <span>Sáng</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={cn(
            "apple-segmented-item flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all",
            theme === "dark" && "active"
          )}
        >
          <Moon className="h-3.5 w-3.5 text-blue-400" />
          <span>Tối</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme("system")}
          className={cn(
            "apple-segmented-item flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all",
            theme === "system" && "active"
          )}
        >
          <Monitor className="h-3.5 w-3.5 text-zinc-500" />
          <span>Hệ thống</span>
        </button>
      </div>
    );
  }

  const isDark = resolvedTheme === "dark";

  const toggleTheme = () => {
    if (theme === "system") {
      setTheme(isDark ? "light" : "dark");
    } else if (theme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      onClick={toggleTheme}
      className={cn(
        "relative rounded-full text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-transform active:scale-95 shrink-0",
        size === "icon" && "h-9 w-9",
        className
      )}
      title={isDark ? "Chuyển sang giao diện Sáng (Light mode)" : "Chuyển sang giao diện Tối (Dark mode)"}
      aria-label={isDark ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
    >
      <Sun className="h-4.5 w-4.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
      <Moon className="absolute h-4.5 w-4.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400" />
      <span className="sr-only">Chuyển đổi giao diện Sáng / Tối</span>
    </Button>
  );
}
