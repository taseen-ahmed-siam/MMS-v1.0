"use client";

import * as React from "react";
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpDown,
  Mail,
  Receipt,
  Send,
  UserPlus,
  Pencil,
} from "lucide-react";

import { cn, formatCurrency, formatDate } from "@/lib/utils/format";
import { PAGE_SIZE, EVENT_STATUSES } from "@/constants";
import { removeEventMember } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "@/components/admin/data-table";
import { AdminTableWrapper } from "@/components/admin/table-wrapper";
import { PaginationBar } from "@/components/admin/pagination-bar";
import { SearchInput } from "@/components/forms/search-input";
import { StatusBadge } from "@/components/admin/status-badge";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DesktopTableOnly,
  MobileActionButton,
  MobileMetaGrid,
  MobileMetaTile,
  MobileRecordCard,
  MobileRecordFooter,
  MobileRecordHead,
  MobileRecordList,
} from "@/components/admin/mobile-record-card";
import { ContributionStatusBadge } from "@/components/admin/contribution-status-badge";
import {
  ContributionSummaryCards,
  FundTargetMismatchNotice,
} from "@/components/admin/contribution-summary-cards";
import { EventMemberPickerDialog } from "@/components/admin/event-member-picker-dialog";
import { ContributionReminderDialog } from "@/components/admin/contribution-reminder-dialog";
import { ContributionDetailDialog } from "@/components/admin/contribution-detail-dialog";
import { BulkContributionReminderDialog } from "@/components/admin/bulk-contribution-reminder-dialog";
import { EditAssignedAmountDialog } from "@/components/admin/edit-assigned-amount-dialog";
import type { EventContributionSummary } from "@/lib/queries/admin";
import type { DonationFund, Event, EventMemberContribution } from "@/types/database";

type EventWithFund = Event & { donation_funds: DonationFund | null };

type SortKey = "member_name" | "assigned_amount" | "paid_amount" | "remaining_amount" | "status";
type SortDirection = "asc" | "desc";

const SORT_LABELS: Record<SortKey, string> = {
  member_name: "Member",
  assigned_amount: "Assigned Amount",
  paid_amount: "Paid Amount",
  remaining_amount: "Remaining Amount",
  status: "Status",
};

/**
 * The rows arrive fully derived from the linked fund's approved donations, so
 * search, filtering, sorting and pagination all run over that one result set.
 * That keeps the header totals, the summary cards and the table describing the
 * same snapshot without a refetch on every keystroke.
 */
export function EventContributionsClient({
  event,
  rows,
  summary,
  mosqueName,
  emailConfigured,
}: {
  event: EventWithFund;
  rows: EventMemberContribution[];
  summary: EventContributionSummary;
  mosqueName: string;
  emailConfigured: boolean;
}) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("member_name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [reminderRow, setReminderRow] = useState<EventMemberContribution | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [amountRow, setAmountRow] = useState<EventMemberContribution | null>(null);
  const [detailRow, setDetailRow] = useState<EventMemberContribution | null>(null);
  const [removeRow, setRemoveRow] = useState<EventMemberContribution | null>(null);
  const [isRemoving, startRemoveTransition] = useTransition();

  const perHeadAmount = Number(event.contribution_amount || 0);
  const incompleteCount = useMemo(
    () => rows.filter((row) => row.status === "incomplete").length,
    [rows]
  );

  const visibleRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    const filtered = rows.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (stageFilter !== "all" && row.payment_stage !== stageFilter) return false;
      if (!term) return true;
      return (
        row.member_name.toLowerCase().includes(term) ||
        (row.member_code ?? "").toLowerCase().includes(term) ||
        (row.phone ?? "").toLowerCase().includes(term) ||
        (row.email ?? "").toLowerCase().includes(term)
      );
    });

    const direction = sortDirection === "asc" ? 1 : -1;
    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortKey === "member_name") {
        comparison = a.member_name.localeCompare(b.member_name);
      } else if (sortKey === "status") {
        // Incomplete members first when descending: those are the ones needing a reminder.
        comparison = Number(a.status === "completed") - Number(b.status === "completed");
      } else {
        comparison = Number(a[sortKey]) - Number(b[sortKey]);
      }
      if (comparison === 0) comparison = a.member_name.localeCompare(b.member_name);
      return comparison * direction;
    });
  }, [rows, search, statusFilter, stageFilter, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(visibleRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedRows = visibleRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortHeader = (key: SortKey) => (
    <button
      type="button"
      onClick={() => handleSort(key)}
      className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-white/80"
    >
      {SORT_LABELS[key]}
      <ArrowUpDown
        className={cn("h-3 w-3", sortKey === key ? "opacity-100" : "opacity-40")}
      />
    </button>
  );

  const handleRemove = () => {
    if (!removeRow) return;
    startRemoveTransition(async () => {
      const formData = new FormData();
      formData.set("event_id", removeRow.event_id);
      formData.set("member_id", removeRow.member_id);
      const result = await removeEventMember(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`${removeRow.member_name} removed from the event`);
      setRemoveRow(null);
      setDetailRow(null);
      router.refresh();
    });
  };

  const columns: Column<EventMemberContribution>[] = [
    {
      key: "member_name",
      header: sortHeader("member_name"),
      cell: (row) => (
        <div className="min-w-0">
          <p className="font-medium">{row.member_name}</p>
          {row.member_code && (
            <p className="text-xs text-muted-foreground">{row.member_code}</p>
          )}
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      cell: (row) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {row.phone ?? "—"}
        </span>
      ),
    },
    {
      key: "email",
      header: "Email",
      cell: (row) =>
        row.email ? (
          <span className="block max-w-[14rem] truncate text-sm text-muted-foreground">
            {row.email}
          </span>
        ) : (
          <span className="text-xs font-medium uppercase text-amber-700">No email</span>
        ),
    },
    {
      key: "assigned_amount",
      header: sortHeader("assigned_amount"),
      cell: (row) => (
        <span className="flex items-center gap-1.5 whitespace-nowrap tabular-nums">
          {formatCurrency(row.assigned_amount)}
          {row.is_override && (
            <span
              className="rounded-full bg-[#C8A951]/[0.18] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#8a6d1f]"
              title={`Custom amount · event default ${formatCurrency(perHeadAmount)}`}
            >
              Custom
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground/70 hover:text-foreground"
            title="Edit assigned contribution"
            aria-label={`Edit assigned contribution for ${row.member_name}`}
            onClick={(clickEvent) => {
              clickEvent.stopPropagation();
              setAmountRow(row);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </span>
      ),
    },
    {
      key: "paid_amount",
      header: sortHeader("paid_amount"),
      cell: (row) => (
        <span
          className={cn(
            "whitespace-nowrap font-semibold tabular-nums",
            row.paid_amount > 0 ? "text-emerald-700" : "text-muted-foreground"
          )}
        >
          {formatCurrency(row.paid_amount)}
        </span>
      ),
    },
    {
      key: "remaining_amount",
      header: sortHeader("remaining_amount"),
      cell: (row) => (
        <span
          className={cn(
            "whitespace-nowrap tabular-nums",
            row.remaining_amount > 0 ? "text-orange-700" : "text-muted-foreground"
          )}
        >
          {formatCurrency(row.remaining_amount)}
        </span>
      ),
    },
    {
      key: "status",
      header: sortHeader("status"),
      cell: (row) => (
        <ContributionStatusBadge status={row.status} paymentStage={row.payment_stage} />
      ),
    },
    {
      key: "actions",
      header: "",
      headClassName: "w-28",
      className: "w-28",
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            title={
              row.last_reminder
                ? `Last reminder ${formatDate(row.last_reminder.sent_at, "dd MMM yyyy, h:mm a")}`
                : "Send contribution reminder"
            }
            aria-label="Send contribution reminder"
            onClick={(clickEvent) => {
              clickEvent.stopPropagation();
              setReminderRow(row);
            }}
          >
            <Mail className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="View payment history"
            aria-label="View payment history"
            onClick={(clickEvent) => {
              clickEvent.stopPropagation();
              setDetailRow(row);
            }}
          >
            <Receipt className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3 text-muted-foreground">
          <Link href="/admin/events">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Link>
        </Button>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight">{event.title}</h1>
              <StatusBadge status={event.status} statuses={[...EVENT_STATUSES]} />
            </div>
            {event.description && (
              <p className="mt-1.5 max-w-3xl text-sm text-muted-foreground">
                {event.description}
              </p>
            )}
          </div>
          <Button
            onClick={() => setPickerOpen(true)}
            className="shrink-0 bg-[#064E3B] text-white hover:bg-[#065F46]"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Members
          </Button>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm md:grid-cols-3 xl:grid-cols-6">
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Event Date
            </dt>
            <dd className="mt-0.5 text-sm font-semibold">{formatDate(event.start_date)}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Contribution Due
            </dt>
            <dd className="mt-0.5 text-sm font-semibold">
              {event.contribution_due_date ? formatDate(event.contribution_due_date) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Linked Fund
            </dt>
            <dd className="mt-0.5 truncate text-sm font-semibold">
              {event.donation_funds?.name ?? "Not linked"}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Per Head
            </dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums">
              {perHeadAmount > 0 ? formatCurrency(perHeadAmount) : "Not set"}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Assigned Members
            </dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums">{summary.memberCount}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Completed / Incomplete
            </dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums">
              <span className="text-emerald-700">{summary.completed}</span>
              <span className="mx-1 text-muted-foreground">/</span>
              <span className="text-orange-700">{summary.incomplete}</span>
            </dd>
          </div>
        </dl>
      </div>

      {!event.fund_id && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p>
            This event is not linked to a fund, so contributions cannot be tracked. Link a fund
            from the edit event form to start recording payments.
          </p>
        </div>
      )}

      {event.fund_id && !emailConfigured && (
        <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
          <p>
            Email reminders are disabled because SMTP is not configured. Set the SMTP variables in
            the environment to enable sending. Tracking below works regardless.
          </p>
        </div>
      )}

      {event.fund_id && (
        <>
          <ContributionSummaryCards summary={summary} perHeadAmount={perHeadAmount} />
          <FundTargetMismatchNotice summary={summary} />
        </>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search member, ID, phone or email..."
          className="lg:w-72"
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="incomplete">Incomplete</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={stageFilter}
            onValueChange={(value) => {
              setStageFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All payments</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>

          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                {/* Kept mounted and disabled when nothing needs chasing, so the
                    helper text is a real tooltip rather than an alert that has
                    to be dismissed. */}
                <span className="inline-flex" tabIndex={incompleteCount === 0 ? 0 : -1}>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={incompleteCount === 0 || !emailConfigured}
                    onClick={() => setBulkOpen(true)}
                    className="w-full border-[#064E3B]/25 text-[#064E3B] hover:bg-[#064E3B]/[0.06] hover:text-[#064E3B] sm:w-auto"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Remind All Incomplete
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-center">
                {incompleteCount === 0
                  ? "All assigned members have completed their contribution."
                  : !emailConfigured
                    ? "Email is not configured on this server. Set SMTP_HOST, SMTP_USER and SMTP_PASS to enable reminders."
                    : `Send reminders to all ${incompleteCount} incomplete member${incompleteCount === 1 ? "" : "s"}.`}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <AdminTableWrapper
        empty={visibleRows.length === 0}
        emptyTitle={rows.length === 0 ? "No members assigned yet" : "No matching members"}
        emptyDescription={
          rows.length === 0
            ? "Assign members to this event to start tracking their contributions."
            : "Try a different search term or filter."
        }
      >
        <MobileRecordList
          items={pagedRows}
          getKey={(row) => row.member_id}
          renderCard={(row) => (
            <MobileRecordCard>
              <MobileRecordHead
                title={row.member_name}
                subtitle={row.member_code ?? row.email ?? undefined}
                trailing={
                  <ContributionStatusBadge
                    status={row.status}
                    paymentStage={row.payment_stage}
                    showStage={false}
                  />
                }
              />
              <MobileMetaGrid columns={3}>
                <MobileMetaTile label="Assigned" value={formatCurrency(row.assigned_amount)} />
                <MobileMetaTile
                  label="Paid"
                  value={formatCurrency(row.paid_amount)}
                  tone="emerald"
                />
                <MobileMetaTile
                  label="Remaining"
                  value={formatCurrency(row.remaining_amount)}
                  tone={row.remaining_amount > 0 ? "rose" : "neutral"}
                />
              </MobileMetaGrid>
              <MobileRecordFooter
                meta={
                  <span>
                    {row.is_override && (
                      <span className="mr-1 rounded-full bg-[#C8A951]/[0.18] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#8a6d1f]">
                        Custom
                      </span>
                    )}
                    {row.email ?? row.phone ?? "No contact details"}
                    {row.last_reminder
                      ? ` · reminded ${formatDate(row.last_reminder.sent_at, "dd MMM")}`
                      : ""}
                  </span>
                }
              >
                <MobileActionButton
                  label="Edit amount"
                  onClick={() => setAmountRow(row)}
                >
                  <Pencil className="h-4 w-4" />
                </MobileActionButton>
                <MobileActionButton label="Send reminder" onClick={() => setReminderRow(row)}>
                  <Mail className="h-4 w-4" />
                </MobileActionButton>
                <MobileActionButton label="View details" onClick={() => setDetailRow(row)}>
                  <Receipt className="h-4 w-4" />
                </MobileActionButton>
              </MobileRecordFooter>
            </MobileRecordCard>
          )}
        />

        <DesktopTableOnly>
          <DataTable
            columns={columns}
            data={pagedRows}
            onRowClick={(row) => setDetailRow(row)}
          />
        </DesktopTableOnly>
      </AdminTableWrapper>

      <PaginationBar
        page={safePage}
        totalPages={totalPages}
        total={visibleRows.length}
        onPageChange={setPage}
      />

      <EventMemberPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        eventId={event.id}
        defaultAssignedAmount={perHeadAmount}
        onAssigned={() => router.refresh()}
      />

      <ContributionReminderDialog
        open={!!reminderRow}
        onOpenChange={(open) => {
          if (!open) setReminderRow(null);
        }}
        row={reminderRow}
        eventName={event.title}
        dueDate={event.contribution_due_date}
        mosqueName={mosqueName}
        onSent={() => router.refresh()}
      />

      <BulkContributionReminderDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        eventId={event.id}
        eventName={event.title}
        dueDate={event.contribution_due_date}
        rows={rows}
        emailConfigured={emailConfigured}
        onCompleted={() => router.refresh()}
      />

      <EditAssignedAmountDialog
        open={!!amountRow}
        onOpenChange={(open) => {
          if (!open) setAmountRow(null);
        }}
        row={amountRow}
        eventDefault={perHeadAmount}
        onSaved={() => {
          setAmountRow(null);
          router.refresh();
        }}
      />

      <ContributionDetailDialog
        open={!!detailRow}
        onOpenChange={(open) => {
          if (!open) setDetailRow(null);
        }}
        row={detailRow}
        eventName={event.title}
        onRemove={(row) => setRemoveRow(row)}
        removing={isRemoving}
      />

      <ConfirmDialog
        open={!!removeRow}
        onOpenChange={(open) => {
          if (!open) setRemoveRow(null);
        }}
        onConfirm={handleRemove}
        title="Remove member from event"
        description={
          removeRow
            ? `${removeRow.member_name} will be removed from the contribution list for this event. Any payments already approved for ${event.title} are kept and will still count towards the fund.`
            : ""
        }
        confirmText="Remove"
        loading={isRemoving}
      />
    </div>
  );
}