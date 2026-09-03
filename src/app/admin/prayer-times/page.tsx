import { Metadata } from "next";
import { getTodayPrayerTimes, getRecentPrayerDates } from "@/lib/queries/public";
import { PrayerTimesClient } from "@/components/admin/prayer-times-client";

export const metadata: Metadata = {
  title: "Prayer Times",
};

export default async function AdminPrayerTimesPage() {
  const [data, today] = await Promise.all([
    getRecentPrayerDates(7),
    getTodayPrayerTimes(),
  ]);

  return <PrayerTimesClient data={data} today={today} />;
}
