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
import { PaginationBar } from "@/components/admin/pagination-bar";
import { FilterBar } from "@/components/admin/filter-bar";
import { StatusBadge } from "@/components/admin/status-badge";
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
  initialSearch: string;
  initialStatus: string;
  initialFundId: string;
  page: number;
  total: number;
  totalPages: number;
  autoOpenCreate: boolean;
}

export function DonationsClient({
  donations,
  funds,
  initialSearch,
  initialStatus,
  initialFundId,
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
  const [dialogOpen, setDialogOpen] = useState(autoOpenCreate);
  const [editing, setEditing] = useState<Donation | null>(null);
  const [deleting, setDeleting] = useState<Donation | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [rejecting, setRejecting] = useState<Donation | null>(null);
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
    const qs = params.toString();
    router.push(qs ? `?${qs}` : "?");
  }, [search, status, fundFilter, router]);

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
    const fd = new FormData();
    fd.set("id", d.id);
    const res = await approveDonation(fd);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Donation approved");
      router.refresh();
    }
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
                  handleApprove(d);
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
            ]}
          />
        </div>
        <DataTable data={donations} columns={columns} />
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
