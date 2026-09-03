import { cn } from "@/lib/utils/format";

/**
 * Bismillah calligraphy rendered in the Arabic display font (Amiri).
 * Optionally styled to sit above headings (hero / section banners).
 */
export function Bismillah({
  className,
  size = "text-3xl",
}: {
  className?: string;
  size?: string;
}) {
  return (
    <p
      dir="rtl"
      lang="ar"
      aria-label="Bismillah ir-Rahman ir-Rahim"
      className={cn(
        "arabic-text text-gold-gradient leading-relaxed select-none",
        size,
        className,
      )}
    >
      بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
    </p>
  );
}

/**
 * Horizontal ornamental divider with a central 8-point star.
 */
export function OrnamentalDivider({
  className,
  tone = "accent",
}: {
  className?: string;
  tone?: "accent" | "light" | "dark";
}) {
  const starColor =
    tone === "light" ? "text-[#C8A951]" : tone === "dark" ? "text-gold" : "text-accent";
  const lineClass =
    tone === "light"
      ? "bg-gradient-to-r from-transparent via-[#C8A951] to-transparent"
      : tone === "dark"
        ? "bg-gradient-to-r from-transparent via-gold/40 to-transparent"
        : "bg-gradient-to-r from-transparent via-accent/70 to-transparent";

  return (
    <div
      className={cn("flex items-center justify-center gap-3 py-1", className)}
      aria-hidden="true"
    >
      <span className={cn("h-px w-16 sm:w-24", lineClass)} />
      <span className={cn("text-sm", starColor)}>✦</span>
      <span className={cn("h-px w-16 sm:w-24", lineClass)} />
    </div>
  );
}

/**
 * A centered 8-point star medallion (khatam), used as a section accent.
 */
export function StarMedallion({ className }: { className?: string }) {
  return <span className={cn("medallion text-accent", className)} aria-hidden="true" />;
}

/**
 * Decorative crescent + star motif.
 */
export function CrescentStar({
  className,
  size = "h-5 w-5",
}: {
  className?: string;
  size?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center justify-center text-[#C8A951]", size, className)}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12.3 3a9 9 0 1 0 8.7 11 7.5 7.5 0 0 1-8.7-11z" />
      </svg>
    </span>
  );
}

/**
 * Full-width decorative band that shows a calligraphic phrase over a pattern.
 * Used to frame section breaks across the site.
 */
export function IslamicBanner({
  title,
  arabic,
  children,
  className,
}: {
  title: string;
  arabic?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-primary-dark islamic-star-pattern-gold", className)}>
      <div className="absolute inset-0 bg-gradient-to-b from-primary-dark/90 to-primary-dark/95" />
      <div className="relative mx-auto max-w-7xl px-4 py-14 text-center sm:px-6 lg:px-8">
        {arabic && <Bismillah className="mb-4" size="text-2xl sm:text-3xl" />}
        <h2 className="text-3xl font-bold text-white sm:text-4xl">{title}</h2>
        {children && <div className="mt-6">{children}</div>}
        <OrnamentalDivider tone="light" className="mt-6" />
      </div>
    </div>
  );
}
