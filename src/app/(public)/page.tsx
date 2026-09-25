import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Clock, Calendar, MapPin, Users, HandCoins, Landmark, Heart } from "lucide-react";
import { getMosqueSettings, getTodayPrayerTimes, getLatestJummah, getPublishedAnnouncements, getUpcomingEvents, getLatestKhutbahs, getCurrentCommittee, getVisibleFunds } from "@/lib/queries/public";
import { MOSQUE_TIMEZONE } from "@/lib/prayer-times";
import { SectionHeading } from "@/components/public/section-heading";
import { PrayerCard } from "@/components/public/prayer-card";
import { NextPrayerCountdown } from "@/components/public/next-prayer-countdown";
import type { PrayerSlot } from "@/components/public/next-prayer-countdown";
import { OrnamentalDivider } from "@/components/public/islamic";
import { formatTime, getHijriDate, formatDate } from "@/lib/utils/format";
import { CURRENCY_SYMBOL } from "@/constants";

function getMapEmbedUrl(mapUrl: string | null | undefined, address: string) {
  const coordinateMatch = mapUrl?.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (coordinateMatch) {
    return `https://www.google.com/maps?q=${coordinateMatch[1]},${coordinateMatch[2]}&z=17&output=embed`;
  }

  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}

export const metadata: Metadata = {
  title: "Welcome to Al-Noor Mosque",
  description:
    "A place of peace, prayer, and community. Prayer times, events, donations, and more.",
};

export default async function HomePage() {
  const settings = await getMosqueSettings();
  const timezone = settings?.timezone || MOSQUE_TIMEZONE;
  const prayerTime = await getTodayPrayerTimes(undefined, timezone);
  const jummah = await getLatestJummah(timezone);
  const announcements = await getPublishedAnnouncements(3);
  const events = await getUpcomingEvents(3);
  const khutbahs = await getLatestKhutbahs(3);
  const committee = await getCurrentCommittee();
  const funds = await getVisibleFunds(4);
  const mosqueAddress = settings?.address || "123 Main Street, Dhaka, Bangladesh";
  const mapUrl = getMapEmbedUrl(settings?.google_maps_url, mosqueAddress);

  const today = new Date();

  const prayerSlots: PrayerSlot[] = prayerTime
    ? [
        { name: "Fajr", time: prayerTime.fajr_jamaat || prayerTime.fajr_adhan },
        { name: "Sunrise", time: prayerTime.sunrise },
        { name: "Dhuhr", time: prayerTime.dhuhr_jamaat || prayerTime.dhuhr_adhan },
        { name: "Asr", time: prayerTime.asr_jamaat || prayerTime.asr_adhan },
        { name: "Maghrib", time: prayerTime.maghrib_jamaat || prayerTime.maghrib_adhan },
        { name: "Isha", time: prayerTime.isha_jamaat || prayerTime.isha_adhan },
      ].filter((p): p is PrayerSlot => Boolean(p.time))
    : [];

  return (
    <div>
      {/* HERO */}
      <section className="relative bg-primary-dark text-white overflow-hidden">
        <div className="absolute inset-0 islamic-girih opacity-70" />
        <div className="absolute inset-0 islamic-star-pattern-gold opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/85 to-primary-dark/95" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 md:pt-28 md:pb-20">
          <div className="max-w-3xl mx-auto text-center">
            <Image
              src="/images/bismillah.png"
              alt="بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
              width={2172}
              height={724}
              priority
              className="mx-auto mb-4 h-auto w-full max-w-[12rem] sm:max-w-[14rem] md:max-w-[16rem] select-none"
            />
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">
              <span className="text-gold-gradient">{settings?.mosque_name || "Al-Noor Mosque"}</span>
            </h1>
            <OrnamentalDivider tone="light" className="max-w-md mx-auto" />
            <p className="text-lg md:text-xl text-emerald-100 max-w-2xl mx-auto mt-4 leading-relaxed">
              আল্লাহর ঘর — শান্তি, জ্ঞান এবং সম্প্রদায়ের স্থান। আমাদের সাথে ইবাদত ও খেদমতে যুক্ত হোন।
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
              <div className="flex items-center justify-center gap-3 bg-white/10 backdrop-blur rounded-xl px-4 py-3">
                <Calendar className="text-accent h-5 w-5" />
                <div className="text-left">
                  <p className="text-xs text-emerald-200">Hijri Date</p>
                  <p className="font-medium text-sm">{getHijriDate(today)}</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 bg-white/10 backdrop-blur rounded-xl px-4 py-3">
                <Clock className="text-accent h-5 w-5" />
                <div className="text-left">
                  <p className="text-xs text-emerald-200">Gregorian Date</p>
                  <p className="font-medium text-sm">{formatDate(today, "MMMM d, yyyy")}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 grid w-full max-w-md grid-cols-2 gap-3 mx-auto">
              <Link
                href="/donate"
                className="inline-flex items-center justify-center gap-2 bg-accent text-accent-foreground font-semibold px-2 sm:px-8 py-3 rounded-full hover:bg-accent/90 transition-colors"
              >
                <HandCoins className="h-5 w-5 shrink-0" />
                Donate Now
              </Link>
              <Link
                href="/events"
                className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white font-semibold px-2 sm:px-8 py-3 rounded-full hover:bg-white/20 transition-colors"
              >
                <Calendar className="h-5 w-5 shrink-0" />
                View Events
              </Link>
            </div>
          </div>

          {/* NEXT PRAYER */}
          {prayerSlots.length > 0 && (
            <div className="mt-12 max-w-xl mx-auto">
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
                <NextPrayerCountdown prayers={prayerSlots} timezone={timezone} />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* PRAYER TIMES */}
      {prayerTime && (
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Prayer Times"
              title="Today's Prayer Schedule"
              description="Fajr, Dhuhr, Asr, Maghrib and Isha — with adhan and jamaat times."
            />
            <div className="mx-auto mt-10 max-w-2xl">
              <PrayerCard prayerTime={prayerTime} />
            </div>

            {jummah.length > 0 && (
              <div className="mt-8 grid md:grid-cols-1 gap-4">
                {jummah.slice(0, 1).map((j) => (
                  <div key={j.id} className="bg-card rounded-2xl p-5 shadow-sm border">
                    <div className="flex items-center gap-3 mb-2">
                      <Landmark className="text-accent h-5 w-5" />
                      <p className="font-semibold">
                        Jumu&apos;ah Congregation {j.session_number}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">Khutbah: {formatTime(j.khutbah_time)}</p>
                    <p className="text-sm text-muted-foreground">Jamaat: {formatTime(j.jamaat_time)}</p>
                    {j.imam_name && <p className="text-sm text-muted-foreground">Imam: {j.imam_name}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ANNOUNCEMENTS */}
      {announcements.length > 0 && (
        <section className="py-16 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4 mb-8">
              <SectionHeading align="left" title="Latest Announcements" />
              <Link
                href="/announcements"
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-primary/30 px-4 py-2 text-sm font-medium text-primary transition-colors hover:border-primary hover:bg-primary/5"
              >
                View all
                <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {announcements.map((a) => (
                <div key={a.id} className="bg-background rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      a.priority === "emergency"
                        ? "bg-red-100 text-red-700"
                        : a.priority === "important"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {a.priority}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDate(a.start_date)}</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{a.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">{a.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* EVENTS */}
      {events.length > 0 && (
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4 mb-8">
              <SectionHeading align="left" title="Upcoming Events" />
              <Link
                href="/events"
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-primary/30 px-4 py-2 text-sm font-medium text-primary transition-colors hover:border-primary hover:bg-primary/5"
              >
                View all
                <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {events.map((e) => (
                <Link key={e.id} href={`/events/${e.slug || e.id}`} className="bg-card rounded-2xl overflow-hidden shadow-sm border hover:shadow-lg transition-shadow group">
                  <div className="h-40 bg-primary/80 islamic-pattern-dark flex items-center justify-center">
                    <Calendar className="h-12 w-12 text-accent" />
                  </div>
                  <div className="p-6">
                    <p className="text-xs text-accent font-medium mb-2">{e.event_type}</p>
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">{e.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{e.description}</p>
                    <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {formatDate(e.start_date)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FUNDRAISING */}
      {funds.length > 0 && (
        <section className="py-16 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Fundraising"
              title="Support Our Campaigns"
              description="Your contributions build and sustain this house of Allah."
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
              {funds.map((f) => {
                const pct = f.target_amount > 0 ? Math.min(100, (f.collected_amount / f.target_amount) * 100) : 0;
                return (
                  <Link key={f.id} href="/donate" className="bg-background rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Heart className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-semibold">{f.name}</h3>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-primary font-medium">{CURRENCY_SYMBOL}{f.collected_amount.toLocaleString()}</span>
                      <span className="text-muted-foreground">of {CURRENCY_SYMBOL}{f.target_amount.toLocaleString()}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="text-center mt-8">
              <Link
                href="/donate"
                className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-8 py-3 rounded-full hover:bg-primary-dark transition-colors"
              >
                <HandCoins className="h-5 w-5" />
                Make a Donation
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* KHUTBAH */}
      {khutbahs.length > 0 && (
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4 mb-8">
              <SectionHeading align="left" title="Latest Khutbah" />
              <Link
                href="/khutbah"
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-primary/30 px-4 py-2 text-sm font-medium text-primary transition-colors hover:border-primary hover:bg-primary/5"
              >
                View all
                <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {khutbahs.map((k) => (
                <Link key={k.id} href={`/khutbah/${k.slug || k.id}`} className="bg-card rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow">
                  <p className="text-xs text-accent font-medium mb-2">{formatDate(k.date)}</p>
                  <h3 className="font-semibold text-lg mb-2">{k.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">By {k.speaker}</p>
                  <p className="text-sm text-muted-foreground line-clamp-3">{k.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* COMMITTEE */}
      {committee.length > 0 && (
        <section className="py-16 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading title="Our Committee" />
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mt-8">
              {committee.map((m) => (
                <div key={m.id} className="bg-background rounded-2xl p-6 text-center shadow-sm border">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold">{m.name}</h3>
                  <p className="text-sm text-accent font-medium mt-1">{m.designation}</p>
                  {m.committee_period && (
                    <p className="text-xs text-muted-foreground mt-2">{m.committee_period}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* DONATION CTA */}
      <section className="py-16 bg-primary-dark text-white islamic-pattern-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Give Sadaqah Jariyah</h2>
          <p className="text-emerald-100 text-lg mb-8 max-w-2xl mx-auto">
            {"When a person dies, his deeds come to an end, except for three: ongoing charity, knowledge benefited from, and a righteous child who prays for him."}
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link
              href="/donate"
              className="inline-flex items-center gap-2 bg-accent text-accent-foreground font-semibold px-10 py-4 rounded-full hover:bg-accent/90 transition-colors"
            >
              <HandCoins className="h-5 w-5" />
              Donate Now
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-10 py-4 rounded-full hover:bg-white/20 transition-colors"
            >
              <MapPin className="h-5 w-5" />
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="py-18 bg-background">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <SectionHeading title="Find Our Mosque" />
          <div className="mx-auto mt-8 grid max-w-5xl items-stretch gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-8">
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="flex min-h-24 items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="font-medium">Address</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{mosqueAddress}</p>
                </div>
              </div>
              <div className="flex min-h-24 items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
                <Users className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="mt-1 text-sm text-muted-foreground">{settings?.phone || "+880 1712 345 678"}</p>
                </div>
              </div>
              <div className="flex min-h-24 items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
                <Heart className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="mt-1 break-all text-sm text-muted-foreground">{settings?.email || "info@alnoormosque.org"}</p>
                </div>
              </div>
            </div>
            <div className="min-h-80 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <iframe
                src={mapUrl}
                title="Mosque Location on Google Maps"
                className="h-full min-h-80 w-full"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
