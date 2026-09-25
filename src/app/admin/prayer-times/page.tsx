import { Metadata } from "next";
import {
  getMosqueSettings,
  getRecentPrayerDates,
  getTodayPrayerTimes,
  getUpcomingPrayerDates,
} from "@/lib/queries/public";
import { MOSQUE_TIMEZONE, localDateInTimeZone } from "@/lib/prayer-times";
import { PrayerTimesClient } from "@/components/admin/prayer-times-client";

export const metadata: Metadata = {
  title: "Prayer Times",
};

export default async function AdminPrayerTimesPage() {
  const settings = await getMosqueSettings();
  const timezone = settings?.timezone || MOSQUE_TIMEZONE;
  const [upcoming, recent] = await Promise.all([
    getUpcomingPrayerDates(7, timezone),
    getRecentPrayerDates(7, timezone),
  ]);
  const todayDate = localDateInTimeZone(new Date(), timezone);
  const today =
    upcoming.find((prayerTime) => prayerTime.date === todayDate) ??
    (await getTodayPrayerTimes(todayDate, timezone));

  return (
    <PrayerTimesClient upcoming={upcoming} recent={recent} today={today} />
  );
}
