import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "৳") {
  return `${currency}${Number(amount || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(date: string | Date, pattern = "MMM d, yyyy") {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  try {
    return format(d, pattern);
  } catch {
    return "-";
  }
}

export function formatTime(time: string | null | undefined) {
  if (!time) return "-";
  try {
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:${m || "00"} ${ampm}`;
  } catch {
    return time;
  }
}

const BANGLA_LATIN: Record<string, string> = {
  "অ": "a", "আ": "a", "ই": "i", "ঈ": "i", "উ": "u", "ঊ": "u", "ঋ": "ri", "এ": "e", "ঐ": "oi", "ও": "o", "ঔ": "ou",
  "ক": "k", "খ": "kh", "গ": "g", "ঘ": "gh", "ঙ": "ng", "চ": "c", "ছ": "ch", "জ": "j", "ঝ": "jh", "ঞ": "n",
  "ট": "t", "ঠ": "th", "ড": "d", "ঢ": "dh", "ণ": "n", "ত": "t", "থ": "th", "দ": "d", "ধ": "dh", "ন": "n",
  "প": "p", "ফ": "ph", "ব": "b", "ভ": "bh", "ম": "m", "য": "y", "র": "r", "ল": "l", "শ": "sh", "ষ": "sh",
  "স": "s", "হ": "h", "ড়": "r", "ঢ়": "rh", "য়": "y", "ৎ": "t",
  "া": "a", "ি": "i", "ী": "i", "ু": "u", "ূ": "u", "ৃ": "ri", "ে": "e", "ৈ": "oi", "ো": "o", "ৌ": "ou",
  "ং": "ng", "ঃ": "h", "ঁ": "n",
  "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4", "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
};

function transliterateBangla(text: string) {
  return text.replace(/[অ-৺০-৯]|[্\u200c\u200d]/g, (ch) =>
    ch === "্" ? "" : ch === "\u200c" || ch === "\u200d" ? "" : BANGLA_LATIN[ch] ?? ""
  );
}

export function slugify(text: string) {
  const slug = transliterateBangla(text)
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (slug) return slug;

  let hash = 0;
  for (const ch of text) {
    hash = (hash * 31 + (ch.codePointAt(0) ?? 0)) >>> 0;
  }
  return `item-${hash.toString(36)}`;
}

export function getInitials(name: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function timeAgo(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  const intervals: [number, string][] = [
    [31536000, "year"],
    [2592000, "month"],
    [604800, "week"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];
  for (const [secondsPer, label] of intervals) {
    const count = Math.floor(seconds / secondsPer);
    if (count >= 1) {
      return `${count} ${label}${count > 1 ? "s" : ""} ago`;
    }
  }
  return "just now";
}

export function downloadCSV(headers: string[], rows: (string | number)[][], filename: string) {
  const csvContent =
    [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getHijriDate(date?: Date) {
  try {
    const d = date || new Date();
    return new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    return "Hijri date unavailable";
  }
}

export function getNextPrayer(prayers: Record<string, string>[]) {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const order = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
  const labels: Record<string, string> = {
    fajr: "Fajr",
    sunrise: "Sunrise",
    dhuhr: "Dhuhr",
    asr: "Asr",
    maghrib: "Maghrib",
    isha: "Isha",
  };

  for (const prayer of prayers) {
    const time = prayer.jamaat_time || prayer.adhan_time;
    if (!time) continue;
    const [h, m] = time.split(":").map(Number);
    const prayerMinutes = h * 60 + m;
    if (prayerMinutes > currentTime) {
      return { name: labels[prayer.key], time, key: prayer.key };
    }
  }
  return { name: "Fajr", time: "Tomorrow", key: "fajr" };
}

export function countdownToTime(time: string) {
  const now = new Date();
  const [h, m] = time.split(":").map(Number);
  const target = new Date(now);
  target.setHours(h, m, 0, 0);

  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  const diff = target.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds };
}
