import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  MOSQUE_TIMEZONE,
  localDateInTimeZone,
  timePartsInTimeZone,
} from "@/lib/utils/time-zone";
import type { MosqueSetting } from "@/types/database";

export { MOSQUE_TIMEZONE, localDateInTimeZone, timePartsInTimeZone };

export const MOSQUE_LATITUDE = 23.7018;
export const MOSQUE_LONGITUDE = 90.3742;

const JAMAA_OFFSET_MINUTES: Record<string, number> = {
  fajr: 15,
  dhuhr: 25,
  asr: 25,
  maghrib: 5,
  isha: 25,
};

const ALADHAN_METHODS: Record<string, number> = {
  karachi: 1,
  isna: 2,
  "muslim world league": 3,
  makkah: 4,
  egypt: 5,
  tehran: 7,
  gulf: 8,
  kuwait: 9,
  qatar: 10,
  singapore: 11,
  france: 12,
  turkey: 13,
  jafari: 0,
};

export function localDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addMinutesToTime(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const total = h * 60 + m + mins;
  const normalized = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

function methodIdFrom(setting: string | null | undefined): number {
  if (!setting) return 1;
  return ALADHAN_METHODS[setting.trim().toLowerCase()] ?? 1;
}

function schoolFrom(madhab: string | null | undefined): number {
  return (madhab ?? "").trim().toLowerCase() === "hanafi" ? 1 : 0;
}

const getSettings = cache(async function loadSettings(): Promise<MosqueSetting | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("mosque_settings").select("*").limit(1).maybeSingle();
  return (data as MosqueSetting | null) ?? null;
});

interface LocationParams {
  lat: number;
  lng: number;
  method: number;
  school: number;
  tz: string;
}

function resolveParams(settings: MosqueSetting | null): LocationParams {
  return {
    lat: settings?.latitude ?? MOSQUE_LATITUDE,
    lng: settings?.longitude ?? MOSQUE_LONGITUDE,
    method: methodIdFrom(settings?.prayer_calculation_method),
    school: schoolFrom(settings?.prayer_madhab),
    tz: settings?.timezone || MOSQUE_TIMEZONE,
  };
}

export interface AladhanTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

const fetchAladhanTimings = cache(async function fetchAladhanTimings(
  dateIso: string,
  params: LocationParams
): Promise<AladhanTimings | null> {
  const [y, m, d] = dateIso.split("-");
  const url =
    `https://api.aladhan.com/v1/timings/${d}-${m}-${y}` +
    `?latitude=${params.lat}&longitude=${params.lng}&method=${params.method}&school=${params.school}&timezonestring=${encodeURIComponent(params.tz)}`;
  try {
    const res = await fetch(url, { next: { revalidate: 21600 } });
    if (!res.ok) return null;
    const json = await res.json();
    if (json?.code !== 200 || !json?.data?.timings) return null;
    const t = json.data.timings;
    return {
      Fajr: t.Fajr,
      Sunrise: t.Sunrise,
      Dhuhr: t.Dhuhr,
      Asr: t.Asr,
      Maghrib: t.Maghrib,
      Isha: t.Isha,
    };
  } catch {
    return null;
  }
});

function buildPrayerTimeRow(date: string, timings: AladhanTimings): Record<string, unknown> {
  return {
    date,
    fajr_adhan: timings.Fajr,
    fajr_jamaat: addMinutesToTime(timings.Fajr, JAMAA_OFFSET_MINUTES.fajr),
    sunrise: timings.Sunrise,
    dhuhr_adhan: timings.Dhuhr,
    dhuhr_jamaat: addMinutesToTime(timings.Dhuhr, JAMAA_OFFSET_MINUTES.dhuhr),
    asr_adhan: timings.Asr,
    asr_jamaat: addMinutesToTime(timings.Asr, JAMAA_OFFSET_MINUTES.asr),
    maghrib_adhan: timings.Maghrib,
    maghrib_jamaat: addMinutesToTime(timings.Maghrib, JAMAA_OFFSET_MINUTES.maghrib),
    isha_adhan: timings.Isha,
    isha_jamaat: addMinutesToTime(timings.Isha, JAMAA_OFFSET_MINUTES.isha),
    notes: "auto",
    manual_override: false,
  };
}

export async function syncRealPrayerTimes(dates: string[]): Promise<void> {
  const uniqueDates = [...new Set(dates)].sort();
  if (uniqueDates.length === 0) return;

  const [admin, settings] = [createAdminClient(), await getSettings()];
  const params = resolveParams(settings);

  const { data: existingRows } = await admin
    .from("prayer_times")
    .select("date, manual_override, notes")
    .in("date", uniqueDates);

  const existing = existingRows ?? [];
  const existingByDate = new Map<string, { manual_override?: boolean | null; notes?: string | null }>(
    existing.map((r) => [r.date as string, r])
  );

  const needsFetch = uniqueDates.filter((d) => {
    const row = existingByDate.get(d);
    if (!row) return true;
    if (row.manual_override) return false;
    return row.notes !== "auto";
  });

  if (needsFetch.length === 0) return;

  const results = await Promise.all(
    needsFetch.map(async (d) => ({ d, timings: await fetchAladhanTimings(d, params) }))
  );

  const rows = results
    .filter((r): r is { d: string; timings: AladhanTimings } => r.timings !== null)
    .map((r) => buildPrayerTimeRow(r.d, r.timings));

  if (rows.length === 0) return;

  const { error } = await admin.from("prayer_times").upsert(rows, { onConflict: "date" });
  if (error) console.error("syncRealPrayerTimes upsert failed:", error.message);
}