import { Sun, Sunrise } from "lucide-react";
import { formatTime } from "@/lib/utils/format";
import type { PrayerTime } from "@/types/database";

interface PrayerCardProps {
  prayerTime: PrayerTime;
}

const prayers = [
  {
    name: "Fajr",
    icon: Sunrise,
    adhanKey: "fajr_adhan" as const,
    jamaatKey: "fajr_jamaat" as const,
  },
  {
    name: "Dhuhr",
    icon: Sun,
    adhanKey: "dhuhr_adhan" as const,
    jamaatKey: "dhuhr_jamaat" as const,
  },
  {
    name: "Asr",
    icon: Sun,
    adhanKey: "asr_adhan" as const,
    jamaatKey: "asr_jamaat" as const,
  },
  {
    name: "Maghrib",
    icon: Sunrise,
    adhanKey: "maghrib_adhan" as const,
    jamaatKey: "maghrib_jamaat" as const,
  },
  {
    name: "Isha",
    icon: Sunrise,
    adhanKey: "isha_adhan" as const,
    jamaatKey: "isha_jamaat" as const,
  },
];

export function PrayerCard({ prayerTime }: PrayerCardProps) {
  return (
    <div className="rounded-2xl bg-white shadow-sm border border-border overflow-hidden">
      <div className="bg-[#064E3B] px-5 py-3">
        <p className="text-sm font-semibold text-[#C8A951]">
          {new Date(prayerTime.date).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="divide-y divide-border">
        {prayers.map((prayer) => {
          const Icon = prayer.icon;
          return (
            <div
              key={prayer.name}
              className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-[#C8A951]" />
                <span className="text-sm font-medium text-foreground">
                  {prayer.name}
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Adhan
                  </p>
                  <p className="font-semibold text-foreground">
                    {formatTime(prayerTime[prayer.adhanKey])}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Jamaat
                  </p>
                  <p className="font-bold text-[#064E3B]">
                    {formatTime(prayerTime[prayer.jamaatKey])}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        <div className="flex items-center justify-between px-5 py-3 bg-muted/30">
          <div className="flex items-center gap-3">
            <Sun className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-foreground">Sunrise</span>
          </div>
          <span className="text-sm font-semibold text-foreground">
            {formatTime(prayerTime.sunrise)}
          </span>
        </div>
      </div>
    </div>
  );
}
