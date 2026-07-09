import { BusinessLayoutShell } from "@/components/dashboard/business-layout-shell"

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return <BusinessLayoutShell>{children}</BusinessLayoutShell>
}
