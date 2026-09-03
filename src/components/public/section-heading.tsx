import { cn } from "@/lib/utils/format";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  dark?: boolean;
  align?: "center" | "left";
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
  dark = false,
  align = "center",
}: SectionHeadingProps) {
  const centered = align === "center";
  return (
    <div
      className={cn(
        centered ? "mx-auto max-w-2xl text-center" : "text-left",
        className
      )}
    >
      {eyebrow && (
        <div
          className={cn(
            "mb-3 flex items-center gap-2",
            centered && "justify-center"
          )}
        >
          <span
            className={cn(
              "inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest",
              dark ? "text-[#E5C65A]" : "text-[#C8A951]"
            )}
          >
            <span className="text-gold" aria-hidden="true">
              ✦
            </span>
            {eyebrow}
            <span className="text-gold" aria-hidden="true">
              ✦
            </span>
          </span>
        </div>
      )}
      {centered ? (
        <h2
          className={cn(
            "text-3xl font-bold tracking-tight sm:text-4xl",
            dark ? "text-white" : "text-gold-gradient"
          )}
        >
          {title}
        </h2>
      ) : (
        <div className="flex items-center gap-3">
          <span className="h-9 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-[#C8A951] to-[#b18a2f]" />
          <h2
            className={cn(
              "text-3xl font-bold tracking-tight sm:text-4xl",
              dark ? "text-white" : "text-gold-gradient"
            )}
          >
            {title}
          </h2>
        </div>
      )}
      {centered && (
        <div className="mt-4 flex items-center justify-center gap-3" aria-hidden="true">
          <span className="h-px w-14 bg-gradient-to-r from-transparent to-[#C8A951]" />
          <span className="medallion text-[#C8A951]" />
          <span className="h-px w-14 bg-gradient-to-l from-transparent to-[#C8A951]" />
        </div>
      )}
      {description && (
        <p className={cn("text-base mt-4", dark ? "text-emerald-200/80" : "text-muted-foreground")}>
          {description}
        </p>
      )}
    </div>
  );
}
