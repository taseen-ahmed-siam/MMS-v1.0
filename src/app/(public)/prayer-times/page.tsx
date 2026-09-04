import { Metadata } from "next";
import { Clock, Calendar } from "lucide-react";
import {
  getTodayPrayerTimes,
  getRecentPrayerDates,
  getLatestJummah,
} from "@/lib/queries/public";
import { PageHeader } from "@/components/public/page-header";
import { SectionHeading } from "@/components/public/section-heading";
import { PrayerCard } from "@/components/public/prayer-card";
import { CountdownTimer } from "@/components/public/countdown-timer";
import { formatTime, formatDate } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Prayer Times",
  description:
    "View today's prayer times, weekly schedule, and Jumu'ah congregation timings at Al-Noor Mosque.",
};

function getNextPrayerFromTimes(prayerTime: {
  fajr_jamaat: string;
  fajr_adhan: string;
  sunrise: string;
  dhuhr_jamaat: string;
  dhuhr_adhan: string;
  asr_jamaat: string;
  asr_adhan: string;
  maghrib_jamaat: string;
  maghrib_adhan: string;
  isha_jamaat: string;
  isha_adhan: string;
}): { name: string; time: string } | null {
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();

  const prayers: { name: string; time: string }[] = [
    { name: "Fajr", time: prayerTime.fajr_jamaat || prayerTime.fajr_adhan },
    { name: "Sunrise", time: prayerTime.sunrise },
    { name: "Dhuhr", time: prayerTime.dhuhr_jamaat || prayerTime.dhuhr_adhan },
    { name: "Asr", time: prayerTime.asr_jamaat || prayerTime.asr_adhan },
    { name: "Maghrib", time: prayerTime.maghrib_jamaat || prayerTime.maghrib_adhan },
    { name: "Isha", time: prayerTime.isha_jamaat || prayerTime.isha_adhan },
  ];

  for (const p of prayers) {
    const [h, m] = p.time.split(":").map(Number);
    const prayerMin = h * 60 + m;
    if (prayerMin > currentMin) {
      return { name: p.name, time: p.time };
    }
  }
  return null;
}

export default async function PrayerTimesPage() {
  const todayPrayer = await getTodayPrayerTimes();
  const recentDates = await getRecentPrayerDates(7);
  const jummah = await getLatestJummah();

  const nextPrayer = todayPrayer ? getNextPrayerFromTimes(todayPrayer) : null;

  return (
    <div>
      <PageHeader
        showBismillah
        title="Prayer Times"
        description="Never miss a prayer. View the daily and weekly schedule for all five prayers."
      />

      {/* NEXT PRAYER COUNTDOWN */}
      {nextPrayer && (
        <section className="bg-gradient-to-br from-[#064E3B] via-[#065F46] to-[#043d2e] py-10 islamic-pattern-dark">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <CountdownTimer
              nextPrayerTime={nextPrayer.time}
              nextPrayerName={nextPrayer.name}
            />
          </div>
        </section>
      )}

      {/* TODAY'S PRAYER TIMES */}
      <section className="py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Today"
            title="Prayer Schedule"
            description="Adhan and Jamaat times for all five daily prayers."
          />
          {todayPrayer ? (
            <div className="mx-auto mt-8 max-w-xl">
              <PrayerCard prayerTime={todayPrayer} />
            </div>
          ) : (
            <div className="mx-auto mt-8 max-w-xl text-center">
              <div className="rounded-2xl border border-border bg-card p-10 shadow-sm">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground/40" />
                <p className="mt-4 text-lg font-medium text-foreground">
                  Prayer times not available yet
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Please check back later or contact the mosque administration.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* JUMMU'AH SCHEDULE */}
      {jummah.length > 0 && (
        <section className="py-16 bg-card islamic-pattern">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Friday"
              title="Jumu&apos;ah Schedule"
              description="Khutbah and Jamaat times for the upcoming Friday congregations."
            />
            <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-2">
              {jummah.map((j) => (
                <div
                  key={j.id}
                  className="rounded-2xl border border-border bg-background p-6 shadow-sm"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        Jumu&apos;ah — Session {j.session_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(j.date, "EEEE, MMMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>
                      Khutbah: <span className="font-medium text-foreground">{formatTime(j.khutbah_time)}</span>
                    </p>
                    <p>
                      Jamaat: <span className="font-bold text-primary">{formatTime(j.jamaat_time)}</span>
                    </p>
                    {j.imam_name && (
                      <p>
                        Imam: <span className="font-medium text-foreground">{j.imam_name}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* RECENT WEEK */}
      {recentDates.length > 0 && (
        <section className="py-16 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="This Week"
              title="Recent Schedule"
            />

            {/* Desktop Table */}
            <div className="mx-auto mt-8 max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-sm hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#064E3B] text-white">
                    <th className="px-4 py-3 text-left font-semibold">Date</th>
                    <th className="px-4 py-3 text-center font-semibold">Fajr</th>
                    <th className="px-4 py-3 text-center font-semibold">Sunrise</th>
                    <th className="px-4 py-3 text-center font-semibold">Dhuhr</th>
                    <th className="px-4 py-3 text-center font-semibold">Asr</th>
                    <th className="px-4 py-3 text-center font-semibold">Maghrib</th>
                    <th className="px-4 py-3 text-center font-semibold">Isha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentDates.map((pt) => (
                    <tr key={pt.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">
                        {formatDate(pt.date, "EEE, MMM d")}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">
                        {formatTime(pt.fajr_jamaat)}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">
                        {formatTime(pt.sunrise)}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">
                        {formatTime(pt.dhuhr_jamaat)}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">
                        {formatTime(pt.asr_jamaat)}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">
                        {formatTime(pt.maghrib_jamaat)}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">
                        {formatTime(pt.isha_jamaat)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="mx-auto mt-8 grid gap-4 md:hidden">
              {recentDates.map((pt) => (
                <div
                  key={pt.id}
                  className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                >
                  <p className="mb-3 text-sm font-semibold text-foreground">
                    {formatDate(pt.date, "EEEE, MMM d, yyyy")}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { label: "Fajr", jamaat: pt.fajr_jamaat },
                      { label: "Sunrise", jamaat: pt.sunrise },
                      { label: "Dhuhr", jamaat: pt.dhuhr_jamaat },
                      { label: "Asr", jamaat: pt.asr_jamaat },
                      { label: "Maghrib", jamaat: pt.maghrib_jamaat },
                      { label: "Isha", jamaat: pt.isha_jamaat },
                    ].map((p) => (
                      <div key={p.label} className="flex justify-between rounded-lg bg-muted/50 px-3 py-2">
                        <span className="text-muted-foreground">{p.label}</span>
                        <span className="font-medium text-foreground">
                          {formatTime(p.jamaat)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
