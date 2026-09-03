import { Metadata } from "next";
import { Images } from "lucide-react";
import { PageHeader } from "@/components/public/page-header";
import { SectionHeading } from "@/components/public/section-heading";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Browse photos and moments captured at Al-Noor Mosque events and gatherings.",
};

export default function GalleryPage() {
  const placeholders = Array.from({ length: 8 });

  return (
    <div>
      <PageHeader
        title="Gallery"
        description="Moments and memories from our mosque events and community life."
      />

      <section className="py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Photos"
            title="Photo Gallery"
          />

          <div className="mx-auto mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {placeholders.map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-2xl border border-border bg-card shadow-sm flex items-center justify-center"
              >
                <div className="text-center">
                  <Images className="mx-auto h-8 w-8 text-muted-foreground/30" />
                  <p className="mt-2 text-xs text-muted-foreground/50">
                    Photo {i + 1}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-12 max-w-xl text-center">
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10">
              <Images className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <p className="mt-4 text-lg font-medium text-foreground">
                Gallery coming soon
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                We&apos;re curating photos from our events and community gatherings.
                Check back soon for a full gallery experience.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
