import { cn } from "@/lib/utils"
import { moduleBadgeClass } from "./module-shell"
import type { TransactionType } from "@/lib/supabase"

export function TransactionTypeBadge({ type }: { type: TransactionType }) {
  return (
    <span
      className={cn(
        moduleBadgeClass,
        type === "income"
          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
          : "bg-red-50 text-red-700 border-red-100"
      )}
    >
      {type === "income" ? "Thu" : "Chi"}
    </span>
  )
}

export function PaymentMethodLabel({ method }: { method: string }) {
  const labels: Record<string, string> = {
    cash: "Tiền mặt",
    bank: "Chuyển khoản",
    card: "Thẻ",
    other: "Khác",
  }
  return <span>{labels[method] || method}</span>
}
