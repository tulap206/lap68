"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

const MAX_PX = 22
const MIN_PX = 11

export function KpiAutoFitValue({
  value,
  className,
}: {
  value: string
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const text = textRef.current
    if (!container || !text) return

    const fit = () => {
      let size = MAX_PX
      text.style.fontSize = `${size}px`
      text.style.lineHeight = "1.15"
      while (text.scrollWidth > container.clientWidth && size > MIN_PX) {
        size -= 0.5
        text.style.fontSize = `${size}px`
      }
    }

    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(container)
    return () => ro.disconnect()
  }, [value])

  const display = value.replace(/ đ$/, "\u00A0đ").replace(/ %$/, "%")

  return (
    <div ref={containerRef} className={cn("w-full min-w-0 overflow-hidden", className)}>
      <span
        ref={textRef}
        className="kpi-value block font-mono font-black tabular-nums whitespace-nowrap"
        style={{ fontSize: `${MAX_PX}px`, lineHeight: 1.15 }}
      >
        {display}
      </span>
    </div>
  )
}
