import { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Calendar, User } from "lucide-react";
import { getLatestKhutbahs } from "@/lib/queries/public";
import { PageHeader } from "@/components/public/page-header";
import { SectionHeading } from "@/components/public/section-heading";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Khutbah",
  description:
    "Browse the latest khutbahs (sermons) delivered at Al-Noor Mosque.",
};

export default async function KhutbahPage() {
  const khutbahs = await getLatestKhutbahs(50);

  return (
    <div>
      <PageHeader
        title="Khutbah"
        description="Listen to and read the latest Friday sermons and Islamic lectures."
      />

      <section className="py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {khutbahs.length > 0 ? (
            <>
              <SectionHeading
                eyebrow="Knowledge"
                title="Latest Khutbah"
                description="Sermons delivered by our esteemed imams and guest speakers."
              />
              <div className="mx-auto mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {khutbahs.map((k) => (
                  <Link
                    key={k.id}
                    href={`/khutbah/${k.slug || k.id}`}
                    className="group rounded-2xl border border-border bg-card p-6 shadow-sm card-hover"
                  >
                    <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(k.date)}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      {k.title}
                    </h3>
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                      {k.speaker}
                    </div>
                    {k.description && (
                      <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                        {k.description}
                      </p>
                    )}
                    <div className="mt-4 flex items-center gap-3">
                      {k.audio_url && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                          <BookOpen className="h-3 w-3" />
                          Audio
                        </span>
                      )}
                      {k.video_url && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                          <BookOpen className="h-3 w-3" />
                          Video
                        </span>
                      )}
                      {k.pdf_url && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                          <BookOpen className="h-3 w-3" />
                          PDF
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="mx-auto max-w-xl text-center">
              <div className="rounded-2xl border border-border bg-card p-10 shadow-sm">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/40" />
                <p className="mt-4 text-lg font-medium text-foreground">
                  No khutbahs available
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Khutbah recordings and articles will appear here once published.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
