"use client";

import * as React from "react";
import { cn } from "@/lib/utils/format";

/**
 * Mobile card layout for the admin tables.
 *
 * The wide `DataTable` stays for md and up; below that the same rows render as
 * stacked cards so nothing needs horizontal scrolling. Each page supplies its
 * own `renderCard`, the shared pieces below keep the emerald/gold palette and
 * spacing consistent with the dashboard and reports.
 */
export function MobileRecordList<T>({
  items,
  getKey,
  renderCard,
}: {
  items: T[];
  getKey: (item: T) => string;
  renderCard: (item: T) => React.ReactNode;
}) {
  return (
    <div className="divide-y md:hidden">
      {items.map((item) => (
        <div key={getKey(item)}>{renderCard(item)}</div>
      ))}
    </div>
  );
}

/** Row shell: padded block with a divider above, matching the table rhythm. */
export function MobileRecordCard({
  children,
  className,
  highlighted,
}: {
  children: React.ReactNode;
  className?: string;
  highlighted?: boolean;
}) {
  return (
    <article
      className={cn("px-4 py-3.5", highlighted && "bg-[#C8A951]/[0.06]", className)}
    >
      {children}
    </article>
  );
}

/** Name + secondary line on the left, status/anything on the right. */
export function MobileRecordHead({
  title,
  subtitle,
  trailing,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{title}</p>
        {subtitle && (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {trailing && <div className="flex shrink-0 items-center gap-1.5">{trailing}</div>}
    </div>
  );
}

/** Two or three compact label/value tiles. */
export function MobileMetaGrid({
  columns = 2,
  children,
}: {
  columns?: 2 | 3;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mt-2.5 grid gap-2",
        columns === 3 ? "grid-cols-3" : "grid-cols-2"
      )}
    >
      {children}
    </div>
  );
}

export function MobileMetaTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  tone?: "neutral" | "emerald" | "rose" | "subtle";
}) {
  return (
    <div
      className={cn(
        "rounded-lg px-2.5 py-2",
        tone === "emerald"
          ? "bg-[#064E3B]/[0.04]"
          : tone === "rose"
            ? "bg-rose-50"
            : tone === "subtle"
              ? "bg-black/[0.02]"
              : "bg-black/[0.03]"
      )}
    >
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 truncate text-sm tabular-nums",
          tone === "emerald"
            ? "font-bold text-[#064E3B]"
            : tone === "rose"
              ? "font-bold text-rose-700"
              : "font-semibold text-foreground"
        )}
      >
        {value}
      </p>
    </div>
  );
}

/** Thin progress track used for fund targets and similar ratios. */
export function MobileProgress({
  percent,
  label = "Progress",
}: {
  percent: number;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold tabular-nums text-[#064E3B]">{clamped}%</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
        <div
          className="h-full rounded-full bg-[#064E3B] transition-[width] duration-300"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

/** Divider + left meta + right aligned row actions. */
export function MobileRecordFooter({
  meta,
  children,
}: {
  meta?: React.ReactNode;
  children?: React.ReactNode;
}) {
  if (!meta && !children) return null;
  return (
    <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-black/5 pt-2.5">
      {meta ? (
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          {meta}
        </div>
      ) : (
        <span />
      )}
      {children ? <div className="flex shrink-0 items-center gap-1">{children}</div> : null}
    </div>
  );
}

/** Small icon-only action button, same shape as the desktop table actions. */
export function MobileActionButton({
  label,
  onClick,
  destructive,
  success,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  destructive?: boolean;
  success?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      className={cn(
        "rounded-md p-1.5",
        success
          ? "text-green-600 hover:bg-green-50"
          : destructive
            ? "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      {children}
    </button>
  );
}

/** Wrapper that keeps the wide table for md and up only. */
export function DesktopTableOnly({ children }: { children: React.ReactNode }) {
  return <div className="hidden md:block">{children}</div>;
}