"use client";

import { useState, useEffect } from "react";
import { countdownToTime } from "@/lib/utils/format";

interface CountdownTimerProps {
  nextPrayerTime: string;
  nextPrayerName: string;
}

export function CountdownTimer({
  nextPrayerTime,
  nextPrayerName,
}: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(() =>
    countdownToTime(nextPrayerTime)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(countdownToTime(nextPrayerTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [nextPrayerTime]);

  const units = [
    { label: "H", value: remaining.hours },
    { label: "M", value: remaining.minutes },
    { label: "S", value: remaining.seconds },
  ];

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm font-medium text-emerald-100/80">
        Next prayer: <span className="font-bold text-[#C8A951]">{nextPrayerName}</span>
      </p>
      <div className="flex items-center gap-2">
        {units.map((unit, i) => (
          <div key={unit.label} className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <span className="rounded-lg bg-white/15 px-3 py-2 text-2xl font-bold tabular-nums text-white min-w-[3.5rem] text-center backdrop-blur-sm">
                {String(unit.value).padStart(2, "0")}
              </span>
              <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-emerald-200/60">
                {unit.label}
              </span>
            </div>
            {i < units.length - 1 && (
              <span className="mb-4 text-xl font-bold text-[#C8A951]">:</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
