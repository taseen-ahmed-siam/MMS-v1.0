"use client";

import * as React from "react";
import { cn } from "@/lib/utils/format";

/**
 * Contribution status is derived, never stored, so this badge is a pure function
 * of `paid >= assigned`. It sticks to the existing emerald/gold palette: emerald
 * for completed, a soft amber for incomplete, with an optional partial-payment
 * marker underneath.
 */
export function ContributionStatusBadge({
  status,
  paymentStage,
  showStage = true,
  className,
}: {
  status: "completed" | "incomplete";
  paymentStage?: "paid" | "partial" | "unpaid";
  showStage?: boolean;
  className?: string;
}) {
  const completed = status === "completed";
  const partial = paymentStage === "partial";

  return (
    <span
      className={cn(
        "inline-flex w-fit flex-col gap-0.5",
        className
      )}
    >
      <span
        className={cn(
          "inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
          completed
            ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
            : "bg-orange-50 text-orange-700 ring-orange-600/20"
        )}
      >
        <span aria-hidden="true">{completed ? "✓" : "○"}</span>
        {completed ? "Completed" : "Incomplete"}
      </span>
      {showStage && partial && (
        <span className="text-[10px] font-medium uppercase tracking-wide text-amber-700/80">
          Partial
        </span>
      )}
    </span>
  );
}