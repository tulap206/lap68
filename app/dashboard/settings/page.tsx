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
      <div className="space-y-6 w-full">
        <ModuleSubpageHeader
          module="cashflow"
          title="Cài đặt"
          subtitle={`${user.displayName} · LAP68 v2.1`}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          <ModuleSectionCard
            title="Sao lưu dữ liệu"
            description="Trực tuyến trên cloud hoặc xuất/nhập file JSON"
            className="min-h-[min(560px,80vh)]"
          >
            <BackupPanel userId={user.id} onLog={logAction} />
          </ModuleSectionCard>

          <ModuleSectionCard
            title="Lịch sử hoạt động"
            description="10 bản ghi mỗi trang"
            className="min-h-[min(560px,80vh)]"
          >
            <ActivityLogPanel userId={user.id} />
          </ModuleSectionCard>
        </div>
      </div>
    </ModulePageShell>
  )
}
