import { Metadata } from "next";
import { getMosqueSettings } from "@/lib/queries/public";
import { SettingsClient } from "@/components/admin/settings-client";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function AdminSettingsPage() {
  const settings = await getMosqueSettings();
  return <SettingsClient settings={settings} />;
}
