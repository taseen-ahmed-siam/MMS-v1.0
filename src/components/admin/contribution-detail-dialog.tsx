"use client";

import * as React from "react";
import { Loader2, Trash2 } from "lucide-react";

import { formatCurrency, formatDate } from "@/lib/utils/format";
import { PAYMENT_METHODS } from "@/constants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ContributionStatusBadge } from "@/components/admin/contribution-status-badge";
import type { EventMemberContribution } from "@/types/database";

function methodLabel(value: string | null) {
  if (!value) return "—";
  return PAYMENT_METHODS.find((method) => method.value === value)?.label ?? value;
}

/**
 * Read-only breakdown of one member's contribution. It renders the same approved
 * donations the table aggregates, so there is no second record to keep in sync.
 */
export function ContributionDetailDialog({
  open,
  onOpenChange,
  row,
  eventName,
  onRemove,
  removing = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: EventMemberContribution | null;
  eventName: string;
  onRemove?: (row: EventMemberContribution) => void;
  removing?: boolean;
}) {
  if (!row) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>{row.member_name}</DialogTitle>
          <DialogDescription>
            Contribution details for {eventName}
            {row.member_code ? ` · ${row.member_code}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-[#064E3B]/[0.04] px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Required</p>
              <p className="mt-0.5 text-sm font-bold tabular-nums text-[#064E3B]">
                {formatCurrency(row.assigned_amount)}
              </p>
            </div>
            <div className="rounded-lg bg-emerald-50 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-emerald-700/70">Total Paid</p>
              <p className="mt-0.5 text-sm font-bold tabular-nums text-emerald-700">
                {formatCurrency(row.paid_amount)}
              </p>
            </div>
            <div className="rounded-lg bg-orange-50 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-orange-700/70">Remaining</p>
              <p className="mt-0.5 text-sm font-bold tabular-nums text-orange-700">
                {formatCurrency(row.remaining_amount)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-black/[0.06]">
            <p className="border-b border-black/[0.06] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Approved Payments
            </p>
            {row.approved_donations.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                No approved payments recorded for this member yet.
              </p>
            ) : (
              <ul className="divide-y divide-black/[0.04]">
                {row.approved_donations.map((donation) => (
                  <li
                    key={donation.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {formatDate(donation.donation_date)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {methodLabel(donation.payment_method)}
                        {donation.transaction_id ? ` · ${donation.transaction_id}` : ""}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold tabular-nums text-emerald-700">
                      {formatCurrency(Number(donation.amount))}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between rounded-xl bg-black/[0.02] px-3 py-2.5">
            <div className="text-xs text-muted-foreground">
              <p>
                {row.email ?? "No email on profile"}
              </p>
              {row.last_reminder && (
                <p className="mt-0.5">
                  Last reminder {formatDate(row.last_reminder.sent_at, "dd MMM yyyy, h:mm a")}
                </p>
              )}
            </div>
            <ContributionStatusBadge
              status={row.status}
              paymentStage={row.payment_stage}
              showStage={false}
            />
          </div>
        </div>

        {onRemove && (
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10"
              disabled={removing}
              onClick={() => onRemove(row)}
            >
              {removing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Remove from event
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}