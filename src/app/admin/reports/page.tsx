import { requirePermission } from "@/lib/access";
import { Metadata } from "next";

import { ReportsClient } from "@/components/admin/reports-client";
import { getFunds } from "@/lib/queries/admin";
import { getMosqueSettings } from "@/lib/queries/public";

export const metadata: Metadata = {
  title: "Financial Reports",
};

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  await requirePermission("reports.view");

  const [funds, settings] = await Promise.all([getFunds(), getMosqueSettings()]);

  return (
    <ReportsClient
      funds={funds.map((fund) => ({ id: fund.id, name: fund.name }))}
      currency={settings?.currency || "à§³"}
    />
  );
}
