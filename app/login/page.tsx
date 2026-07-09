"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2, Wallet } from "lucide-react"

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
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (user) return null

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/97 via-slate-950/93 to-emerald-950/85" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-700/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md z-10 flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-20 h-20 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-900/40 ring-2 ring-emerald-500/30">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black italic uppercase text-white tracking-tight">
              LAP<span className="text-emerald-400">68</span>
            </h1>
            <p className="text-slate-400 text-sm mt-2">Quản lý dòng tiền kinh doanh cá nhân</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 space-y-5">
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-slate-300">Tên đăng nhập</Label>
            <Input
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="admin"
              className="bg-white/10 border-white/10 text-white placeholder:text-slate-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Mật khẩu</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-white/10 border-white/10 text-white pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Đăng nhập"}
          </Button>
        </form>
      </div>
    </div>
  )
}
