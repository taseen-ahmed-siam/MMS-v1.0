import { Metadata } from "next";
import Link from "next/link";
import { Calendar, Clock } from "lucide-react";
import { getUpcomingEvents } from "@/lib/queries/public";
import { PageHeader } from "@/components/public/page-header";
import { SectionHeading } from "@/components/public/section-heading";
import { formatDate, formatTime } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Browse upcoming events, programs, and community gatherings at Al-Noor Mosque.",
};

export default async function EventsPage() {
  const events = await getUpcomingEvents(20);

  return (
    <div>
      <PageHeader
        title="Events"
        description="আসন্ন কর্মসূচি, বক্তৃতা এবং সামাজিক সমাবেশ সম্পর্কে জানুন।"
      />

      <section className="py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {events.length > 0 ? (
            <>
              <SectionHeading
                eyebrow="Community"
                title="Upcoming Events"
                description="আমাদের মসজিদে আসন্ন অনুষ্ঠানগুলোতে আমাদের সাথে যোগ দিন।"
              />
              <div className="mx-auto mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug || event.id}`}
                    className="group rounded-2xl border border-border bg-card overflow-hidden shadow-sm card-hover"
                  >
                    <div className="h-40 bg-gradient-to-br from-[#064E3B] to-[#043d2e] islamic-pattern-dark flex items-center justify-center">
                      <Calendar className="h-12 w-12 text-[#C8A951]/70" />
                    </div>
                    <div className="p-6">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                          {event.event_type}
                        </span>
                        {event.featured && (
                          <span className="inline-flex items-center rounded-full bg-[#C8A951]/15 px-2.5 py-1 text-xs font-medium text-[#C8A951]">
                            Featured
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        {event.title}
                      </h3>
                      {event.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          {event.description}
                        </p>
                      )}
                      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(event.start_date)}
                        </span>
                        {event.start_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatTime(event.start_time)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="mx-auto max-w-xl text-center">
              <div className="rounded-2xl border border-border bg-card p-10 shadow-sm">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground/40" />
                <p className="mt-4 text-lg font-medium text-foreground">
                  No upcoming events
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Check back soon for new programs and community gatherings.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
