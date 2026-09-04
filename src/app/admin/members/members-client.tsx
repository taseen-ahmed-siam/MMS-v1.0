"use client";

import { useActionState, useEffect, useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { memberSchema } from "@/lib/validations";
import { createMember, updateMember, deleteMember } from "@/lib/actions/admin";
import { MEMBER_STATUSES, MEMBERSHIP_TYPES } from "@/constants";
import { formatDate } from "@/lib/utils/format";
import type { Member } from "@/types/database";
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

type FormData = z.infer<typeof memberSchema>;

interface MembersClientProps {
  data: Member[];
  total: number;
  page: number;
  totalPages: number;
  filters: { search: string; status?: string; membershipType?: string };
}

const defaultValues: FormData = {
  full_name: "",
  phone: "",
  membership_type: "regular",
  status: "active",
  father_name: "",
  email: "",
  address: "",
  occupation: "",
  blood_group: "",
  emergency_contact: "",
  date_joined: "",
  notes: "",
};

export function MembersClient({
  data,
  total,
  page,
  totalPages,
  filters,
}: MembersClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Member | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [createState, createFormAction, isCreating] = useActionState(createMember, {});
  const [updateState, updateFormAction, isUpdating] = useActionState(updateMember, {});
  const [isDeleting, startDeleteTransition] = useTransition();
  const [, startSubmitTransition] = useTransition();

  const form = useForm<FormData>({
    resolver: zodResolver(memberSchema),
    defaultValues,
  });

  useEffect(() => {
    if (createState.success) {
      toast.success("Member created successfully");
      router.refresh();
      setDialogOpen(false);
      form.reset(defaultValues);
    } else if (createState.error) {
      toast.error(createState.error);
    }
  }, [createState, router, form]);

  useEffect(() => {
    if (updateState.success) {
      toast.success("Member updated successfully");
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

  const openEdit = (item: Member) => {
    setEditingItem(item);
    form.reset({
      full_name: item.full_name,
      phone: item.phone,
      membership_type: item.membership_type,
      status: item.status,
      father_name: item.father_name ?? "",
      email: item.email ?? "",
      address: item.address ?? "",
      occupation: item.occupation ?? "",
      blood_group: item.blood_group ?? "",
      emergency_contact: item.emergency_contact ?? "",
      date_joined: item.date_joined ?? "",
      notes: item.notes ?? "",
    });
    setDialogOpen(true);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    startDeleteTransition(async () => {
      const fd = new FormData();
      fd.set("id", deleteId);
      const result = await deleteMember(fd);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Member deleted");
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
    startSubmitTransition(() => {
      if (editingItem) {
        fd.set("id", editingItem.id);
        updateFormAction(fd);
      } else {
        createFormAction(fd);
      }
    });
  });

  const columns: Column<Member>[] = [
    { key: "member_id", header: "ID", cell: (row) => (
      <span className="text-muted-foreground">{row.member_id}</span>
    )},
    { key: "full_name", header: "Name", cell: (row) => (
      <div>
        <p className="font-medium">{row.full_name}</p>
        {row.email && <p className="text-xs text-muted-foreground">{row.email}</p>}
      </div>
    )},
    { key: "phone", header: "Phone", cell: (row) => row.phone },
    { key: "membership_type", header: "Type", cell: (row) => (
      <span className="capitalize">{row.membership_type}</span>
    )},
    { key: "status", header: "Status", cell: (row) => (
      <StatusBadge status={row.status} statuses={[...MEMBER_STATUSES]} />
    )},
    { key: "date_joined", header: "Joined", cell: (row) => (
      <span className="text-sm text-muted-foreground">{formatDate(row.date_joined)}</span>
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
      <PageHeader title="Members" description="Manage mosque members">
        <Button size="sm" onClick={openCreate}>Add Member</Button>
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
            options: MEMBER_STATUSES.map((s) => ({ value: s.value, label: s.label })),
          },
          {
            key: "membershipType",
            label: "Type",
            value: filters.membershipType ?? "__all__",
            onChange: (v) => updateParam("membershipType", v),
            options: MEMBERSHIP_TYPES.map((t) => ({ value: t.value, label: t.label })),
          },
        ]}
      />

      <AdminTableWrapper empty={data.length === 0} emptyTitle="No members" emptyDescription="No members found.">
        <DataTable columns={columns} data={data} />
      </AdminTableWrapper>

      <PaginationBar page={page} totalPages={totalPages} total={total} onPageChange={handlePageChange} />

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingItem ? "Edit Member" : "Add Member"}
        footer={
          <div className="flex w-full gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <FormSubmitButton loading={isCreating || isUpdating} form="member-form">
              {editingItem ? "Update" : "Create"}
            </FormSubmitButton>
          </div>
        }
      >
        <form id="member-form" onSubmit={onSubmit} className="space-y-4">
          <FormInput
            label="Full Name"
            name="full_name"
            required
            register={form.register("full_name")}
            error={form.formState.errors.full_name?.message}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Phone"
              name="phone"
              required
              register={form.register("phone")}
              error={form.formState.errors.phone?.message}
            />
            <FormInput
              label="Email"
              name="email"
              type="email"
              register={form.register("email")}
              error={form.formState.errors.email?.message}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              label="Membership Type"
              name="membership_type"
              value={form.watch("membership_type")}
              onValueChange={(v) => form.setValue("membership_type", v as FormData["membership_type"])}
              options={MEMBERSHIP_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              error={form.formState.errors.membership_type?.message}
            />
            <FormSelect
              label="Status"
              name="status"
              value={form.watch("status")}
              onValueChange={(v) => form.setValue("status", v as FormData["status"])}
              options={MEMBER_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
              error={form.formState.errors.status?.message}
            />
          </div>
          <FormInput
            label="Father's Name"
            name="father_name"
            register={form.register("father_name")}
          />
          <FormInput
            label="Address"
            name="address"
            register={form.register("address")}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Occupation"
              name="occupation"
              register={form.register("occupation")}
            />
            <FormInput
              label="Blood Group"
              name="blood_group"
              register={form.register("blood_group")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Emergency Contact"
              name="emergency_contact"
              register={form.register("emergency_contact")}
            />
            <FormInput
              label="Date Joined"
              name="date_joined"
              type="date"
              register={form.register("date_joined")}
            />
          </div>
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
        title="Delete Member"
        description="This action cannot be undone. The member will be permanently removed."
        confirmText="Delete"
        loading={isDeleting}
      />
    </div>
  );
}
