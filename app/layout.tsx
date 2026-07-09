import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "sonner"
import { AuthProvider } from "@/contexts/auth-context"
import "./globals.css"

export const metadata: Metadata = {
  title: "LAP68 — Quản lý dòng tiền",
  description: "Theo dõi thu chi kinh doanh cá nhân",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className="dark">
      <body className="dark-grain min-h-screen">
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors theme="dark" />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
