import { createClient } from "@/lib/supabase/server";
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

export async function getTodayPrayerTimes(date?: string): Promise<PrayerTime | null> {
  const supabase = await createClient();
  const targetDate = date || new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("prayer_times")
    .select("*")
    .eq("date", targetDate)
    .maybeSingle();
  return data as PrayerTime | null;
}

export async function getRecentPrayerDates(limit = 7): Promise<PrayerTime[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("prayer_times")
    .select("*")
    .gte("date", new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0])
    .order("date", { ascending: true })
    .limit(limit);
  return (data as PrayerTime[]) ?? [];
}

export async function getLatestJummah(): Promise<JummahSchedule[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("jummah_schedules")
    .select("*")
    .gte("date", new Date().toISOString().split("T")[0])
    .order("date", { ascending: true })
    .limit(10);
  return (data as JummahSchedule[]) ?? [];
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
  return data as Event | null;
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
  return data as Khutbah | null;
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
