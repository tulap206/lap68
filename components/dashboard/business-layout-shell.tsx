"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { fetchBusiness, fetchBusinesses } from "@/lib/supabase"
import type { Business } from "@/lib/types"
import { BusinessSwitcher } from "@/components/dashboard/business-switcher"
import { BusinessSubNav } from "@/components/dashboard/business-sub-nav"
import { Loader2 } from "lucide-react"

export function BusinessLayoutShell({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const businessId = params.businessId as string
  const [business, setBusiness] = useState<Business | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const b = await fetchBusiness(businessId)
        if (cancelled) return
        setBusiness(b)
        if (b) {
          const all = await fetchBusinesses(b.user_id)
          if (!cancelled) setBusinesses(all)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [businessId])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    )
  }

  if (!business) {
    return <p className="text-zinc-500">Không tìm thấy việc kinh doanh</p>
  }

  return (
    <div>
      <BusinessSwitcher businesses={businesses} currentId={businessId} />
      <BusinessSubNav businessId={businessId} />
      {children}
    </div>
  )
}
