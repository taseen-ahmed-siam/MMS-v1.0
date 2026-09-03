import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Clock, MapPin, Users, ArrowLeft, User } from "lucide-react";
import { getEventBySlug } from "@/lib/queries/public";
import { PageHeader } from "@/components/public/page-header";
import { formatDate, formatTime } from "@/lib/utils/format";

interface EventDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: EventDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event Not Found" };
  return {
    title: event.title,
    description: event.description || `Details for ${event.title}`,
  };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title={event.title}
        description={event.description || undefined}
      />

      <section className="py-16 bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Back Link */}
          <Link
            href="/events"
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Events
          </Link>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            {/* Type Badge */}
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {event.event_type}
              </span>
              {event.featured && (
                <span className="inline-flex items-center rounded-full bg-[#C8A951]/15 px-3 py-1 text-xs font-semibold text-[#C8A951]">
                  Featured
                </span>
              )}
            </div>

            {/* Description */}
            {event.description && (
              <div className="mb-8">
                <p className="text-foreground leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Dates */}
              <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-4">
                <Calendar className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Date</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(event.start_date, "EEEE, MMMM d, yyyy")}
                  </p>
                  {event.end_date && (
                    <p className="text-xs text-muted-foreground">
                      to {formatDate(event.end_date, "EEEE, MMMM d, yyyy")}
                    </p>
                  )}
                </div>
              </div>

              {/* Time */}
              {event.start_time && (
                <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-4">
                  <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Time</p>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(event.start_time)}
                      {event.end_time && ` — ${formatTime(event.end_time)}`}
                    </p>
                  </div>
                </div>
              )}

              {/* Venue */}
              {event.venue && (
                <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-4">
                  <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Venue</p>
                    <p className="text-sm text-muted-foreground">{event.venue}</p>
                  </div>
                </div>
              )}

              {/* Speaker */}
              {event.speaker && (
                <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-4">
                  <User className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Speaker</p>
                    <p className="text-sm text-muted-foreground">{event.speaker}</p>
                  </div>
                </div>
              )}

              {/* Capacity */}
              {event.capacity && (
                <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-4">
                  <Users className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Capacity</p>
                    <p className="text-sm text-muted-foreground">
                      {event.capacity} seats
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Registration */}
            {event.registration_enabled && (
              <div className="mt-8 rounded-2xl border border-accent/30 bg-accent/5 p-6 text-center">
                <p className="text-sm font-medium text-foreground">
                  Registration is open for this event.
                </p>
                <Link
                  href="/contact"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#064E3B] px-8 py-3 text-sm font-semibold text-white hover:bg-[#053d2e] transition-colors"
                >
                  Register Now
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
