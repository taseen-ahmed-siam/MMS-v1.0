"use client";

import { useActionState, useEffect, useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { staffSchema } from "@/lib/validations";
import { createStaff, updateStaff, deleteStaff } from "@/lib/actions/admin";
import { STAFF_ROLES, STAFF_STATUSES } from "@/constants";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import type { Staff } from "@/types/database";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FilterBar } from "@/components/admin/filter-bar";
import { PaginationBar } from "@/components/admin/pagination-bar";
import { FormDialog } from "@/components/admin/form-dialog";
import { StatusBadge } from "@/components/admin/status-badge";
import { AdminTableWrapper } from "@/components/admin/table-wrapper";
import { PageHeader } from "@/components/forms/page-header";
import { FormInput } from "@/components/forms/form-input";
import { FormSelect } from "@/components/forms/form-select";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import { Button } from "@/components/ui/button";

type FormData = z.infer<typeof staffSchema>;

interface StaffClientProps {
  data: Staff[];
  total: number;
  page: number;
  totalPages: number;
  filters: { search: string; status?: string };
}

const defaultValues: FormData = {
  name: "",
  role: "",
  phone: "",
  email: "",
  address: "",
  joining_date: "",
  salary: undefined,
  employment_status: "active",
  notes: "",
};

export function StaffClient({ data, total, page, totalPages, filters }: StaffClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Staff | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [createState, createFormAction, isCreating] = useActionState(createStaff, {});
  const [updateState, updateFormAction, isUpdating] = useActionState(updateStaff, {});
  const [isDeleting, startDeleteTransition] = useTransition();

  const form = useForm<FormData>({
    resolver: zodResolver(staffSchema),
    defaultValues,
  });

  useEffect(() => {
    if (createState.success) {
      toast.success("Staff member added");
      router.refresh();
      setDialogOpen(false);
      form.reset(defaultValues);
    } else if (createState.error) {
      toast.error(createState.error);
    }
  }, [createState, router, form]);

  useEffect(() => {
    if (updateState.success) {
      toast.success("Staff member updated");
      router.refresh();
      setDialogOpen(false);
      setEditingItem(null);
      form.reset(defaultValues);
    } else if (updateState.error) {
      toast.error(updateState.error);
    }
  }, [updateState, router, form]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "__all__") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePageChange = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  };

  const openCreate = () => {
    setEditingItem(null);
    form.reset(defaultValues);
    setDialogOpen(true);
  };

  const openEdit = (item: Staff) => {
    setEditingItem(item);
    form.reset({
      name: item.name,
      role: item.role,
      phone: item.phone ?? "",
      email: item.email ?? "",
      address: item.address ?? "",
      joining_date: item.joining_date ?? "",
      salary: item.salary ?? undefined,
      employment_status: item.employment_status,
      notes: item.notes ?? "",
    });
    setDialogOpen(true);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    startDeleteTransition(async () => {
      const fd = new FormData();
      fd.set("id", deleteId);
      const result = await deleteStaff(fd);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Staff member removed");
        router.refresh();
        setDeleteId(null);
      }
    });
  };

  const onSubmit = form.handleSubmit((data) => {
    const fd = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        fd.set(key, String(value));
      }
    });
    if (editingItem) {
      fd.set("id", editingItem.id);
      updateFormAction(fd);
    } else {
      createFormAction(fd);
    }
  });

  const columns: Column<Staff>[] = [
    { key: "name", header: "Name", cell: (row) => (
      <div>
        <p className="font-medium">{row.name}</p>
        <p className="text-xs text-muted-foreground">{row.staff_id}</p>
      </div>
    )},
    { key: "role", header: "Role", cell: (row) => row.role },
    { key: "phone", header: "Phone", cell: (row) => row.phone },
    { key: "salary", header: "Salary", cell: (row) => (
      <span>{row.salary != null ? formatCurrency(row.salary) : "—"}</span>
    )},
    { key: "joining_date", header: "Joined", cell: (row) => (
      <span className="text-sm text-muted-foreground">{formatDate(row.joining_date)}</span>
    )},
    { key: "employment_status", header: "Status", cell: (row) => (
      <StatusBadge status={row.employment_status} statuses={[...STAFF_STATUSES]} />
    )},
    { key: "actions", header: "", cell: (row) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); }}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    ), className: "w-24" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Staff" description="Manage mosque staff">
        <Button size="sm" onClick={openCreate}>Add Staff</Button>
      </PageHeader>

      <FilterBar
        search={filters.search}
        onSearchChange={(v) => updateParam("search", v)}
        filters={[
          {
            key: "status",
            label: "Status",
            value: filters.status ?? "__all__",
            onChange: (v) => updateParam("status", v),
            options: STAFF_STATUSES.map((s) => ({ value: s.value, label: s.label })),
          },
        ]}
      />

      <AdminTableWrapper empty={data.length === 0} emptyTitle="No staff members">
        <DataTable columns={columns} data={data} />
      </AdminTableWrapper>

      <PaginationBar page={page} totalPages={totalPages} total={total} onPageChange={handlePageChange} />

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingItem ? "Edit Staff" : "Add Staff"}
        footer={
          <div className="flex w-full gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <FormSubmitButton loading={isCreating || isUpdating} form="staff-form">
              {editingItem ? "Update" : "Create"}
            </FormSubmitButton>
          </div>
        }
      >
        <form id="staff-form" onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Name"
              name="name"
              required
              register={form.register("name")}
              error={form.formState.errors.name?.message}
            />
            <FormSelect
              label="Role"
              name="role"
              required
              value={form.watch("role")}
              onValueChange={(v) => form.setValue("role", v)}
              options={STAFF_ROLES.map((r) => ({ value: r, label: r }))}
              error={form.formState.errors.role?.message}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Phone"
              name="phone"
              register={form.register("phone")}
            />
            <FormInput
              label="Email"
              name="email"
              type="email"
              register={form.register("email")}
            />
          </div>
          <FormInput
            label="Address"
            name="address"
            register={form.register("address")}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Joining Date"
              name="joining_date"
              type="date"
              register={form.register("joining_date")}
            />
            <FormInput
              label="Salary"
              name="salary"
              type="number"
              register={form.register("salary", { valueAsNumber: true })}
              error={form.formState.errors.salary?.message}
            />
          </div>
          <FormSelect
            label="Employment Status"
            name="employment_status"
            required
            value={form.watch("employment_status")}
            onValueChange={(v) => form.setValue("employment_status", v as FormData["employment_status"])}
            options={STAFF_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
            error={form.formState.errors.employment_status?.message}
          />
          <FormTextarea
            label="Notes"
            name="notes"
            register={form.register("notes")}
          />
        </form>
      </FormDialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        onConfirm={handleDelete}
        title="Remove Staff Member"
        description="This staff member will be marked as inactive."
        confirmText="Remove"
        loading={isDeleting}
      />
    </div>
  );
}
