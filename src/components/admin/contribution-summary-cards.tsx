"use client";

import * as React from "react";
import { AlertTriangle, Target, TrendingUp, Users, Wallet } from "lucide-react";

import { cn, formatCurrency } from "@/lib/utils/format";
import type { EventContributionSummary } from "@/lib/queries/admin";

function SummaryCard({
  label,
  value,
  hint,
  tone = "neutral",
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "emerald" | "gold" | "muted";
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-black/[0.06] p-4 shadow-sm",
        tone === "emerald"
          ? "bg-[#064E3B]"
          : tone === "gold"
            ? "bg-[#C8A951]/[0.08]"
            : "bg-white"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className={cn(
            "text-xs font-medium uppercase tracking-wide",
            tone === "emerald" ? "text-white/70" : "text-muted-foreground"
          )}
        >
          {label}
        </p>
        <Icon
          className={cn(
            "h-4 w-4",
            tone === "emerald" ? "text-[#C8A951]" : "text-muted-foreground/60"
          )}
        />
      </div>
      <p
        className={cn(
          "mt-2 text-xl font-bold tabular-nums",
          tone === "emerald" ? "text-white" : "text-foreground"
        )}
      >
        {value}
      </p>
      {hint && (
        <p
          className={cn(
            "mt-1 text-xs",
            tone === "emerald" ? "text-white/60" : "text-muted-foreground"
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

export function ContributionSummaryCards({
  summary,
  perHeadAmount,
}: {
  summary: EventContributionSummary;
  perHeadAmount: number;
}) {
  const {
    memberCount,
    completed,
    incomplete,
    totalAssigned,
    fundCollected,
    totalRemaining,
    remainingToTarget,
    collectionPercent,
    completionPercent,
  } = summary;

  const clampedPercent = Math.max(0, Math.min(100, collectionPercent));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Target Collection"
          value={formatCurrency(totalAssigned)}
          hint={
            perHeadAmount > 0
              ? `${memberCount} member${memberCount === 1 ? "" : "s"} × ${formatCurrency(perHeadAmount)}`
              : "Set a per-head amount to calculate a target"
          }
          icon={Target}
          tone="gold"
        />
        <SummaryCard
          label="Collected"
          value={formatCurrency(fundCollected)}
          hint="Approved fund contributions"
          icon={Wallet}
          tone="emerald"
        />
        <SummaryCard
          label="Remaining"
          value={formatCurrency(remainingToTarget)}
          hint={
            remainingToTarget === 0
              ? "Target reached"
              : `${formatCurrency(totalRemaining)} owed by ${incomplete} incomplete member${incomplete === 1 ? "" : "s"}`
          }
          icon={TrendingUp}
        />
        <SummaryCard
          label="Completed"
          value={`${completed} / ${memberCount}`}
          hint={`${completionPercent}% of members completed`}
          icon={Users}
        />
      </div>

      <div className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">Collection Progress</p>
          <p className="text-sm font-bold tabular-nums text-[#064E3B]">
            {clampedPercent}%
          </p>
        </div>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
          <div
            className="h-full rounded-full bg-[#064E3B] transition-[width] duration-500"
            style={{ width: `${clampedPercent}%` }}
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {formatCurrency(fundCollected)} collected of {formatCurrency(totalAssigned)} expected
          </span>
          <span>{formatCurrency(summary.assignedPaid)} from assigned members</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Total Assigned
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-foreground">{memberCount}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Completed
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-emerald-700">{completed}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Incomplete
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-orange-700">{incomplete}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * The event target is derived from its own assignments, which can drift from the
 * target stored on the linked fund. Surfacing the gap is enough: the fund is the
 * financial record of the fund and must never be rewritten from here.
 */
export function FundTargetMismatchNotice({
  summary,
}: {
  summary: EventContributionSummary;
}) {
  if (summary.fundTarget === null || summary.targetDifference === null) return null;
  if (Math.abs(summary.targetDifference) < 0.01) return null;

  const fundHigher = summary.targetDifference > 0;

  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <div>
        <p className="font-semibold">
          Event expectation differs from the fund target
        </p>
        <p className="mt-0.5 text-amber-800">
          This event expects {formatCurrency(summary.totalAssigned)}
          {summary.calculatedTarget !== summary.totalAssigned
            ? ` (${summary.memberCount} × ${formatCurrency(summary.calculatedTarget / Math.max(summary.memberCount, 1))})`
            : ""}
          , while the linked fund is targeting {formatCurrency(summary.fundTarget)} — a difference
          of {formatCurrency(Math.abs(summary.targetDifference))}
          {fundHigher ? " above" : " below"} the event expectation. The fund target was left
          unchanged; adjust it from the Funds page if needed.
        </p>
      </div>
    </div>
  );
}