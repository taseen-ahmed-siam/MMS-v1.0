"use client";

import * as React from "react";
import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react";

import { cn, formatDate } from "@/lib/utils/format";
import { sendBulkContributionReminders } from "@/lib/actions/admin";
import {
  REMINDER_PLACEHOLDERS,
  buildBulkReminderMessageTemplate,
  buildBulkReminderSubjectTemplate,
  findUnknownPlaceholders,
  isDeliverableEmail,
} from "@/lib/reminders";
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
import { MobileRecordList } from "@/components/admin/mobile-record-card";
import type { EventMemberContribution, BulkReminderRecipientResult } from "@/types/database";

/** Pause between server batches so a large run does not trip provider limits. */
const BATCH_DELAY_MS = 900;

type RunStats = {
  sent: number;
  failed: number;
  skipped: number;
  processed: number;
  total: number;
};

type Phase = "confirm" | "sending" | "done";

const EMPTY_STATS: RunStats = { sent: 0, failed: 0, skipped: 0, processed: 0, total: 0 };

/**
 * Counts derived from the same rows the server will use, for the preview only.
 *
 * `isDeliverableEmail` is the same predicate the server applies before sending,
 * so "Eligible recipients" is a promise the run actually keeps. Counting a
 * merely-truthy address here would overstate the run by however many rows hold
 * something like `karim@` or a stray space, and those recipients would then be
 * reported as skipped despite being counted as eligible.
 */
function summarise(rows: EventMemberContribution[]) {
  const incomplete = rows.filter((row) => row.status === "incomplete");
  const eligible = incomplete.filter((row) => isDeliverableEmail(row.email));
  return {
    incomplete,
    total: incomplete.length,
    eligible: eligible.length,
    missingEmail: incomplete.length - eligible.length,
  };
}

/**
 * Bulk reminder for every incomplete member of an event.
 *
 * The preview counts come from the already-derived rows on screen, but the send
 * re-derives recipients server-side, so this dialog cannot cause a completed
 * member to be emailed even if the page is stale.
 *
 * Sending is a sequence of bounded server batches driven here purely for
 * progress reporting. Each call handles ten recipients and returns before the
 * next starts, which keeps every request inside the platform timeout that 290
 * sequential SMTP handshakes would blow through.
 */
export function BulkContributionReminderDialog({
  open,
  onOpenChange,
  eventId,
  eventName,
  dueDate,
  rows,
  emailConfigured,
  onCompleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventName: string;
  dueDate: string | null;
  rows: EventMemberContribution[];
  emailConfigured: boolean;
  onCompleted?: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("confirm");
  const [subject, setSubject] = useState(() => buildBulkReminderSubjectTemplate());
  const [message, setMessage] = useState(() => buildBulkReminderMessageTemplate());
  const [stats, setStats] = useState<RunStats>(EMPTY_STATS);
  const [failures, setFailures] = useState<BulkReminderRecipientResult[]>([]);
  const [processedSoFar, setProcessedSoFar] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showFailures, setShowFailures] = useState(false);
  const sendLockRef = React.useRef(false);

  const preview = summarise(rows);

  // A completed run keeps its own figures; reopening always starts a fresh one.
  const resetForOpen = () => {
    setPhase("confirm");
    setSubject(buildBulkReminderSubjectTemplate());
    setMessage(buildBulkReminderMessageTemplate());
    setStats({ ...EMPTY_STATS, total: preview.total });
    setFailures([]);
    setProcessedSoFar(0);
    setError(null);
    setShowFailures(false);
  };

  // The parent opens this dialog by flipping the `open` prop, which does not go
  // through Radix's `onOpenChange`, so a reset hooked to that callback never
  // fires and a reopened dialog would still show the previous run's results.
  // Adjusting state during render is React's sanctioned pattern for reacting to
  // a prop change: it needs no effect (which the repo's lint rules discourage)
  // and happens before the new frame is painted, so no stale flash.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) resetForOpen();
  }

  const subjectUnknown = findUnknownPlaceholders(subject);
  const messageUnknown = findUnknownPlaceholders(message);
  const hasUnknown = subjectUnknown.length > 0 || messageUnknown.length > 0;

  const canSend =
    phase === "confirm" &&
    emailConfigured &&
    preview.eligible > 0 &&
    subject.trim().length >= 2 &&
    message.trim().length >= 10 &&
    !hasUnknown;

  const close = () => {
    if (phase === "sending") return;
    onOpenChange(false);
  };

  const runSend = async () => {
    // Synchronous guard, not just the disabled button: two clicks in the same
    // tick would both pass a state-based check before React re-renders, and a
    // duplicate run would email real people twice.
    if (sendLockRef.current) return;
    sendLockRef.current = true;
    setPhase("sending");
    setError(null);

    let cursor = "";
    let batchNumber = 0;
    const totals: RunStats = { sent: 0, failed: 0, skipped: 0, processed: 0, total: preview.total };
    const allFailures: BulkReminderRecipientResult[] = [];

    // Sequential by design: one batch in flight at a time, never a parallel
    // fan-out that could look like an uncontrolled blast to the provider.
    try {
      for (;;) {
        const formData = new FormData();
        formData.set("event_id", eventId);
        formData.set("subject", subject);
        formData.set("message", message);
        formData.set("after_member_id", cursor);
        formData.set("batch_number", String(batchNumber));
        // Cumulative figures for the run audit. The server only sees one batch
        // at a time, so it cannot total the run itself.
        formData.set("run_sent", String(totals.sent));
        formData.set("run_failed", String(totals.failed));
        formData.set("run_skipped", String(totals.skipped));
        formData.set("run_processed", String(totals.processed));

        const result = await sendBulkContributionReminders(formData);

        if (!result || "error" in result || result.error) {
          setError(
            (result && "error" in result ? result.error : null) ??
              "Unable to send reminders. Please try again."
          );
          // Keep whatever already went out visible instead of discarding it.
          setStats(totals);
          setFailures(allFailures);
          setPhase("done");
          return;
        }

        totals.sent += result.stats.sent;
        totals.failed += result.stats.failed;
        totals.skipped += result.stats.skipped;
        totals.processed += result.stats.processed;
        allFailures.push(...result.results.filter((item) => item.status === "failed"));

        setStats({ ...totals });
        setFailures([...allFailures]);
        setProcessedSoFar(totals.processed);

        if (!result.hasMore) break;

        cursor = result.cursor;
        batchNumber += 1;
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
      }
    } catch (caught) {
      // A rejected server action (network drop, timeout, unexpected throw) must
      // not strand the dialog on "Sending…" with no way out.
      console.error("[bulk-contribution-reminder] run aborted", caught);
      setError(
        "The reminder run was interrupted before it finished. Reminders already sent cannot be unsent; reopen and run again to continue with the remaining members."
      );
      setStats({ ...totals });
      setFailures([...allFailures]);
      setPhase("done");
      return;
    } finally {
      sendLockRef.current = false;
    }

    setPhase("done");
    if (totals.sent > 0) onCompleted?.();
  };

  const percent =
    stats.total > 0 ? Math.min(100, Math.round((processedSoFar / stats.total) * 100)) : 0;

  const modalTitle =
    phase === "done"
      ? "Reminder Sending Complete"
      : phase === "sending"
        ? "Sending Reminders"
        : "Send Reminder to Incomplete Members";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (phase === "sending") {
          // Esc during a run is ignored so a half-sent queue is never abandoned
          // without the admin seeing the result.
          return;
        }
        if (next) resetForOpen();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
          <DialogDescription>
            {phase === "confirm" &&
              `You are about to send contribution reminders to ${preview.total} incomplete member${preview.total === 1 ? "" : "s"}. Each member receives an individual email with their own figures.`}
            {phase === "sending" &&
              "Each member is emailed separately. Please keep this window open until the run finishes."}
            {phase === "done" && "Here is the outcome of this reminder run."}
          </DialogDescription>
        </DialogHeader>

        {phase === "confirm" && (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-3 rounded-xl border border-black/[0.06] bg-black/[0.02] p-3 sm:grid-cols-3">
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Incomplete members
                </dt>
                <dd className="mt-0.5 text-sm font-bold tabular-nums text-foreground">
                  {preview.total}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Eligible recipients
                </dt>
                <dd className="mt-0.5 text-sm font-bold tabular-nums text-emerald-700">
                  {preview.eligible}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Missing email
                </dt>
                <dd
                  className={cn(
                    "mt-0.5 text-sm font-bold tabular-nums",
                    preview.missingEmail > 0 ? "text-amber-700" : "text-muted-foreground"
                  )}
                >
                  {preview.missingEmail}
                </dd>
              </div>
              <div className="col-span-2 sm:col-span-3">
                <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Event / Due date
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-foreground">
                  {eventName} · {dueDate ? formatDate(dueDate, "d MMMM yyyy") : "No due date set"}
                </dd>
              </div>
            </dl>

            {!emailConfigured && (
              <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Email is not configured on this server. Set SMTP_HOST, SMTP_USER and SMTP_PASS to
                enable sending.
              </p>
            )}

            {emailConfigured && preview.missingEmail > 0 && (
              <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                <span>
                  {preview.eligible} reminder{preview.eligible === 1 ? "" : "s"} will be sent.{" "}
                  {preview.missingEmail} member{preview.missingEmail === 1 ? " does" : "s do"} not
                  have a valid email address and will be skipped.
                </span>
              </p>
            )}

            {error && <ErrorMessage message={error} />}

            <div className="space-y-1.5">
              <Label htmlFor="bulk-subject">Subject</Label>
              <Input
                id="bulk-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                disabled={phase !== "confirm"}
                required
                minLength={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bulk-message">Message</Label>
              <Textarea
                id="bulk-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                disabled={phase !== "confirm"}
                required
                minLength={10}
                rows={13}
                className="font-mono text-xs leading-relaxed"
              />
              <p className="text-xs text-muted-foreground">
                Placeholders resolve per member:{" "}
                {REMINDER_PLACEHOLDERS.map((name, index) => (
                  <React.Fragment key={name}>
                    {index > 0 && ", "}
                    <code className="rounded bg-black/[0.05] px-1 py-0.5 text-[10px]">
                      {`{{${name}}}`}
                    </code>
                  </React.Fragment>
                ))}
              </p>
              {hasUnknown && (
                <p className="flex items-start gap-1.5 text-xs font-medium text-red-600">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Unknown placeholder
                  {subjectUnknown.length + messageUnknown.length > 1 ? "s" : ""}:{" "}
                  {[...subjectUnknown, ...messageUnknown]
                    .map((name) => `{{${name}}}`)
                    .join(", ")}
                </p>
              )}
            </div>
          </div>
        )}

        {phase === "sending" && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-[#064E3B]" />
              <p className="text-sm font-medium text-foreground">
                Sending reminder {processedSoFar + 1} of {stats.total}...
              </p>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
              <div
                className="h-full rounded-full bg-[#064E3B] transition-[width] duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {processedSoFar} of {stats.total} processed
              </span>
              <span>
                {stats.sent} sent · {stats.failed} failed · {stats.skipped} skipped
              </span>
            </div>
          </div>
        )}

        {phase === "done" && (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-black/[0.06] bg-white px-3 py-2.5">
                <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Sent successfully
                </dt>
                <dd className="mt-0.5 text-lg font-bold tabular-nums text-emerald-700">
                  {stats.sent}
                </dd>
              </div>
              <div className="rounded-xl border border-black/[0.06] bg-white px-3 py-2.5">
                <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Failed</dt>
                <dd
                  className={cn(
                    "mt-0.5 text-lg font-bold tabular-nums",
                    stats.failed > 0 ? "text-red-600" : "text-muted-foreground"
                  )}
                >
                  {stats.failed}
                </dd>
              </div>
              <div className="rounded-xl border border-black/[0.06] bg-white px-3 py-2.5">
                <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Skipped — missing email
                </dt>
                <dd
                  className={cn(
                    "mt-0.5 text-lg font-bold tabular-nums",
                    stats.skipped > 0 ? "text-amber-700" : "text-muted-foreground"
                  )}
                >
                  {stats.skipped}
                </dd>
              </div>
              <div className="rounded-xl border border-black/[0.06] bg-white px-3 py-2.5">
                <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Total processed
                </dt>
                <dd className="mt-0.5 text-lg font-bold tabular-nums text-foreground">
                  {stats.processed}
                </dd>
              </div>
            </dl>

            {error && <ErrorMessage message={error} />}

            {failures.length > 0 && (
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="-ml-2 text-muted-foreground"
                  onClick={() => setShowFailures((current) => !current)}
                >
                  <AlertCircle className="mr-1.5 h-3.5 w-3.5 text-red-600" />
                  {showFailures ? "Hide" : "Inspect"}{" "}
                  {failures.length} failed recipient{failures.length === 1 ? "" : "s"}
                </Button>
                {showFailures && (
                  <MobileRecordList
                    items={failures}
                    getKey={(item) => item.member_id}
                    renderCard={(item) => (
                      <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2">
                        <p className="text-sm font-medium text-red-900">{item.member_name}</p>
                        <p className="text-xs text-red-700">{item.email ?? "No email"}</p>
                      </div>
                    )}
                  />
                )}
              </div>
            )}

            {stats.sent > 0 && !failures.length && (
              <p className="flex items-center gap-2 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Every eligible member has been reminded.
              </p>
            )}
          </div>
        )}

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          {phase === "confirm" && (
            <>
              <Button type="button" variant="outline" onClick={close}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={runSend}
                disabled={!canSend}
                className="bg-[#064E3B] text-white hover:bg-[#065F46]"
              >
                <Mail className="mr-2 h-4 w-4" />
                Continue
              </Button>
            </>
          )}
          {phase === "sending" && (
            <Button type="button" variant="outline" disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </Button>
          )}
          {phase === "done" && (
            <Button
              type="button"
              onClick={close}
              className="bg-[#064E3B] text-white hover:bg-[#065F46]"
            >
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}