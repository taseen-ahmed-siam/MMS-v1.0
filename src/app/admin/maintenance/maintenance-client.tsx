"use client";

import * as React from "react";
import { useActionState, useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { z } from "zod";

import type { MaintenanceRequest, Asset } from "@/types/database";
import {
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
} from "@/lib/actions/admin";
import { maintenanceSchema } from "@/lib/validations";
import {
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_STATUSES,
} from "@/constants";
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
  FormTextarea,
  FormSubmitButton,
  ConfirmDialog,
  ErrorMessage,
  PageHeader,
} from "@/components/forms";
import { FormDialog } from "@/components/admin/form-dialog";

type ActionResult = { error?: string; success?: boolean; id?: string };

const initialState: ActionResult = {};

type MaintenanceRow = MaintenanceRequest & {
  assets: { name: string } | null;
};

interface MaintenanceClientProps {
  requests: MaintenanceRow[];
  assets: Asset[];
  initialSearch: string;
  initialStatus: string;
  initialPriority: string;
  page: number;
  total: number;
  totalPages: number;
}

export function MaintenanceClient({
  requests,
  assets,
  initialSearch,
  initialStatus,
  initialPriority,
  page,
  total,
  totalPages,
}: MaintenanceClientProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [priority, setPriority] = useState(initialPriority);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MaintenanceRequest | null>(null);
  const [deleting, setDeleting] = useState<MaintenanceRequest | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    const qs = params.toString();
    router.push(qs ? `?${qs}` : "?");
  }, [search, status, router]);

  const filtered = useMemo(() => {
    if (!priority) return requests;
    return requests.filter((r) => r.priority === priority);
  }, [requests, priority]);

  const assetOptions = useMemo(
    () => assets.map((a) => ({ value: a.id, label: a.name })),
    [assets]
  );

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (r: MaintenanceRequest) => {
    setEditing(r);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletePending(true);
    const fd = new FormData();
    fd.set("id", deleting.id);
    const res = await deleteMaintenance(fd);
    setDeletePending(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Maintenance request deleted");
      setDeleting(null);
      router.refresh();
    }
  };

  const columns = [
    {
      key: "title",
      header: "Title",
      cell: (r: MaintenanceRow) => (
        <div>
          <p className="font-medium">{r.title}</p>
          <p className="text-xs text-muted-foreground">{r.ticket_id}</p>
        </div>
      ),
    },
    {
      key: "asset",
      header: "Asset",
      cell: (r: MaintenanceRow) => <span>{r.assets?.name || "-"}</span>,
    },
    {
      key: "priority",
      header: "Priority",
      cell: (r: MaintenanceRow) => (
        <StatusBadge status={r.priority} statuses={[...MAINTENANCE_PRIORITIES]} />
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r: MaintenanceRow) => (
        <StatusBadge status={r.status} statuses={[...MAINTENANCE_STATUSES]} />
      ),
    },
    {
      key: "assigned_person",
      header: "Assigned To",
      cell: (r: MaintenanceRow) => <span>{r.assigned_person || "-"}</span>,
    },
    {
      key: "estimated_cost",
      header: "Est. Cost",
      cell: (r: MaintenanceRow) => (
        <span className="font-medium">
          {r.estimated_cost != null ? formatCurrency(Number(r.estimated_cost)) : "-"}
        </span>
      ),
    },
    {
      key: "created_date",
      header: "Created",
      cell: (r: MaintenanceRow) => <span>{formatDate(r.created_date)}</span>,
    },
    {
      key: "completion_date",
      header: "Completed",
      cell: (r: MaintenanceRow) => (
        <span>{r.completion_date ? formatDate(r.completion_date) : "-"}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (r: MaintenanceRow) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(r);
            }}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleting(r);
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
      <PageHeader
        title="Maintenance"
        description="Track asset maintenance and repair requests."
      >
        <PageActions onNew={openCreate} newLabel="New Request" />
      </PageHeader>

      <AdminTableWrapper
        title="Maintenance Requests"
        description={`${total} requests found`}
        empty={filtered.length === 0}
        emptyTitle="No requests"
        emptyDescription="No maintenance requests match your current filters."
      >
        <div className="px-4 pt-4">
          <FilterBar
            search={searchInput}
            onSearchChange={setSearchInput}
            filters={[
              {
                key: "status",
                label: "Status",
                value: status || "__all__",
                onChange: (v) => setStatus(v === "__all__" ? "" : v),
                options: MAINTENANCE_STATUSES.map((s) => ({
                  value: s.value,
                  label: s.label,
                })),
              },
              {
                key: "priority",
                label: "Priority",
                value: priority || "__all__",
                onChange: (v) => setPriority(v === "__all__" ? "" : v),
                options: MAINTENANCE_PRIORITIES.map((s) => ({
                  value: s.value,
                  label: s.label,
                })),
              },
            ]}
          />
        </div>
        <DataTable data={filtered} columns={columns} />
        <div className="px-4 pb-4">
          <PaginationBar
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={(p) => router.push(`?page=${p}`)}
          />
        </div>
      </AdminTableWrapper>

      <MaintenanceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        assetOptions={assetOptions}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete maintenance request"
        description={`Are you sure you want to delete "${deleting?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deletePending}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function MaintenanceFormDialog({
  open,
  onOpenChange,
  editing,
  assetOptions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: MaintenanceRequest | null;
  assetOptions: { value: string; label: string }[];
}) {
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("pending");
  const [assetId, setAssetId] = useState("");
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  const editingRef = useRef(editing);
  editingRef.current = editing;

  const action = editing ? updateMaintenance : createMaintenance;
  const [state, formAction, pending] = useActionState(action, initialState);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof maintenanceSchema>>({
    resolver: zodResolver(maintenanceSchema) as never,
    defaultValues: {
      title: "",
      asset_id: "",
      description: "",
      priority: "medium",
      assigned_person: "",
      estimated_cost: undefined,
      actual_cost: undefined,
      created_date: "",
      completion_date: "",
      status: "pending",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: editing?.title || "",
        asset_id: editing?.asset_id || "",
        description: editing?.description || "",
        priority: editing?.priority || "medium",
        assigned_person: editing?.assigned_person || "",
        estimated_cost:
          editing?.estimated_cost != null ? Number(editing.estimated_cost) : undefined,
        actual_cost:
          editing?.actual_cost != null ? Number(editing.actual_cost) : undefined,
        created_date: editing?.created_date || "",
        completion_date: editing?.completion_date || "",
        status: editing?.status || "pending",
      });
      setPriority(editing?.priority || "medium");
      setStatus(editing?.status || "pending");
      setAssetId(editing?.asset_id || "");
    }
  }, [open, editing, reset]);

  useEffect(() => {
    if (state.success) {
      toast.success(editingRef.current ? "Maintenance updated" : "Maintenance created");
      onOpenChangeRef.current(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  const onSubmit = (values: z.input<typeof maintenanceSchema>) => {
    const fd = new FormData();
    if (editing) fd.set("id", editing.id);
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") fd.set(k, String(v));
    });
    if (assetId) fd.set("asset_id", assetId);
    fd.set("priority", priority);
    fd.set("status", status);
    formAction(fd);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Edit Maintenance" : "New Maintenance Request"}
      description="Fill in the maintenance details below."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={state.error} />
        <FormInput
          label="Title"
          name="title"
          register={register("title")}
          error={errors.title?.message}
          required
        />
        <FormSelect
          label="Asset"
          name="asset_id"
          value={assetId}
          onValueChange={(v) => setAssetId(v === "__none__" ? "" : v)}
          options={[
            { value: "__none__", label: "No asset" },
            ...assetOptions,
          ]}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormSelect
            label="Priority"
            name="priority"
            value={priority}
            onValueChange={setPriority}
            options={MAINTENANCE_PRIORITIES.map((p) => ({
              value: p.value,
              label: p.label,
            }))}
            required
          />
          <FormSelect
            label="Status"
            name="status"
            value={status}
            onValueChange={setStatus}
            options={MAINTENANCE_STATUSES.map((s) => ({
              value: s.value,
              label: s.label,
            }))}
          />
        </div>
        <FormInput
          label="Assigned person"
          name="assigned_person"
          register={register("assigned_person")}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Estimated cost"
            name="estimated_cost"
            type="number"
            step="0.01"
            register={register("estimated_cost")}
            error={errors.estimated_cost?.message}
          />
          <FormInput
            label="Actual cost"
            name="actual_cost"
            type="number"
            step="0.01"
            register={register("actual_cost")}
            error={errors.actual_cost?.message}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Created date"
            name="created_date"
            type="date"
            register={register("created_date")}
          />
          <FormInput
            label="Completion date"
            name="completion_date"
            type="date"
            register={register("completion_date")}
          />
        </div>
        <FormTextarea
          label="Description"
          name="description"
          register={register("description")}
        />
        <div className="flex justify-end gap-2 pt-2">
          <FormSubmitButton loading={pending}>
            {editing ? "Save Changes" : "Create Request"}
          </FormSubmitButton>
        </div>
      </form>
    </FormDialog>
  );
}
