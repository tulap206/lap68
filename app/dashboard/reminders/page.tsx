"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SkeletonMetricCards } from "@/components/ui/skeleton-loader";
import { ModulePageShell } from "@/components/dashboard/module-shell";

export default function RemindersRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/calendar?view=agenda");
  }, [router]);

  return (
    <ModulePageShell module="cashflow">
      <div className="space-y-6">
        <SkeletonMetricCards />
      </div>
    </ModulePageShell>
  );
}
