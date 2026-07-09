"use client"

import { useAuth } from "@/contexts/auth-context"
import { ModulePageShell, ModuleSubpageHeader, ModuleSectionCard } from "@/components/dashboard/module-shell"
import { BackupPanel } from "@/components/dashboard/backup-panel"
import { ActivityLogPanel } from "@/components/dashboard/activity-log-panel"

export default function SettingsPage() {
  const { user, logAction } = useAuth()

  if (!user) return null

  return (
    <ModulePageShell module="cashflow">
      <div className="space-y-6 max-w-4xl">
        <ModuleSubpageHeader
          module="cashflow"
          title="Cài đặt"
          subtitle={`${user.displayName} · LAP68 v2.1`}
        />

        <ModuleSectionCard
          title="Sao lưu dữ liệu"
          description="Trực tuyến trên cloud hoặc xuất/nhập file JSON"
        >
          <BackupPanel userId={user.id} onLog={logAction} />
        </ModuleSectionCard>

        <ModuleSectionCard
          title="Lịch sử hoạt động"
          description="10 bản ghi mỗi trang"
        >
          <ActivityLogPanel userId={user.id} />
        </ModuleSectionCard>
      </div>
    </ModulePageShell>
  )
}
