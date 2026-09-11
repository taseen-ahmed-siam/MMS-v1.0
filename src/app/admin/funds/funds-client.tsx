"use client";

import * as React from "react";
import { useActionState, useState, useEffect, useMemo, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { z } from "zod";

import type { DonationFund } from "@/types/database";
import { createFund, updateFund, deleteFund } from "@/lib/actions/admin";
import { fundSchema } from "@/lib/validations";
import { formatCurrency } from "@/lib/utils/format";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/admin/data-table";
import { FilterBar } from "@/components/admin/filter-bar";
import { StatusBadge } from "@/components/admin/status-badge";
import { PageActions } from "@/components/admin/page-actions";
import { AdminTableWrapper } from "@/components/admin/table-wrapper";
import {
  FormInput,
  FormSelect,
  FormTextarea,
  FormSubmitButton,
  ConfirmDialog,
  ErrorMessage,
  PageHeader,
} from "@/components/forms";
import { FormDialog } from "@/components/admin/form-dialog";

const FUND_STATUSES = [
  { value: "active", label: "Active", color: "text-green-600" },
  { value: "completed", label: "Completed", color: "text-blue-600" },
  { value: "paused", label: "Paused", color: "text-yellow-600" },
  { value: "cancelled", label: "Cancelled", color: "text-red-600" },
] as const;

type FundFormValues = Omit<z.input<typeof fundSchema>, "status"> & {
  status: string;
};

type ActionResult = { error?: string; success?: boolean; id?: string };

const initialState: ActionResult = {};

interface FundsClientProps {
  funds: DonationFund[];
}

export function FundsClient({ funds }: FundsClientProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DonationFund | null>(null);
  const [deleting, setDeleting] = useState<DonationFund | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const filtered = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    return funds.filter((f) => {
      const matchesSearch =
        !q || f.name.toLowerCase().includes(q) || (f.description || "").toLowerCase().includes(q);
      const matchesStatus = !statusFilter || f.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [funds, searchInput, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (f: DonationFund) => {
    setEditing(f);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletePending(true);
    const fd = new FormData();
    fd.set("id", deleting.id);
    const res = await deleteFund(fd);
    setDeletePending(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Fund deleted");
      setDeleting(null);
      router.refresh();
    }
  };

  const columns = [
    {
      key: "name",
      header: "Fund",
      cell: (f: DonationFund) => (
        <div>
          <p className="font-medium">{f.name}</p>
          <p className="text-xs text-muted-foreground">{f.slug}</p>
        </div>
      ),
    },
    {
      key: "target",
      header: "Target",
      cell: (f: DonationFund) => (
        <span>{formatCurrency(Number(f.target_amount) || 0)}</span>
      ),
    },
    {
      key: "collected",
      header: "Collected",
      cell: (f: DonationFund) => (
        <span className="font-medium">{formatCurrency(Number(f.collected_amount) || 0)}</span>
      ),
    },
    {
      key: "progress",
      header: "Progress",
      cell: (f: DonationFund) => {
        const target = Number(f.target_amount) || 0;
        const collected = Number(f.collected_amount) || 0;
        const pct = target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-muted-foreground">{pct}%</span>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (f: DonationFund) => (
        <StatusBadge status={f.status} statuses={[...FUND_STATUSES]} />
      ),
    },
    {
      key: "visibility",
      header: "Visibility",
      cell: (f: DonationFund) => (
        <span>{f.is_visible ? "Visible" : "Hidden"}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (f: DonationFund) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(f);
            }}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleting(f);
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
      <PageHeader title="Donation Funds" description="Manage donation funds and their targets.">
        <PageActions onNew={openCreate} newLabel="Add Fund" />
      </PageHeader>

      <AdminTableWrapper
        title="All Funds"
        description={`${filtered.length} funds`}
        empty={filtered.length === 0}
        emptyTitle="No funds"
        emptyDescription="No funds match your current filters."
      >
        <div className="px-4 pb-4 pt-4">
          <FilterBar
            search={searchInput}
            onSearchChange={setSearchInput}
            filters={[
              {
                key: "status",
                label: "Status",
                value: statusFilter || "__all__",
                onChange: (v) => setStatusFilter(v === "__all__" ? "" : v),
                options: FUND_STATUSES.map((s) => ({ value: s.value, label: s.label })),
              },
            ]}
          />
        </div>
        <DataTable data={filtered} columns={columns} />
      </AdminTableWrapper>

      <FundFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete fund"
        description={`Are you sure you want to delete "${deleting?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deletePending}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function FundFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: DonationFund | null;
}) {
  const [statusValue, setStatusValue] = useState("active");
  const [isVisible, setIsVisible] = useState(true);
  const [featured, setFeatured] = useState(false);
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  const editingRef = useRef(editing);
  editingRef.current = editing;

  const action = editing ? updateFund : createFund;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [, startSubmitTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FundFormValues>({
    resolver: zodResolver(fundSchema) as never,
    defaultValues: {
      name: "",
      description: "",
      target_amount: undefined,
      start_date: "",
      end_date: "",
      status: "active",
      is_visible: true,
      featured: false,
    },
  });

  const watchStatus = watch("status") as string;

  useEffect(() => {
    if (open) {
      reset({
        name: editing?.name || "",
        description: editing?.description || "",
        target_amount: editing?.target_amount != null ? Number(editing.target_amount) : undefined,
        start_date: editing?.start_date || "",
        end_date: editing?.end_date || "",
        status: editing?.status || "active",
        is_visible: editing?.is_visible ?? true,
        featured: editing?.featured ?? false,
      });
      setStatusValue(editing?.status || "active");
      setIsVisible(editing?.is_visible ?? true);
      setFeatured(editing?.featured ?? false);
    }
  }, [open, editing, reset]);

  useEffect(() => {
    if (state.success) {
      toast.success(editingRef.current ? "Fund updated" : "Fund created");
      onOpenChangeRef.current(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  const onSubmit = (values: FundFormValues) => {
    const fd = new FormData();
    if (editing) fd.set("id", editing.id);
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") fd.set(k, String(v));
    });
    fd.set("is_visible", isVisible ? "on" : "");
    fd.set("featured", featured ? "on" : "");
    startSubmitTransition(() => {
      formAction(fd);
    });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Edit Fund" : "Add Fund"}
      description={editing ? "Update the fund details below." : "Create a new donation fund."}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={state.error} />
        <FormInput
          label="Fund name"
          name="name"
          register={register("name")}
          error={errors.name?.message}
          required
        />
        <FormTextarea
          label="Description"
          name="description"
          register={register("description")}
          rows={2}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Target amount (৳)"
            name="target_amount"
            type="number"
            step="0.01"
            register={register("target_amount")}
            error={errors.target_amount?.message}
          />
          <FormSelect
            label="Status"
            name="status"
            value={watchStatus}
            onValueChange={(v) => setValue("status", v)}
            options={FUND_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
            required
          />
          <input type="hidden" {...register("status")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="Start date" name="start_date" type="date" register={register("start_date")} />
          <FormInput label="End date" name="end_date" type="date" register={register("end_date")} />
        </div>
        <div className="flex items-center gap-6 pt-1">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={isVisible}
              onCheckedChange={(v) => {
                setIsVisible(!!v);
                setValue("is_visible", !!v);
              }}
            />
            <span>Visible on public site</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={featured}
              onCheckedChange={(v) => {
                setFeatured(!!v);
                setValue("featured", !!v);
              }}
            />
            <span>Featured</span>
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <FormSubmitButton loading={pending}>
            {editing ? "Save Changes" : "Create Fund"}
          </FormSubmitButton>
        </div>
      </form>
    </FormDialog>
  );
}
