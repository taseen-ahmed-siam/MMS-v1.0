"use client";

import * as React from "react";
import { useActionState, useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Trash2, Check, X, RotateCcw } from "lucide-react";
import { z } from "zod";

import type { Donation, DonationFund } from "@/types/database";
import {
  createDonation,
  updateDonation,
  deleteDonation,
  approveDonation,
  rejectDonation,
} from "@/lib/actions/admin";
import { donationSchema } from "@/lib/validations";
import { DONATION_STATUSES, PAYMENT_METHODS } from "@/constants";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { DataTable } from "@/components/admin/data-table";
import {
  DesktopTableOnly,
  MobileActionButton,
  MobileRecordCard,
  MobileRecordFooter,
  MobileRecordHead,
  MobileRecordList,
} from "@/components/admin/mobile-record-card";
import { PaginationBar } from "@/components/admin/pagination-bar";
import { FilterBar } from "@/components/admin/filter-bar";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  DonationMemberPicker,
  type DonationMemberOption,
} from "@/components/admin/donation-member-picker";
import { PageActions } from "@/components/admin/page-actions";
import { AdminTableWrapper } from "@/components/admin/table-wrapper";
import {
  FormInput,
  FormSelect,
  FormSubmitButton,
  FormTextarea,
  ConfirmDialog,
  ErrorMessage,
  PageHeader,
} from "@/components/forms";
import { FormDialog } from "@/components/admin/form-dialog";

type DonationRow = Donation & { donation_funds?: { name: string } | null };

type DonationFormValues = Omit<z.input<typeof donationSchema>, "payment_method"> & {
  payment_method: string;
};

type ActionResult = { error?: string; success?: boolean; id?: string };

const initialState: ActionResult = {};

interface DonationsClientProps {
  donations: DonationRow[];
  funds: DonationFund[];
  /** Funds tracked by a still-collecting event; approving into these needs a member. */
  eventFundIds: string[];
  initialSearch: string;
  initialStatus: string;
  initialFundId: string;
  initialLinked: string;
  page: number;
  total: number;
  totalPages: number;
  autoOpenCreate: boolean;
}

export function DonationsClient({
  donations,
  funds,
  eventFundIds,
  initialSearch,
  initialStatus,
  initialFundId,
  initialLinked,
  page,
  total,
  totalPages,
  autoOpenCreate,
}: DonationsClientProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [fundFilter, setFundFilter] = useState(initialFundId);
  const [linkedFilter, setLinkedFilter] = useState(initialLinked);
  const [dialogOpen, setDialogOpen] = useState(autoOpenCreate);
  const [editing, setEditing] = useState<Donation | null>(null);
  const [deleting, setDeleting] = useState<Donation | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [rejecting, setRejecting] = useState<Donation | null>(null);
  const [approveUnlinked, setApproveUnlinked] = useState<Donation | null>(null);
  const [approvePending, setApprovePending] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectPending, setRejectPending] = useState(false);

  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (fundFilter) params.set("fund", fundFilter);
    if (linkedFilter) params.set("linked", linkedFilter);
    const qs = params.toString();
    router.push(qs ? `?${qs}` : "?");
  }, [search, status, fundFilter, linkedFilter, router]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletePending(true);
    const fd = new FormData();
    fd.set("id", deleting.id);
    const res = await deleteDonation(fd);
    setDeletePending(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Donation archived");
      setDeleting(null);
      router.refresh();
    }
  };

  const handleApprove = async (d: Donation) => {
    setApprovePending(true);
    const fd = new FormData();
    fd.set("id", d.id);
    const res = await approveDonation(fd);
    setApprovePending(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Donation approved");
      setApproveUnlinked(null);
      router.refresh();
    }
  };

  // Approving is the moment the money starts counting, so an unlinked donation
  // into an event's fund is worth one confirmation rather than a silent gap.
  const handleApproveClick = (d: Donation) => {
    if (!d.member_id && d.fund_id && eventFundIds.includes(d.fund_id)) {
      setApproveUnlinked(d);
      return;
    }
    void handleApprove(d);
  };

  const handleReject = async () => {
    if (!rejecting) return;
    setRejectPending(true);
    const fd = new FormData();
    fd.set("id", rejecting.id);
    fd.set("reason", rejectReason);
    const res = await rejectDonation(fd);
    setRejectPending(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Donation rejected");
      setRejecting(null);
      setRejectReason("");
      router.refresh();
    }
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (d: Donation) => {
    setEditing(d);
    setDialogOpen(true);
  };

  const columns = [
    {
      key: "donor",
      header: "Donor",
      cell: (d: DonationRow) => (
        <div>
          <p className="font-medium">{d.is_anonymous ? "Anonymous" : d.donor_name}</p>
          <p className="text-xs text-muted-foreground">{d.receipt_number || d.donor_phone || "-"}</p>
        </div>
      ),
    },
    {
      key: "fund",
      header: "Fund",
      cell: (d: DonationRow) => <span>{d.donation_funds?.name || "General"}</span>,
    },
    {
      key: "member",
      header: "Member",
      cell: (d: DonationRow) =>
        d.members ? (
          <div>
            <p className="font-medium">{d.members.full_name}</p>
            <p className="text-xs text-muted-foreground">{d.members.member_id}</p>
          </div>
        ) : (
          // Surface the gap rather than hiding it: an unlinked donation never
          // counts towards a member's contribution status.
          <span className="text-xs text-muted-foreground">Not linked</span>
        ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (d: DonationRow) => (
        <span className="font-medium">{formatCurrency(Number(d.amount) || 0)}</span>
      ),
    },
    {
      key: "method",
      header: "Method",
      cell: (d: Donation) => (
        <span className="capitalize">{d.payment_method?.replace("_", " ") || "-"}</span>
      ),
    },
    {
      key: "date",
      header: "Date",
      cell: (d: Donation) => <span>{d.donation_date ? formatDate(d.donation_date) : "-"}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (d: Donation) => (
        <StatusBadge status={d.status} statuses={[...DONATION_STATUSES]} />
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (d: Donation) => (
        <div className="flex items-center justify-end gap-1">
          {d.status === "pending" && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleApproveClick(d);
                }}
                className="rounded-md p-1.5 text-green-600 hover:bg-green-50"
                aria-label="Approve"
                title="Approve"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRejecting(d);
                }}
                className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
                aria-label="Reject"
                title="Reject"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(d);
            }}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleting(d);
            }}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Donations" description="Track all donations and pledges received.">
        <PageActions onNew={openCreate} newLabel="Add Donation" />
      </PageHeader>

      <AdminTableWrapper
        title="All Donations"
        description={`${total} donations found`}
        empty={donations.length === 0}
        emptyTitle="No donations"
        emptyDescription="No donations match your current filters."
      >
        <div className="px-4 pb-4 pt-4">
          <FilterBar
            search={searchInput}
            onSearchChange={setSearchInput}
            filters={[
              {
                key: "status",
                label: "Status",
                value: status || "__all__",
                onChange: (v) => setStatus(v === "__all__" ? "" : v),
                options: DONATION_STATUSES.map((s) => ({ value: s.value, label: s.label })),
              },
              {
                key: "fund",
                label: "Fund",
                value: fundFilter || "__all__",
                onChange: (v) => setFundFilter(v === "__all__" ? "" : v),
                options: funds.map((f) => ({ value: f.id, label: f.name })),
              },
              {
                key: "linked",
                label: "Member",
                value: linkedFilter || "__all__",
                onChange: (v) => setLinkedFilter(v === "__all__" ? "" : v),
                options: [
                  { value: "unlinked", label: "Not linked" },
                  { value: "linked", label: "Linked" },
                ],
              },
            ]}
          />
        </div>
        <MobileRecordList
          items={donations}
          getKey={(d) => d.id}
          renderCard={(d) => (
            <MobileRecordCard className="px-3 py-3.5">
              <div className="flex items-start gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold uppercase text-primary">
                  {(d.is_anonymous ? "Anonymous" : d.donor_name)
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <MobileRecordHead
                    title={d.is_anonymous ? "Anonymous" : d.donor_name}
                    subtitle={d.receipt_number || d.donor_phone || undefined}
                    trailing={<StatusBadge status={d.status} statuses={[...DONATION_STATUSES]} />}
                  />
                  <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-border/70 pt-2.5 text-[11px]">
                    <div>
                      <p className="uppercase tracking-wide text-muted-foreground">Amount</p>
                      <p className="mt-0.5 font-semibold text-primary">
                        {formatCurrency(Number(d.amount) || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="uppercase tracking-wide text-muted-foreground">Fund</p>
                      <p className="mt-0.5 truncate font-medium text-foreground">
                        {d.donation_funds?.name || "General"}
                      </p>
                    </div>
                    <div>
                      <p className="uppercase tracking-wide text-muted-foreground">Method</p>
                      <p className="mt-0.5 capitalize font-medium text-foreground">
                        {d.payment_method?.replace(/_/g, " ") || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="uppercase tracking-wide text-muted-foreground">Date</p>
                      <p className="mt-0.5 font-medium text-foreground">
                        {d.donation_date ? formatDate(d.donation_date) : "—"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="uppercase tracking-wide text-muted-foreground">Member</p>
                      <p className="mt-0.5 truncate font-medium text-foreground">
                        {d.members ? `${d.members.full_name} (${d.members.member_id})` : "Not linked"}
                      </p>
                    </div>
                  </div>
                  <MobileRecordFooter>
                    {d.status === "pending" && (
                      <>
                        <MobileActionButton
                          label="Approve"
                          success
                          onClick={() => handleApproveClick(d)}
                        >
                          <Check className="h-4 w-4" />
                        </MobileActionButton>
                        <MobileActionButton label="Reject" onClick={() => setRejecting(d)}>
                          <X className="h-4 w-4" />
                        </MobileActionButton>
                      </>
                    )}
                    <MobileActionButton label="Edit" onClick={() => openEdit(d)}>
                      <Pencil className="h-4 w-4" />
                    </MobileActionButton>
                    <MobileActionButton label="Delete" destructive onClick={() => setDeleting(d)}>
                      <Trash2 className="h-4 w-4" />
                    </MobileActionButton>
                  </MobileRecordFooter>
                </div>
              </div>
            </MobileRecordCard>
          )}
        />

        <DesktopTableOnly>
          <DataTable data={donations} columns={columns} />
        </DesktopTableOnly>
        <div className="px-4 pb-4">
          <PaginationBar
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={(p) => router.push(`?page=${p}`)}
          />
        </div>
      </AdminTableWrapper>

      <DonationFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        funds={funds}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Archive donation"
        description={`Are you sure you want to archive this donation from ${deleting?.is_anonymous ? "Anonymous" : deleting?.donor_name}? This action cannot be undone.`}
        confirmText="Archive"
        loading={deletePending}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={!!approveUnlinked}
        onOpenChange={(o) => !o && setApproveUnlinked(null)}
        title="No member linked"
        description={`${approveUnlinked?.donor_name ?? "This donor"} gave to ${
          funds.find((f) => f.id === approveUnlinked?.fund_id)?.name ?? "an event fund"
        } without a linked member. Approving it will count toward the fund but not toward any member's contribution. Link a member first, or approve anyway.`}
        confirmText="Approve anyway"
        loading={approvePending}
        onConfirm={() => approveUnlinked && handleApprove(approveUnlinked)}
      />

      <FormDialog
        open={!!rejecting}
        onOpenChange={(o) => {
          if (!o) {
            setRejecting(null);
            setRejectReason("");
          }
        }}
        title="Reject donation"
        description="Provide a reason for rejecting this donation."
      >
        <div className="space-y-4">
          <FormTextarea
            label="Rejection reason"
            name="reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRejecting(null)}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              <RotateCcw className="h-4 w-4" />
              Cancel
            </button>
            <FormSubmitButton loading={rejectPending} onClick={handleReject}>
              Reject Donation
            </FormSubmitButton>
          </div>
        </div>
      </FormDialog>
    </div>
  );
}

function DonationFormDialog({
  open,
  onOpenChange,
  editing,
  funds,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Donation | null;
  funds: DonationFund[];
}) {
  const [fundValue, setFundValue] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  const editingRef = useRef(editing);
  editingRef.current = editing;

  const action = editing ? updateDonation : createDonation;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [, startSubmitTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<DonationFormValues>({
    resolver: zodResolver(donationSchema) as never,
    defaultValues: {
      donor_name: "",
      donor_phone: "",
      donor_email: "",
      fund_id: "",
      amount: undefined,
      payment_method: "",
      transaction_id: "",
      donation_date: new Date().toISOString().split("T")[0],
      is_anonymous: false,
      notes: "",
    },
  });

  const watchPayment = watch("payment_method") as string;

  // Held outside react-hook-form because it is an object (a member), and the
  // form serialises entries as strings. Kept in sync into the form on submit.
  const [linkedMember, setLinkedMember] = useState<DonationMemberOption | null>(null);

  useEffect(() => {
    if (open) {
      setLinkedMember(
        editing?.member_id
          ? {
              id: editing.member_id,
              // From the joined member record where available. A donation linked
              // before the member was deleted, or before the join existed, still
              // shows as linked rather than silently appearing unlinked.
              member_code: editing.members?.member_id ?? "",
              full_name: editing.members?.full_name ?? "Linked member",
              phone: null,
              email: null,
            }
          : null
      );
    }
  }, [open, editing]);

  useEffect(() => {
    if (open) {
      reset({
        donor_name: editing?.donor_name || "",
        donor_phone: editing?.donor_phone || "",
        donor_email: editing?.donor_email || "",
        fund_id: editing?.fund_id || "",
        amount: editing?.amount != null ? Number(editing.amount) : undefined,
        payment_method: editing?.payment_method || "",
        transaction_id: editing?.transaction_id || "",
        donation_date: editing?.donation_date || new Date().toISOString().split("T")[0],
        is_anonymous: editing?.is_anonymous || false,
        notes: editing?.notes || "",
      });
      setFundValue(editing?.fund_id || "");
      setAnonymous(editing?.is_anonymous || false);
    }
  }, [open, editing, reset]);

  useEffect(() => {
    if (state.success) {
      toast.success(editingRef.current ? "Donation updated" : "Donation added");
      onOpenChangeRef.current(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  const onSubmit = (values: DonationFormValues) => {
    const fd = new FormData();
    if (editing) fd.set("id", editing.id);
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") fd.set(k, String(v));
    });
    fd.set("donation_date", values.donation_date || new Date().toISOString().split("T")[0]);
    fd.set("is_anonymous", anonymous ? "on" : "");
    // Sent explicitly, including as an empty string, so clearing the link on an
    // edit actually unlinks the donation instead of leaving the old value in
    // place: the loop above skips empty values, which would make unlinking
    // impossible.
    fd.set("member_id", linkedMember?.id ?? "");
    startSubmitTransition(() => {
      formAction(fd);
    });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Edit Donation" : "Add Donation"}
      description={editing ? "Update the donation details below." : "Record a new donation received."}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={state.error} />
        <FormInput
          label="Donor name"
          name="donor_name"
          register={register("donor_name")}
          error={errors.donor_name?.message}
          required
        />
        <DonationMemberPicker value={linkedMember} onChange={setLinkedMember} disabled={pending} />
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Phone"
            name="donor_phone"
            register={register("donor_phone")}
            error={errors.donor_phone?.message}
            required
          />
          <FormInput
            label="Email"
            name="donor_email"
            register={register("donor_email")}
            error={errors.donor_email?.message}
            type="email"
          />
        </div>
        <FormSelect
          label="Donation Fund"
          name="fund_id"
          value={fundValue}
          onValueChange={(v) => {
            setFundValue(v);
            setValue("fund_id", v === "" ? null : v);
          }}
          options={[
            { value: "", label: "General Fund (default)" },
            ...funds.map((f) => ({ value: f.id, label: f.name })),
          ]}
          placeholder="Select a fund (optional)"
        />
        <input type="hidden" {...register("fund_id")} />
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Amount (৳)"
            name="amount"
            type="number"
            step="0.01"
            register={register("amount")}
            error={errors.amount?.message}
            required
          />
          <FormSelect
            label="Payment Method"
            name="payment_method"
            value={watchPayment}
            onValueChange={(v) => setValue("payment_method", v as DonationFormValues["payment_method"])}
            options={[...PAYMENT_METHODS]}
            required
          />
          <input type="hidden" {...register("payment_method")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Transaction / Reference ID"
            name="transaction_id"
            register={register("transaction_id")}
          />
          <FormInput
            label="Donation date"
            name="donation_date"
            type="date"
            register={register("donation_date")}
            error={errors.donation_date?.message}
            required
          />
        </div>
        <FormInput label="Notes" name="notes" register={register("notes")} />
        <label className="flex items-center gap-3 text-sm cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-input accent-primary"
            checked={anonymous}
            onChange={(e) => {
              setAnonymous(e.target.checked);
              setValue("is_anonymous", e.target.checked);
            }}
          />
          <span>Anonymous donation</span>
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <FormSubmitButton loading={pending}>
            {editing ? "Save Changes" : "Add Donation"}
          </FormSubmitButton>
        </div>
      </form>
    </FormDialog>
  );
}
