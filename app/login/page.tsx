"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2, Wallet, TrendingUp } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { login, user, isLoading: authLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({ username: "", password: "" })

  useEffect(() => {
    if (!authLoading && user) router.push("/dashboard")
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    const result = await login(formData.username, formData.password)
    if (result.success) {
      router.push("/dashboard")
    } else {
      setError(result.error || "Đăng nhập thất bại")
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    )
  }

  if (user) return null

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(239,68,68,0.08),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(34,197,94,0.1),transparent_50%)]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />

      <div className="relative w-full max-w-md z-10 flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800 glow-green">
              <Wallet className="w-9 h-9 text-green-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-lg bg-red-600 flex items-center justify-center border-2 border-black">
              <TrendingUp className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-black italic uppercase text-white tracking-tight">
              LAP<span className="text-red-500">68</span>
            </h1>
            <p className="text-zinc-500 text-sm mt-2 max-w-xs">
              Quản lý dòng tiền kinh doanh cá nhân
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="w-full glass-panel rounded-2xl p-8 space-y-5 shadow-2xl shadow-black/50">
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/25 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label>Tên đăng nhập</Label>
            <Input
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="admin"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Mật khẩu</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl border border-green-500/30 shadow-lg shadow-green-900/30"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Đăng nhập"}
          </Button>

          <p className="text-center text-xs text-zinc-600">
            Thu <span className="text-green-500">xanh</span> · Chi <span className="text-red-500">đỏ</span> · Dòng tiền rõ ràng
          </p>
        </form>
      </div>
    </div>
  )
}
