import { Metadata } from "next";
import { Bell } from "lucide-react";
import { getPublishedAnnouncements } from "@/lib/queries/public";
import { PageHeader } from "@/components/public/page-header";
import { SectionHeading } from "@/components/public/section-heading";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Announcements",
  description:
    "Stay informed with the latest announcements, notices, and updates from Al-Noor Mosque.",
};

export default async function AnnouncementsPage() {
  const announcements = await getPublishedAnnouncements(50);

  return (
    <div>
      <PageHeader
        title="Announcements"
        description="Important notices and updates from the mosque administration."
      />

      <section className="py-16 bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {announcements.length > 0 ? (
            <>
              <SectionHeading
                eyebrow="Updates"
                title="Latest Announcements"
              />
              <div className="mx-auto mt-8 space-y-4">
                {announcements.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-2xl border border-border bg-card p-6 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                            a.priority === "emergency"
                              ? "bg-red-100 text-red-700"
                              : a.priority === "important"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {a.priority === "emergency" && "⚠ "}
                          {a.priority.charAt(0).toUpperCase() + a.priority.slice(1)}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(a.start_date)}
                        {a.end_date && ` — ${formatDate(a.end_date)}`}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {a.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {a.description}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="mx-auto max-w-xl text-center">
              <div className="rounded-2xl border border-border bg-card p-10 shadow-sm">
                <Bell className="mx-auto h-12 w-12 text-muted-foreground/40" />
                <p className="mt-4 text-lg font-medium text-foreground">
                  No announcements
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  There are no announcements at this time. Check back soon.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
