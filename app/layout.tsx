import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "LAP68 — Quản lý dòng tiền",
  description: "Theo dõi thu chi kinh doanh cá nhân",
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "LAP68",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f6f3",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-dvh font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
        >
          Bỏ qua đến nội dung
        </a>
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors theme="light" />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
