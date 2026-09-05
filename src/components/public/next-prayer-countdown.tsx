"use client";

import { useSyncExternalStore } from "react";
import { timePartsInTimeZone, MOSQUE_TIMEZONE } from "@/lib/utils/time-zone";
import { formatTime } from "@/lib/utils/format";

export interface PrayerSlot {
  name: string;
  time: string;
}

interface NextPrayerCountdownProps {
  prayers: PrayerSlot[];
  timezone?: string;
}

function subscribe(callback: () => void) {
  const id = setInterval(callback, 1000);
  return () => clearInterval(id);
}

function findNextPrayer(currentMin: number, prayers: PrayerSlot[]) {
  let next: PrayerSlot | null = null;
  let targetMin = 0;

  for (const p of prayers) {
    const [h, m] = p.time.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) continue;
    const pMin = h * 60 + m;
    if (pMin > currentMin) {
      next = p;
      targetMin = pMin;
      break;
    }
  }

  if (!next && prayers.length > 0) {
    const first = prayers.reduce((a, b) => {
      const [ah] = a.time.split(":").map(Number);
      const [bh] = b.time.split(":").map(Number);
      return bh < ah ? b : a;
    });
    const [h, m] = first.time.split(":").map(Number);
    return { prayer: first, targetMin: h * 60 + m + 1440, tomorrow: true };
  }

  return next ? { prayer: next, targetMin, tomorrow: false } : null;
}

export function NextPrayerCountdown({
  prayers,
  timezone = MOSQUE_TIMEZONE,
}: NextPrayerCountdownProps) {
  const now = useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / 1000),
    () => 0
  );

  const renderClock = (hours: string, minutes: string, seconds: string) => {
    const units = ["H", "M", "S"];
    const values = [hours, minutes, seconds];
    return (
      <div className="flex items-center gap-2">
        {units.map((unit, i) => (
          <div key={unit} className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <span className="rounded-lg bg-white/15 px-3 py-2 text-2xl font-bold tabular-nums text-white min-w-[3.5rem] text-center backdrop-blur-sm">
                {values[i]}
              </span>
              <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-emerald-200/60">
                {unit}
              </span>
            </div>
            {i < units.length - 1 && (
              <span className="mb-4 text-xl font-bold text-[#C8A951]">:</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (now === 0) {
    return renderClock("--", "--", "--");
  }

  const time = timePartsInTimeZone(new Date(now * 1000), timezone);
  const currentMin = time.hours * 60 + time.minutes;
  const next = findNextPrayer(currentMin, prayers);

  if (!next) return null;

  const diffSeconds = (next.targetMin - currentMin) * 60 - time.seconds;
  const safe = Math.max(0, diffSeconds);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:justify-center sm:text-center">
      <div>
        <p className="text-3xl font-bold text-[#C8A951]">{next.prayer.name}</p>
        <p className="text-sm text-emerald-100 mt-1">
          {next.tomorrow
            ? "(after Isha, until tomorrow Fajr)"
            : `at ${formatTime(next.prayer.time)}`}
        </p>
      </div>
      {renderClock(
        pad(Math.floor(safe / 3600)),
        pad(Math.floor((safe % 3600) / 60)),
        pad(safe % 60)
      )}
    </div>
  );
}