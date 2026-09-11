"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import type { GalleryImage } from "@/lib/queries/public";

type GalleryViewProps = {
  images: GalleryImage[];
};

export function GalleryView({ images }: GalleryViewProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const open = activeIndex !== null;

  const goTo = useCallback(
    (dir: 1 | -1) => {
      setActiveIndex((i) => (i === null ? i : (i + dir + images.length) % images.length));
    },
    [images.length],
  );

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveIndex(null);
      if (e.key === "ArrowRight") goTo(1);
      if (e.key === "ArrowLeft") goTo(-1);
    };

    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, goTo]);

  return (
    <>
      <div className="mx-auto mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((img, i) => (
          <figure
            key={`${img.category}-${img.alt}-${i}`}
            className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted shadow-sm card-hover"
          >
            <button
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`View larger image of ${img.alt}`}
              className="absolute inset-0 cursor-zoom-in"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white/0 transition-colors duration-300 group-hover:bg-black/30 group-hover:text-white">
                <ZoomIn className="h-8 w-8 drop-shadow" />
              </span>
            </button>
          </figure>
        ))}
      </div>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={images[activeIndex!].alt}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setActiveIndex(null)}
        >
          <button
            type="button"
            onClick={() => setActiveIndex(null)}
            aria-label="Close gallery"
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/25"
          >
            <X className="h-5 w-5" />
          </button>

          <span className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
            {activeIndex! + 1} / {images.length}
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goTo(-1);
            }}
            aria-label="Previous image"
            className="absolute left-3 z-10 rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/25 sm:left-6"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div
            className="relative flex h-full w-full max-w-5xl flex-col items-center justify-center gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-[55vh] w-full overflow-hidden rounded-2xl">
              <Image
                src={images[activeIndex!].src}
                alt={images[activeIndex!].alt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="object-contain"
              />
            </div>
            <div className="max-w-2xl text-center">
              <span className="text-[10px] uppercase tracking-wider text-gold">
                {images[activeIndex!].category}
              </span>
              <h3 className="mt-1 text-lg font-semibold text-white">
                {images[activeIndex!].alt}
              </h3>
              {images[activeIndex!].description ? (
                <p className="mt-2 text-sm leading-relaxed text-white/80">
                  {images[activeIndex!].description}
                </p>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goTo(1);
            }}
            aria-label="Next image"
            className="absolute right-3 z-10 rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/25 sm:right-6"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      ) : null}
    </>
  );
}