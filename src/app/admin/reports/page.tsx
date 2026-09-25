import { Metadata } from "next";

import { ReportsClient } from "@/components/admin/reports-client";
import { getFunds } from "@/lib/queries/admin";
import { getMosqueSettings } from "@/lib/queries/public";

export const metadata: Metadata = {
  title: "Financial Reports",
};

export default async function AdminReportsPage() {
  const [funds, settings] = await Promise.all([getFunds(), getMosqueSettings()]);

  return (
    <ReportsClient
      funds={funds.map((fund) => ({ id: fund.id, name: fund.name }))}
      currency={settings?.currency || "৳"}
    />
  );
}
