import { cn } from "@/lib/utils"
import { moduleBadgeClass } from "./module-shell"
import type { TransactionType } from "@/lib/supabase"

export function TransactionTypeBadge({ type }: { type: TransactionType }) {
  return (
    <span
      className={cn(
        moduleBadgeClass,
        type === "income" ? "badge-income" : "badge-expense"
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
  return <span className="text-zinc-400">{labels[method] || method}</span>
}
