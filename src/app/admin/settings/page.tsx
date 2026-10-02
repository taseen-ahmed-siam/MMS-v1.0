import { requirePermission } from "@/lib/access";
import { Metadata } from "next";
import { getMosqueSettings } from "@/lib/queries/public";
import { SettingsClient } from "@/components/admin/settings-client";

export const metadata: Metadata = {
  title: "Settings",
};

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requirePermission("settings.manage");

  const settings = await getMosqueSettings();
  return <SettingsClient settings={settings} />;
}
