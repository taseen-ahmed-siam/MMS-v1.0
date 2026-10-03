"use client";

import * as React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, RotateCcw } from "lucide-react";

import { formatCurrency } from "@/lib/utils/format";
import { updateEventMemberAmount } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ErrorMessage } from "@/components/forms/error-message";
import type { EventMemberContribution } from "@/types/database";

/**
 * Per-member override of the assigned contribution.
 *
 * Only this member's target changes. The event's per-head amount and every other
 * member's row are untouched, and the remaining amount and Completed/Incomplete
 * status follow automatically because they are re-derived from approved payments
 * on the next render — nothing is written here but the assigned amount.
 *
 * "Reset to Event Default" reuses the same action with the event's per-head
 * value, so there is only one server path that can change an assigned amount.
 */
/**
 * Form body. Split out and remounted per member via `key` so the input state
 * initialises directly from that member's row instead of being synced by an
 * effect after first paint.
 */
function AmountForm({
  row,
  eventDefault,
  onCancel,
  onSaved,
}: {
  row: EventMemberContribution;
  eventDefault: number;
  onCancel: () => void;
  onSaved?: () => void;
}) {
  const [value, setValue] = useState(() => String(row.assigned_amount ?? ""));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const parsedValue = Number(value);
  const trimmed = value.trim();
  const isNumeric = trimmed !== "" && Number.isFinite(Number(trimmed));
  const isPositive = isNumeric && Number(trimmed) > 0;
  const isUnchanged = isNumeric && Number(trimmed) === Number(row.assigned_amount);
  const canSave = isPositive && !isUnchanged && !isSaving;

  const save = async (nextAmount: number) => {
    setIsSaving(true);
    setError(null);

    const formData = new FormData();
    formData.set("event_id", row.event_id);
    formData.set("member_id", row.member_id);
    formData.set("assigned_amount", String(nextAmount));

    const result = await updateEventMemberAmount(formData);

    if (result?.error) {
      setError(result.error);
      setIsSaving(false);
      return;
    }

    toast.success("Assigned contribution updated successfully", {
      description: `${row.member_name} is now assigned ${formatCurrency(nextAmount)}.`,
    });
    setIsSaving(false);
    onSaved?.();
    onCancel();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isPositive) {
      setError("Assigned amount must be a number greater than 0");
      return;
    }
    if (isUnchanged) return;
    await save(parsedValue);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Member</Label>
        <div className="rounded-xl border border-black/[0.06] bg-black/[0.02] px-3 py-2.5">
          <p className="truncate text-sm font-semibold text-foreground">{row.member_name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {row.member_code ? `${row.member_code} · ` : ""}
            Paid {formatCurrency(row.paid_amount)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-black/[0.02] px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Event Default
          </p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-muted-foreground">
            {formatCurrency(eventDefault)}
          </p>
        </div>
        <div className="rounded-lg bg-black/[0.02] px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Current Assigned
          </p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-foreground">
            {formatCurrency(row.assigned_amount)}
          </p>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="space-y-1.5">
        <Label htmlFor="assigned-amount">New Assigned Amount</Label>
        <Input
          id="assigned-amount"
          // `autoFocus` rather than a ref: the shared Input does not forward
          // refs, and Radix mounts dialog content on open.
          autoFocus
          type="number"
          inputMode="decimal"
          min="0.01"
          step="any"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
          }}
          disabled={isSaving}
          className="tabular-nums"
          placeholder="0"
          aria-invalid={!isNumeric || !isPositive}
        />
        {trimmed !== "" && !isPositive && (
          <p className="text-xs font-medium text-red-600">Enter a number greater than 0.</p>
        )}
        {isUnchanged && (
          <p className="text-xs text-muted-foreground">
            That is already the current assigned amount.
          </p>
        )}
        {/* Reset is disabled rather than silently inert when the event default is
            not a savable amount: an assigned amount must be > 0, so resetting to
            a 0 default would fill the field with a value the form cannot save. */}
        {eventDefault <= 0 && (
          <p className="text-xs text-muted-foreground">
            This event has no positive default amount, so there is nothing to reset to. Enter
            the amount to assign.
          </p>
        )}
      </div>

      <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground sm:mr-auto"
          disabled={
            isSaving ||
            isUnchanged ||
            eventDefault === row.assigned_amount ||
            !(eventDefault > 0)
          }
          onClick={() => {
            setValue(String(eventDefault));
            setError(null);
          }}
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          Reset to Event Default
        </Button>

        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!canSave}
            className="bg-[#064E3B] text-white hover:bg-[#065F46]"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Amount"
            )}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}

export function EditAssignedAmountDialog({
  open,
  onOpenChange,
  row,
  eventDefault,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: EventMemberContribution | null;
  eventDefault: number;
  onSaved?: () => void;
}) {
  if (!row) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Assigned Contribution</DialogTitle>
          <DialogDescription>
            This changes the target for {row.member_name} only. The event&apos;s default per-head
            amount and all other members stay as they are.
          </DialogDescription>
        </DialogHeader>

        {/* Keyed per member so a fresh run always opens on that row's current
            amount, with no state carried over from the previous member. */}
        <AmountForm
          key={`${row.member_id}:${row.assigned_amount}`}
          row={row}
          eventDefault={eventDefault}
          onCancel={() => onOpenChange(false)}
          onSaved={onSaved}
        />
      </DialogContent>
    </Dialog>
  );
}
