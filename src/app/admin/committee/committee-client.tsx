"use client";

import { useActionState, useEffect, useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { committeeMemberSchema } from "@/lib/validations";
import {
  createCommitteeMember,
  updateCommitteeMember,
  deleteCommitteeMember,
} from "@/lib/actions/admin";
import { COMMITTEE_DESIGNATIONS } from "@/constants";
import { formatDate } from "@/lib/utils/format";
import type { CommitteeMember } from "@/types/database";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FilterBar } from "@/components/admin/filter-bar";
import { FormDialog } from "@/components/admin/form-dialog";
import { StatusBadge } from "@/components/admin/status-badge";
import { AdminTableWrapper } from "@/components/admin/table-wrapper";
import { PageHeader } from "@/components/forms/page-header";
import { FormInput } from "@/components/forms/form-input";
import { FormSelect } from "@/components/forms/form-select";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type FormData = z.input<typeof committeeMemberSchema>;

const isCurrentStatuses = [
  { value: "true", label: "Current", color: "text-green-600" },
  { value: "false", label: "Past", color: "text-gray-600" },
];

interface CommitteeClientProps {
  data: CommitteeMember[];
}

const defaultValues: FormData = {
  name: "",
  designation: "",
  phone: "",
  email: "",
  committee_period: "",
  start_date: "",
  end_date: "",
  display_order: 0,
  is_current: true,
  biography: "",
};

export function CommitteeClient({ data }: CommitteeClientProps) {
  const router = useRouter();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CommitteeMember | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<string>("__all__");

  const [createState, createFormAction, isCreating] = useActionState(createCommitteeMember, {});
  const [updateState, updateFormAction, isUpdating] = useActionState(updateCommitteeMember, {});
  const [isDeleting, startDeleteTransition] = useTransition();
  const [, startSubmitTransition] = useTransition();

  const form = useForm<FormData>({
    resolver: zodResolver(committeeMemberSchema) as never,
    defaultValues,
  });

  useEffect(() => {
    if (createState.success) {
      toast.success("Committee member added");
      router.refresh();
      setDialogOpen(false);
      form.reset(defaultValues);
    } else if (createState.error) {
      toast.error(createState.error);
    }
  }, [createState, router, form]);

  useEffect(() => {
    if (updateState.success) {
      toast.success("Committee member updated");
      router.refresh();
      setDialogOpen(false);
      setEditingItem(null);
      form.reset(defaultValues);
    } else if (updateState.error) {
      toast.error(updateState.error);
    }
  }, [updateState, router, form]);

  const openCreate = () => {
    setEditingItem(null);
    form.reset(defaultValues);
    setDialogOpen(true);
  };

  const openEdit = (item: CommitteeMember) => {
    setEditingItem(item);
    form.reset({
      name: item.name,
      designation: item.designation,
      phone: item.phone ?? "",
      email: item.email ?? "",
      committee_period: item.committee_period ?? "",
      start_date: item.start_date ?? "",
      end_date: item.end_date ?? "",
      display_order: item.display_order ?? 0,
      is_current: item.is_current,
      biography: item.biography ?? "",
    });
    setDialogOpen(true);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    startDeleteTransition(async () => {
      const fd = new FormData();
      fd.set("id", deleteId);
      const result = await deleteCommitteeMember(fd);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Committee member removed");
        router.refresh();
        setDeleteId(null);
      }
    });
  };

  const onSubmit = form.handleSubmit((data) => {
    const fd = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === "is_current") {
        fd.set("is_current", value ? "on" : "off");
      } else if (value !== null && value !== undefined) {
        fd.set(key, String(value));
      }
    });
    startSubmitTransition(() => {
      if (editingItem) {
        fd.set("id", editingItem.id);
        updateFormAction(fd);
      } else {
        createFormAction(fd);
      }
    });
  });

  const filtered = data.filter((item) => {
    if (currentFilter === "__all__") return true;
    return String(item.is_current) === currentFilter;
  });

  const columns: Column<CommitteeMember>[] = [
    { key: "display_order", header: "#", cell: (row) => (
      <span className="text-muted-foreground">{row.display_order}</span>
    ), className: "w-12" },
    { key: "name", header: "Name", cell: (row) => (
      <div>
        <p className="font-medium">{row.name}</p>
        {row.phone && <p className="text-xs text-muted-foreground">{row.phone}</p>}
      </div>
    )},
    { key: "designation", header: "Designation", cell: (row) => row.designation },
    { key: "committee_period", header: "Period", cell: (row) => row.committee_period || "—" },
    { key: "is_current", header: "Status", cell: (row) => (
      <StatusBadge
        status={String(row.is_current)}
        statuses={isCurrentStatuses}
      />
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
      <PageHeader title="Committee" description="Manage committee members">
        <Button size="sm" onClick={openCreate}>Add Member</Button>
      </PageHeader>

      <FilterBar
        search=""
        onSearchChange={() => {}}
        filters={[
          {
            key: "current",
            label: "Status",
            value: currentFilter,
            onChange: setCurrentFilter,
            options: [
              { value: "true", label: "Current" },
              { value: "false", label: "Past" },
            ],
          },
        ]}
      />

      <AdminTableWrapper empty={filtered.length === 0} emptyTitle="No committee members">
        <DataTable columns={columns} data={filtered} />
      </AdminTableWrapper>

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingItem ? "Edit Committee Member" : "Add Committee Member"}
        footer={
          <div className="flex w-full gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <FormSubmitButton loading={isCreating || isUpdating} form="committee-form">
              {editingItem ? "Update" : "Create"}
            </FormSubmitButton>
          </div>
        }
      >
        <form id="committee-form" onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Name"
              name="name"
              required
              register={form.register("name")}
              error={form.formState.errors.name?.message}
            />
            <FormSelect
              label="Designation"
              name="designation"
              required
              value={form.watch("designation")}
              onValueChange={(v) => form.setValue("designation", v)}
              options={COMMITTEE_DESIGNATIONS.map((d) => ({ value: d, label: d }))}
              error={form.formState.errors.designation?.message}
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
            label="Committee Period"
            name="committee_period"
            placeholder="e.g. 2024-2026"
            register={form.register("committee_period")}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Start Date"
              name="start_date"
              type="date"
              register={form.register("start_date")}
            />
            <FormInput
              label="End Date"
              name="end_date"
              type="date"
              register={form.register("end_date")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Display Order"
              name="display_order"
              type="number"
              register={form.register("display_order", { valueAsNumber: true })}
            />
            <div className="space-y-2">
              <Label>Current Member</Label>
              <div className="pt-1">
                <Switch
                  checked={form.watch("is_current")}
                  onCheckedChange={(checked) => form.setValue("is_current", checked)}
                />
              </div>
            </div>
          </div>
          <FormTextarea
            label="Biography"
            name="biography"
            register={form.register("biography")}
          />
        </form>
      </FormDialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        onConfirm={handleDelete}
        title="Remove Committee Member"
        description="Are you sure you want to remove this committee member?"
        confirmText="Remove"
        loading={isDeleting}
      />
    </div>
  );
}
