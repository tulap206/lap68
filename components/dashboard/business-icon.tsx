"use client";

import React from "react";
import {
  Bike,
  Car,
  Camera,
  Landmark,
  Coins,
  CircleDollarSign,
  Globe,
  Code,
  Laptop,
  Briefcase,
  Layers,
  Store,
  Building2,
  Coffee,
  ShoppingBag,
  Gem,
  Scale,
  FolderKanban,
  Wrench,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BusinessIconProps {
  name: string;
  code?: string | null;
  color?: string | null;
  icon?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function getIconComponent(name: string, code?: string | null, icon?: string | null): LucideIcon {
  if (icon) {
    const ic = icon.toLowerCase();
    if (ic === "bike" || ic === "motorcycle") return Bike;
    if (ic === "car") return Car;
    if (ic === "camera" || ic === "cctv") return Camera;
    if (ic === "landmark" || ic === "bank") return Landmark;
    if (ic === "coins" || ic === "money") return Coins;
    if (ic === "globe" || ic === "web") return Globe;
    if (ic === "code") return Code;
    if (ic === "laptop") return Laptop;
    if (ic === "store" || ic === "shop") return Store;
    if (ic === "coffee") return Coffee;
    if (ic === "building") return Building2;
    if (ic === "bag") return ShoppingBag;
    if (ic === "gem") return Gem;
  }

  const str = `${name} ${code || ""}`.toLowerCase();

  // 1. Xe / Cho thuê xe / Phương tiện
  if (str.includes("xe") || str.includes("moto") || str.includes("bike") || str.includes("thuê xe")) {
    return Bike;
  }
  if (str.includes("ô tô") || str.includes("oto") || str.includes("car") || str.includes("tải")) {
    return Car;
  }

  // 2. Camera / Giám sát / An ninh
  if (str.includes("camera") || str.includes("cctv") || str.includes("an ninh") || str.includes("quan sát")) {
    return Camera;
  }

  // 3. Cầm đồ / Đầu tư / Tài chính / Vốn
  if (str.includes("cầm đồ") || str.includes("cam do") || str.includes("đại anh") || str.includes("79")) {
    return Landmark;
  }
  if (str.includes("đầu tư") || str.includes("tài chính") || str.includes("vốn") || str.includes("coin") || str.includes("tiền")) {
    return Coins;
  }
  if (str.includes("vàng") || str.includes("bạc") || str.includes("trang sức") || str.includes("gem")) {
    return Gem;
  }

  // 4. Web / IT / Thiết kế / Lập trình
  if (str.includes("web") || str.includes("website") || str.includes("internet") || str.includes("online")) {
    return Globe;
  }
  if (str.includes("code") || str.includes("phần mềm") || str.includes("app") || str.includes("dev")) {
    return Code;
  }
  if (str.includes("thiết kế") || str.includes("design") || str.includes("media") || str.includes("marketing")) {
    return Laptop;
  }

  // 5. Bất động sản / Cửa hàng / Cafe
  if (str.includes("nhà") || str.includes("đất") || str.includes("bất động sản") || str.includes("bds") || str.includes("căn hộ")) {
    return Building2;
  }
  if (str.includes("cafe") || str.includes("cà phê") || str.includes("quán") || str.includes("ăn") || str.includes("uống")) {
    return Coffee;
  }
  if (str.includes("shop") || str.includes("bán lẻ") || str.includes("hàng hóa") || str.includes("quần áo")) {
    return ShoppingBag;
  }
  if (str.includes("sửa chữa") || str.includes("bảo dưỡng") || str.includes("gara")) {
    return Wrench;
  }

  // 6. Mặc định
  return FolderKanban;
}

export function BusinessIcon({
  name,
  code,
  color = "#10b981",
  icon,
  className,
  size = "md",
}: BusinessIconProps) {
  const IconComponent = getIconComponent(name, code, icon);
  const themeColor = color || "#3b82f6";

  const sizeClasses = {
    sm: "w-7 h-7 rounded-lg",
    md: "w-9 h-9 rounded-xl",
    lg: "w-11 h-11 rounded-2xl",
    xl: "w-14 h-14 rounded-2xl",
  };

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4.5 w-4.5",
    lg: "h-5.5 w-5.5",
    xl: "h-7 w-7",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center shrink-0 transition-transform duration-200 shadow-xs relative overflow-hidden",
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: `${themeColor}18`, // 10% opacity tint
        color: themeColor,
        border: `1px solid ${themeColor}30`,
      }}
    >
      <IconComponent className={cn(iconSizes[size], "shrink-0")} />
    </div>
  );
}
