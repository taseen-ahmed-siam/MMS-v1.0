import { Metadata } from "next";
import Image from "next/image";
import { Images } from "lucide-react";
import { PageHeader } from "@/components/public/page-header";
import { SectionHeading } from "@/components/public/section-heading";
import { getGalleryImages } from "@/lib/queries/public";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Browse photos and moments captured at Al-Noor Mosque events and gatherings.",
};

export default async function GalleryPage() {
  const images = await getGalleryImages();

  return (
    <div>
      <PageHeader
        title="Gallery"
        description="Moments and memories from our mosque events and community life."
      />

      <section className="py-16 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Photo Gallery" />

          {images.length > 0 ? (
            <div className="mx-auto mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((img) => (
                <figure
                  key={`${img.category}-${img.alt}`}
                  className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-8">
                    <span className="block text-xs font-medium text-white/90">{img.alt}</span>
                    <span className="text-[10px] uppercase tracking-wider text-gold">
                      {img.category}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <div className="mx-auto mt-10 max-w-xl text-center">
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
          )}
        </div>
      </section>
    </div>
  );
}
