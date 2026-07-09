"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { AccentButton } from "@/components/dashboard/module-shell"
import { adjustBusinessCapital, setBusinessOpeningCapital } from "@/lib/supabase"
import { parseBusinessCapital, capitalAdjustLabel } from "@/lib/capital"
import { displayMoney, formatMoneyInput, parseMoneyInput } from "@/lib/format-money"
import type { Business } from "@/lib/types"
import { cn } from "@/lib/utils"

type Mode = "adjust" | "opening"

export function CapitalAdjustDialog({
  open,
  onOpenChange,
  businesses,
  defaultBusinessId,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  businesses: Business[]
  defaultBusinessId?: string
  onSuccess?: () => void
}) {
  const { logAction } = useAuth()
  const [mode, setMode] = useState<Mode>("adjust")
  const [businessId, setBusinessId] = useState(defaultBusinessId || businesses[0]?.id || "")
  const [adjustType, setAdjustType] = useState<"deposit" | "withdraw">("deposit")
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [openingAmount, setOpeningAmount] = useState("")
  const [saving, setSaving] = useState(false)

  const selected = businesses.find((b) => b.id === businessId)
  const meta = selected ? parseBusinessCapital(selected.ghi_chu) : null

  useEffect(() => {
    if (open) {
      setBusinessId(defaultBusinessId || businesses[0]?.id || "")
      setMode("adjust")
      setAdjustType("deposit")
      setAmount("")
      setNote("")
      if (selected) {
        setOpeningAmount(formatMoneyInput(String(parseBusinessCapital(selected.ghi_chu).opening_capital || "")))
      }
    }
  }, [open, defaultBusinessId, businesses])

  useEffect(() => {
    if (!selected) return
    setOpeningAmount(formatMoneyInput(String(parseBusinessCapital(selected.ghi_chu).opening_capital || "")))
  }, [businessId, selected])

  const handleSubmit = async () => {
    if (!selected) {
      toast.error("Chọn việc kinh doanh")
      return
    }
    setSaving(true)
    try {
      if (mode === "opening") {
        const opening = parseMoneyInput(openingAmount)
        if (opening < 0) {
          toast.error("Vốn ban đầu không hợp lệ")
          return
        }
        await setBusinessOpeningCapital(selected, opening)
        logAction("Vốn ban đầu", `${selected.name}: ${displayMoney(opening)}`)
        toast.success("Đã cập nhật vốn ban đầu")
      } else {
        const parsed = parseMoneyInput(amount)
        if (parsed <= 0) {
          toast.error("Nhập số tiền")
          return
        }
        await adjustBusinessCapital(selected, adjustType, parsed, note)
        logAction(capitalAdjustLabel(adjustType), `${selected.name}: ${displayMoney(parsed)}`)
        toast.success(adjustType === "deposit" ? "Đã nạp vốn" : "Đã rút vốn")
      }
      onOpenChange(false)
      onSuccess?.()
    } catch {
      toast.error("Không thể lưu")
    } finally {
      setSaving(false)
    }
  }

  if (businesses.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-green-500 to-emerald-700 rounded-t-2xl" />
        <DialogHeader>
          <DialogTitle>Tinh chỉnh vốn</DialogTitle>
          <DialogDescription>
            Nạp/rút vốn chủ hoặc đặt vốn ban đầu — không tính vào thu/chi kinh doanh
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex rounded-lg border border-zinc-800 p-0.5 bg-zinc-900/50">
            {(["adjust", "opening"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "flex-1 rounded-md py-1.5 text-xs font-medium transition-colors",
                  mode === m ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {m === "adjust" ? "Nạp / Rút" : "Vốn ban đầu"}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Việc kinh doanh</Label>
            <Select value={businessId} onValueChange={setBusinessId}>
              <SelectTrigger><SelectValue placeholder="Chọn việc" /></SelectTrigger>
              <SelectContent>
                {businesses.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: b.color }} />
                      {b.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {mode === "adjust" ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Loại</Label>
                  <Select value={adjustType} onValueChange={(v) => setAdjustType(v as "deposit" | "withdraw")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deposit">Nạp vốn</SelectItem>
                      <SelectItem value="withdraw">Rút vốn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Số tiền</Label>
                  <Input
                    className="font-mono"
                    value={amount}
                    onChange={(e) => setAmount(formatMoneyInput(e.target.value))}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Ghi chú</Label>
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: Bổ sung quỹ mặt bằng" />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label>Vốn ban đầu (VND)</Label>
              <Input
                className="font-mono"
                value={openingAmount}
                onChange={(e) => setOpeningAmount(formatMoneyInput(e.target.value))}
              />
              <p className="text-[11px] text-zinc-500">
                Vốn gốc trước khi ghi nhận thu chi. Hiện tại:{" "}
                <span className="text-zinc-400 font-mono">{displayMoney(meta?.opening_capital || 0)}</span>
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Hủy</Button>
            <AccentButton module="cashflow" className="flex-1" onClick={handleSubmit} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu"}
            </AccentButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
