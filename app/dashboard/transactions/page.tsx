"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { fetchBusinesses } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export default function LegacyTransactionsRedirect() {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    fetchBusinesses(user.id).then((biz) => {
      if (biz[0]) router.replace(`/dashboard/b/${biz[0].id}/transactions`)
      else router.replace("/dashboard")
    })
  }, [user, router])

  return (
    <div className="flex justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-green-500" />
    </div>
  )
}
