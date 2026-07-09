"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AccentButton } from "@/components/dashboard/module-shell"
import { savePortfolioSettings } from "@/lib/supabase"
import { displayMoney, formatMoneyInput, parseMoneyInput } from "@/lib/format-money"
import type { LiquidAccount, UserPortfolioSettings } from "@/lib/account-balance"
import { totalLiquidBalance } from "@/lib/account-balance"

type Row = { id: string; name: string; balance: string }

function toRows(accounts: LiquidAccount[]): Row[] {
  return accounts.map((a) => ({
    id: a.id,
    name: a.name,
    balance: formatMoneyInput(String(a.balance || "")),
  }))
}

export function AccountBalanceDialog({
  open,
  onOpenChange,
  settings,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: UserPortfolioSettings
  onSuccess?: () => void
}) {
  const { user, logAction } = useAuth()
  const [rows, setRows] = useState<Row[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setRows(
        settings.liquid_accounts.length > 0
          ? toRows(settings.liquid_accounts)
          : toRows([{ id: crypto.randomUUID(), name: "Ngân hàng chính", balance: 0 }])
      )
    }
  }, [open, settings])

  const addRow = () => {
    setRows((prev) => [...prev, { id: crypto.randomUUID(), name: "", balance: "" }])
  }

  const removeRow = (id: string) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)))
  }

  const updateRow = (id: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const handleSave = async () => {
    if (!user) return
    const accounts: LiquidAccount[] = []
    for (const row of rows) {
      const name = row.name.trim()
      if (!name) {
        toast.error("Nhập tên tài khoản")
        return
      }
      const balance = parseMoneyInput(row.balance)
      if (balance < 0) {
        toast.error("Số dư không hợp lệ")
        return
      }
      accounts.push({ id: row.id, name, balance })
    }

    setSaving(true)
    try {
      await savePortfolioSettings(user.id, {
        liquid_accounts: accounts,
        updated_at: new Date().toISOString(),
        primary_account_id: settings.primary_account_id || accounts[0]?.id || null,
      })
      logAction("Cập nhật số dư TK", `${accounts.length} tài khoản · ${displayMoney(totalLiquidBalance({ liquid_accounts: accounts, updated_at: null }))}`)
      toast.success("Đã lưu số dư tài khoản")
      onOpenChange(false)
      onSuccess?.()
    } catch {
      toast.error("Không thể lưu")
    } finally {
      setSaving(false)
    }
  }

  const previewTotal = rows.reduce((sum, r) => sum + parseMoneyInput(r.balance), 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-sky-500 to-blue-600 rounded-t-2xl" />
        <DialogHeader>
          <DialogTitle>Số dư tài khoản</DialogTitle>
          <DialogDescription>
            Nhập số dư thực tế từ app ngân hàng để đối soát. Sau đó mỗi giao dịch thu/chi sẽ tự cộng hoặc trừ vào tài khoản tương ứng (tiền mặt → TK tiền mặt, chuyển khoản/thẻ → TK ngân hàng).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[50dvh] overflow-y-auto pr-1">
          {rows.map((row) => (
            <div key={row.id} className="rounded-lg border border-zinc-800 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs text-zinc-500">Tài khoản</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-zinc-500 hover:text-red-400"
                  onClick={() => removeRow(row.id)}
                  disabled={rows.length <= 1}
                  aria-label="Xóa tài khoản"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Input
                value={row.name}
                onChange={(e) => updateRow(row.id, { name: e.target.value })}
                placeholder="VD: Vietcombank, Tiền mặt"
              />
              <div className="space-y-1">
                <Label className="text-xs text-zinc-500">Số dư hiện có (VND)</Label>
                <Input
                  className="font-mono"
                  value={row.balance}
                  onChange={(e) => updateRow(row.id, { balance: formatMoneyInput(e.target.value) })}
                  placeholder="0"
                />
              </div>
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" size="sm" className="w-full" onClick={addRow}>
          <Plus className="h-3.5 w-3.5" />
          Thêm tài khoản
        </Button>

        <div className="rounded-lg bg-zinc-900/60 border border-zinc-800 px-3 py-2 flex items-center justify-between">
          <span className="text-xs text-zinc-500">Tổng thanh khoản</span>
          <span className="font-mono font-bold text-sky-400 tabular-nums">{displayMoney(previewTotal)}</span>
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Hủy</Button>
          <AccentButton module="cashflow" className="flex-1" onClick={handleSave} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu"}
          </AccentButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}
