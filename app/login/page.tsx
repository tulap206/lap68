"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Wallet, ShieldCheck, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isLoading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ username: "", password: "" });

  useEffect(() => {
    if (!authLoading && user) router.push("/dashboard");
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const result = await login(formData.username, formData.password);
    if (result.success) {
      router.push("/dashboard");
    } else {
      setError(result.error || "Tên đăng nhập hoặc mật khẩu chưa chính xác");
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 sm:p-6 safe-top safe-bottom relative overflow-hidden bg-background">
      {/* AMBIENT BACKGROUND GLOW */}
      <div
        className="absolute inset-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 50% at 50% 10%, rgba(16,185,129,0.06), transparent), radial-gradient(ellipse 50% 40% at 80% 90%, rgba(59,130,246,0.04), transparent)",
        }}
      />

      <div className="relative w-full max-w-[400px] z-10 flex flex-col items-center gap-6">
        {/* LOGO & TITLE */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center shadow-md ring-4 ring-black/5 dark:ring-white/5">
            <Wallet className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center justify-center gap-1.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                LAP68
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                PRO
              </span>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1 max-w-xs">
              Hệ thống quản lý dòng tiền & tài chính kinh doanh
            </p>
          </div>
        </div>

        {/* GLASS CARD FORM */}
        <form
          onSubmit={handleSubmit}
          className="w-full rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-card/90 dark:bg-card/95 backdrop-blur-2xl p-6 sm:p-7 space-y-4 shadow-sm"
        >
          {error && (
            <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 px-4 py-3 text-xs font-semibold text-rose-700 dark:text-rose-400 text-center">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              Tên đăng nhập
            </Label>
            <Input
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              placeholder="admin"
              required
              autoComplete="username"
              className="rounded-xl h-11 text-sm bg-zinc-100/60 dark:bg-zinc-800/60 border-none focus-visible:ring-1"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              Mật khẩu
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="pr-10 rounded-xl h-11 text-sm bg-zinc-100/60 dark:bg-zinc-800/60 border-none focus-visible:ring-1"
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 font-semibold rounded-xl text-sm bg-zinc-900 text-zinc-100 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 transition-all active:scale-[0.98] shadow-xs mt-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Đăng nhập hệ thống"
            )}
          </Button>

          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Độc lập • Bảo mật • Đồng bộ thời gian thực</span>
          </div>
        </form>
      </div>
    </div>
  );
}

