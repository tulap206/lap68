import { Suspense } from "react"
import TransactionsPage from "./transactions-content"
import { SkeletonTable } from "@/components/ui/skeleton-loader"

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6"><SkeletonTable /></div>}>
      <TransactionsPage />
    </Suspense>
  )
}
