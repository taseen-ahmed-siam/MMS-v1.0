import { cn } from "@/lib/utils/format";
import { Bismillah, OrnamentalDivider } from "@/components/public/islamic";

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
  showBismillah?: boolean;
}

export function PageHeader({
  title,
  description,
  className,
  showBismillah = false,
}: PageHeaderProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-[#065F46] via-[#053d2e] to-[#03412f] py-16 islamic-star-pattern-gold",
        className
      )}
    >
      <div className="absolute inset-0 islamic-girih opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#065F46]/60 to-[#03412f]/80" />
      <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        {showBismillah && <Bismillah className="mb-4 text-2xl sm:text-3xl" />}
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          <span className="text-gold-gradient">{title}</span>
        </h1>
        <OrnamentalDivider tone="light" className="mx-auto mt-5 max-w-xs" />
        {description && (
          <p className="mx-auto mt-4 max-w-xl text-base text-emerald-100/80">{description}</p>
        )}
      </div>
    </section>
  );
}
