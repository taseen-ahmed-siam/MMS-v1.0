import { createClient } from "@/lib/supabase/server";
import { addMinutesToTime, localDate, localDateInTimeZone, syncRealPrayerTimes } from "@/lib/prayer-times";
import type {
  MosqueSetting,
  PrayerTime,
  JummahSchedule,
  Announcement,
  Event,
  Khutbah,
  CommitteeMember,
  DonationFund,
} from "@/types/database";

export async function getMosqueSettings(): Promise<MosqueSetting | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mosque_settings")
    .select("*")
    .limit(1)
    .maybeSingle();
  return data as MosqueSetting | null;
}

export async function getTodayPrayerTimes(date?: string, timezone?: string): Promise<PrayerTime | null> {
  const supabase = await createClient();
  const targetDate = date || (timezone ? localDateInTimeZone(new Date(), timezone) : localDate(new Date()));
  await syncRealPrayerTimes([targetDate]);
  const { data } = await supabase
    .from("prayer_times")
    .select("*")
    .eq("date", targetDate)
    .maybeSingle();
  return data as PrayerTime | null;
}

export async function getRecentPrayerDates(limit = 7): Promise<PrayerTime[]> {
  const supabase = await createClient();
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - (limit - 1));

  const dates: string[] = [];
  for (let i = 0; i < limit; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(localDate(d));
  }
  await syncRealPrayerTimes(dates);

  const { data } = await supabase
    .from("prayer_times")
    .select("*")
    .gte("date", localDate(start))
    .lte("date", localDate(today))
    .order("date", { ascending: true })
    .limit(limit);
  return (data as PrayerTime[]) ?? [];
}

export async function getLatestJummah(): Promise<JummahSchedule[]> {
  const supabase = await createClient();
  const today = new Date();

  const fridays: Date[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() === 5) fridays.push(d);
  }
  const fridayDates = fridays.map(localDate);
  if (fridayDates.length === 0) return [];

  await syncRealPrayerTimes(fridayDates);

  const { data: ptRows } = await supabase
    .from("prayer_times")
    .select("date, dhuhr_jamaat")
    .in("date", fridayDates);

  const ptByDate = new Map<string, { date: string; dhuhr_jamaat: string | null }>(
    (ptRows ?? []).map((p) => [p.date, p])
  );

  const derived: JummahSchedule[] = [];
  for (const d of fridays) {
    const dateIso = localDate(d);
    const row = ptByDate.get(dateIso);
    if (!row?.dhuhr_jamaat) continue;
    derived.push({
      id: `jummah-${dateIso}`,
      date: dateIso,
      session_number: 1,
      khutbah_time: addMinutesToTime(row.dhuhr_jamaat, -30),
      jamaat_time: row.dhuhr_jamaat,
      imam_name: null,
      notes: "auto",
      created_at: "",
      updated_at: "",
    });
  }
  if (derived.length > 0) return derived;

  const { data: fallback } = await supabase
    .from("jummah_schedules")
    .select("*")
    .gte("date", localDate(today))
    .order("date", { ascending: true })
    .limit(10);
  return (fallback as JummahSchedule[]) ?? [];
}

export async function getPublishedAnnouncements(limit = 5): Promise<Announcement[]> {
  const supabase = await createClient();
  const now = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("announcements")
    .select("*")
    .eq("status", "published")
    .lte("start_date", now)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as Announcement[]) ?? [];
}

export async function getUpcomingEvents(limit = 6): Promise<Event[]> {
  const supabase = await createClient();
  const now = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("status", "published")
    .gte("start_date", now)
    .order("start_date", { ascending: true })
    .limit(limit);
  return (data as Event[]) ?? [];
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (data) return data as Event;
  const { data: byId } = await supabase
    .from("events")
    .select("*")
    .eq("id", slug)
    .eq("status", "published")
    .maybeSingle();
  return (byId as Event) ?? null;
}

export async function getLatestKhutbahs(limit = 5): Promise<Khutbah[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("khutbahs")
    .select("*")
    .eq("status", "published")
    .order("date", { ascending: false })
    .limit(limit);
  return (data as Khutbah[]) ?? [];
}

export async function getKhutbahBySlug(slug: string): Promise<Khutbah | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("khutbahs")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (data) return data as Khutbah;
  const { data: byId } = await supabase
    .from("khutbahs")
    .select("*")
    .eq("id", slug)
    .eq("status", "published")
    .maybeSingle();
  return (byId as Khutbah) ?? null;
}

export async function getCurrentCommittee(): Promise<CommitteeMember[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("committee_members")
    .select("*")
    .eq("is_current", true)
    .order("display_order", { ascending: true });
  return (data as CommitteeMember[]) ?? [];
}

export async function getVisibleFunds(limit = 10): Promise<DonationFund[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("donation_funds")
    .select("*")
    .eq("is_visible", true)
    .eq("status", "active")
    .order("featured", { ascending: false })
    .limit(limit);
  return (data as DonationFund[]) ?? [];
}

export async function getFundBySlug(slug: string): Promise<DonationFund | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("donation_funds")
    .select("*")
    .eq("slug", slug)
    .eq("is_visible", true)
    .maybeSingle();
  return data as DonationFund | null;
}

export interface GalleryImage {
  src: string;
  alt: string;
  category: string;
}

export async function getGalleryImages(): Promise<GalleryImage[]> {
  const supabase = await createClient();

  const [events, funds, khutbahs] = await Promise.all([
    supabase
      .from("events")
      .select("title, featured_image")
      .eq("status", "published")
      .not("featured_image", "is", null)
      .limit(20),
    supabase
      .from("donation_funds")
      .select("name, image_url")
      .eq("is_visible", true)
      .not("image_url", "is", null)
      .limit(20),
    supabase
      .from("khutbahs")
      .select("title, thumbnail_url")
      .eq("status", "published")
      .not("thumbnail_url", "is", null)
      .limit(20),
  ]);

  const out: GalleryImage[] = [
    ...((events.data ?? []) as { title: string; featured_image: string }[]).map((e) => ({
      src: e.featured_image,
      alt: e.title,
      category: "Events",
    })),
    ...((funds.data ?? []) as { name: string; image_url: string }[]).map((f) => ({
      src: f.image_url,
      alt: f.name,
      category: "Projects",
    })),
    ...((khutbahs.data ?? []) as { title: string; thumbnail_url: string }[]).map((k) => ({
      src: k.thumbnail_url,
      alt: k.title,
      category: "Khutbah",
    })),
  ];

  return out;
}
