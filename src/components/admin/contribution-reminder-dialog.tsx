"use client";

import * as React from "react";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, Loader2, Mail } from "lucide-react";

import { formatCurrency } from "@/lib/utils/format";
import { buildReminderMessage, buildReminderSubject } from "@/lib/reminders";
import { sendContributionReminder } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ErrorMessage } from "@/components/forms/error-message";
import { ContributionStatusBadge } from "@/components/admin/contribution-status-badge";
import type { EventMemberContribution } from "@/types/database";

/**
 * Inner form, remounted per member via `key` so the subject and message start
 * from that member's own figures instead of being copied in an effect.
 *
 * The address, name and all three amounts come from the member profile and the
 * derived contribution row, so the admin never types an email address and never
 * edits a financial figure. Only the subject and the wording are theirs to
 * change, and the send itself happens on the server.
 */
function ReminderForm({
  row,
  eventName,
  dueDate,
  mosqueName,
  isSending,
  onCancel,
  onSend,
}: {
  row: EventMemberContribution;
  eventName: string;
  dueDate: string | null;
  mosqueName: string;
  isSending: boolean;
  onCancel: () => void;
  onSend: (payload: { subject: string; message: string }) => void;
}) {
  const [subject, setSubject] = useState(() => buildReminderSubject(eventName, mosqueName));
  const [message, setMessage] = useState(() =>
    buildReminderMessage({
      memberName: row.member_name,
      eventName,
      assignedAmount: row.assigned_amount,
      paidAmount: row.paid_amount,
      remainingAmount: row.remaining_amount,
      dueDate,
      mosqueName,
    })
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSend({ subject, message });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Member</Label>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-black/[0.06] bg-black/[0.02] px-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{row.member_name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.member_code ? `${row.member_code} · ` : ""}
              {row.email ?? "No email on profile"}
            </p>
          </div>
          <ContributionStatusBadge
            status={row.status}
            paymentStage={row.payment_stage}
            showStage={false}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-[#064E3B]/[0.04] px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Assigned</p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-[#064E3B]">
            {formatCurrency(row.assigned_amount)}
          </p>
        </div>
        <div className="rounded-lg bg-emerald-50 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-emerald-700/70">Paid</p>
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

      <div className="space-y-1.5">
        <Label htmlFor="reminder-to">To</Label>
        <Input
          id="reminder-to"
          readOnly
          value={row.email ?? "No email on profile"}
          className="bg-black/[0.02] text-muted-foreground"
        />
        {!row.email && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
            <AlertCircle className="h-3.5 w-3.5" />
            Add an email address to this member&apos;s profile to send a reminder.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reminder-subject">Subject</Label>
        <Input
          id="reminder-subject"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          required
          minLength={2}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reminder-message">Message</Label>
        <Textarea
          id="reminder-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          required
          minLength={10}
          rows={12}
          className="font-mono text-xs leading-relaxed"
        />
      </div>

      <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSending}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSending || !row.email}
          className="bg-[#064E3B] text-white hover:bg-[#065F46]"
        >
          {isSending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Send Email
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ContributionReminderDialog({
  open,
  onOpenChange,
  row,
  eventName,
  dueDate,
  mosqueName,
  onSent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: EventMemberContribution | null;
  eventName: string;
  dueDate: string | null;
  mosqueName: string;
  onSent?: () => void;
}) {
  const [state, formAction, isSending] = useActionState(sendContributionReminder, {});

  // `state` keeps returning the same success object until the next action, and
  // the parent passes fresh inline handlers plus refreshed row data every render.
  // Without this guard the effect re-ran on each of those, calling onSent()
  // (router.refresh) which produced a new row, which re-ran the effect again --
  // an endless toast/refetch loop. Each action result is handled exactly once.
  const handledRef = useRef<unknown>(null);

  useEffect(() => {
    if (!state.success) return;
    if (handledRef.current === state) return;
    handledRef.current = state;
    toast.success("Email sent successfully", {
      description: `Delivered to ${row?.email ?? "the member"}.`,
    });
    onSent?.();
    onOpenChange(false);
  }, [state, row, onOpenChange, onSent]);

  if (!row) return null;

  return (
    <Dialog open={open} onOpenChange={isSending ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>Send Contribution Reminder</DialogTitle>
          <DialogDescription>
            Review the details below, adjust the wording if needed, then send. The email is sent
            from the server using the mosque&apos;s configured sender address.
          </DialogDescription>
        </DialogHeader>

        {state.error && <ErrorMessage message={state.error} />}

        <ReminderForm
          key={row.member_id}
          row={row}
          eventName={eventName}
          dueDate={dueDate}
          mosqueName={mosqueName}
          isSending={isSending}
          onCancel={() => onOpenChange(false)}
          onSend={(payload) => {
            const formData = new FormData();
            formData.set("event_id", row.event_id);
            formData.set("member_id", row.member_id);
            formData.set("subject", payload.subject);
            formData.set("message", payload.message);
            formAction(formData);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}