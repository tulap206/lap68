"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Wallet } from "lucide-react";

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
      setError(result.error || "Đăng nhập thất bại");
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
      <div
        className="absolute inset-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(52,101,56,0.08), transparent), radial-gradient(ellipse 50% 40% at 100% 100%, rgba(159,47,45,0.05), transparent)",
        }}
      />

      <div className="relative w-full max-w-[400px] z-10 flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              LAP68
            </h1>
            <p className="text-muted-foreground text-sm mt-1.5 max-w-xs">
              Quản lý dòng tiền kinh doanh cá nhân
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-full rounded-xl border border-border bg-card p-6 sm:p-7 space-y-5"
        >
          {error && (
            <div className="rounded-lg bg-[var(--pale-red)] border border-transparent px-4 py-3 text-sm text-expense">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label>Tên đăng nhập</Label>
            <Input
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              placeholder="admin"
              required
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <Label>Mật khẩu</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="pr-10"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
            className="w-full h-10 font-medium"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Đăng nhập"
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Thu <span className="text-income font-medium">xanh</span>
            {" · "}
            Chi <span className="text-expense font-medium">đỏ</span>
            {" · "}
            Dòng tiền rõ ràng
          </p>
        </form>
      </div>
    </div>
  );
}
