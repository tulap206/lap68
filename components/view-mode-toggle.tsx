"use client";

import * as React from "react";
import { Monitor, Smartphone, SlidersHorizontal } from "lucide-react";
import { useViewMode, ViewMode } from "@/contexts/view-mode-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ViewModeToggleProps {
  className?: string;
  variant?: "button" | "segmented" | "compact-pill";
  size?: "sm" | "default" | "icon";
}

export function ViewModeToggle({
  className,
  variant = "button",
  size = "icon",
}: ViewModeToggleProps) {
  const { viewMode, setViewMode, mounted } = useViewMode();

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
      <div
        className={cn(
          "apple-segmented p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60",
          className
        )}
      >
        <button
          type="button"
          onClick={() => setViewMode("auto")}
          className={cn(
            "apple-segmented-item flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all",
            viewMode === "auto" && "active"
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-500" />
          <span>Tự động</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode("desktop")}
          className={cn(
            "apple-segmented-item flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all",
            viewMode === "desktop" && "active"
          )}
        >
          <Monitor className="h-3.5 w-3.5 text-blue-500" />
          <span>Máy tính</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode("mobile")}
          className={cn(
            "apple-segmented-item flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all",
            viewMode === "mobile" && "active"
          )}
        >
          <Smartphone className="h-3.5 w-3.5 text-emerald-500" />
          <span>Di động</span>
        </button>
      </div>
    );
  }

  if (variant === "compact-pill") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-0.5 p-1 rounded-full bg-zinc-100/90 dark:bg-zinc-800/90 border border-zinc-200/80 dark:border-zinc-700/80 text-xs shadow-xs",
          className
        )}
      >
        <button
          type="button"
          onClick={() => setViewMode("desktop")}
          className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition-all",
            viewMode === "desktop"
              ? "bg-white dark:bg-zinc-700 text-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
          title="Chế độ giao diện Máy tính"
        >
          <Monitor className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Desktop</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode("mobile")}
          className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition-all",
            viewMode === "mobile"
              ? "bg-white dark:bg-zinc-700 text-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
          title="Chế độ giao diện Di động"
        >
          <Smartphone className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Mobile</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode("auto")}
          className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full font-medium transition-all",
            viewMode === "auto"
              ? "bg-white dark:bg-zinc-700 text-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          )}
          title="Chế độ Tự động theo kích thước màn hình"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Auto</span>
        </button>
      </div>
    );
  }

  // Quick cycle toggle button
  const cycleMode = () => {
    const modes: ViewMode[] = ["auto", "desktop", "mobile"];
    const nextIndex = (modes.indexOf(viewMode) + 1) % modes.length;
    setViewMode(modes[nextIndex]);
  };

  const getLabel = () => {
    if (viewMode === "desktop") return "Giao diện: Máy tính (Desktop)";
    if (viewMode === "mobile") return "Giao diện: Di động (Mobile)";
    return "Giao diện: Tự động (Responsive)";
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      onClick={cycleMode}
      className={cn(
        "relative rounded-full text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-transform active:scale-95 shrink-0",
        size === "icon" && "h-9 w-9",
        className
      )}
      title={getLabel()}
      aria-label={getLabel()}
    >
      {viewMode === "desktop" && <Monitor className="h-4.5 w-4.5 text-blue-500" />}
      {viewMode === "mobile" && <Smartphone className="h-4.5 w-4.5 text-emerald-500" />}
      {viewMode === "auto" && <SlidersHorizontal className="h-4.5 w-4.5 text-zinc-500" />}
      <span className="sr-only">{getLabel()}</span>
    </Button>
  );
}
