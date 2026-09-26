"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ViewMode = "auto" | "desktop" | "mobile";

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isEffectiveMobile: boolean;
  isEffectiveDesktop: boolean;
  mounted: boolean;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);
const VIEW_MODE_KEY = "lap68_view_mode";

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewModeState] = useState<ViewMode>("auto");
  const [isScreenSmall, setIsScreenSmall] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read saved preference
    try {
      const saved = localStorage.getItem(VIEW_MODE_KEY) as ViewMode | null;
      if (saved && (saved === "auto" || saved === "desktop" || saved === "mobile")) {
        setViewModeState(saved);
      }
    } catch {
      // ignore
    }

    const checkSize = () => {
      setIsScreenSmall(window.innerWidth < 1024);
    };

    checkSize();
    setMounted(true);

    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch {
      // ignore
    }
  };

  const isEffectiveMobile =
    viewMode === "mobile" || (viewMode === "auto" && isScreenSmall);

  const isEffectiveDesktop =
    viewMode === "desktop" || (viewMode === "auto" && !isScreenSmall);

  return (
    <ViewModeContext.Provider
      value={{
        viewMode,
        setViewMode,
        isEffectiveMobile,
        isEffectiveDesktop,
        mounted,
      }}
    >
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error("useViewMode must be used within a ViewModeProvider");
  }
  return context;
}
