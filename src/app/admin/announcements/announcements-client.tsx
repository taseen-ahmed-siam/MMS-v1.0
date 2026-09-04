"use client";

import { useActionState, useEffect, useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { z } from "zod";
import { announcementSchema } from "@/lib/validations";
import { createAnnouncement, updateAnnouncement, deleteAnnouncement } from "@/lib/actions/admin";
import { ANNOUNCEMENT_PRIORITIES } from "@/constants";
import { formatDate } from "@/lib/utils/format";
import { ANNOUNCEMENT_STATUSES } from "./constants";
import type { Announcement } from "@/types/database";
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

type FormData = z.infer<typeof announcementSchema>;

interface AnnouncementsClientProps {
  data: Announcement[];
  total: number;
  page: number;
  totalPages: number;
  filters: { search: string; status?: string; priority?: string };
}

const defaultValues: FormData = {
  title: "",
  description: "",
  priority: "normal",
  start_date: "",
  end_date: "",
  status: "draft",
};

export function AnnouncementsClient({
  data,
  total,
  page,
  totalPages,
  filters,
}: AnnouncementsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [createState, createFormAction, isCreating] = useActionState(createAnnouncement, {});
  const [updateState, updateFormAction, isUpdating] = useActionState(updateAnnouncement, {});
  const [isDeleting, startDeleteTransition] = useTransition();

  const form = useForm<FormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues,
  });

  useEffect(() => {
    if (createState.success) {
      toast.success("Announcement created successfully");
      router.refresh();
      setDialogOpen(false);
      form.reset(defaultValues);
    } else if (createState.error) {
      toast.error(createState.error);
    }
  }, [createState, router, form]);

  useEffect(() => {
    if (updateState.success) {
      toast.success("Announcement updated successfully");
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

  const openEdit = (item: Announcement) => {
    setEditingItem(item);
    form.reset({
      title: item.title,
      description: item.description,
      priority: item.priority,
      start_date: item.start_date ?? "",
      end_date: item.end_date ?? "",
      status: item.status,
    });
    setDialogOpen(true);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    startDeleteTransition(async () => {
      const fd = new FormData();
      fd.set("id", deleteId);
      const result = await deleteAnnouncement(fd);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Announcement deleted");
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

  const columns: Column<Announcement>[] = [
    { key: "title", header: "Title", cell: (row) => (
      <div>
        <p className="font-medium">{row.title}</p>
        {row.description && (
          <p className="max-w-xs truncate text-xs text-muted-foreground">{row.description}</p>
        )}
      </div>
    )},
    { key: "priority", header: "Priority", cell: (row) => (
      <StatusBadge status={row.priority} statuses={[...ANNOUNCEMENT_PRIORITIES]} />
    )},
    { key: "status", header: "Status", cell: (row) => (
      <StatusBadge status={row.status} statuses={[...ANNOUNCEMENT_STATUSES]} />
    )},
    { key: "start_date", header: "Start", cell: (row) => (
      <span className="text-sm text-muted-foreground">{formatDate(row.start_date)}</span>
    )},
    { key: "end_date", header: "End", cell: (row) => (
      <span className="text-sm text-muted-foreground">{formatDate(row.end_date ?? "")}</span>
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
      <PageHeader title="Announcements" description="Manage mosque announcements">
        <Button size="sm" onClick={openCreate}>Add Announcement</Button>
      </PageHeader>

      <FilterBar
        search={filters.search}
        onSearchChange={(v) => updateParam("search", v)}
        filters={[
          {
            key: "priority",
            label: "Priority",
            value: filters.priority ?? "__all__",
            onChange: (v) => updateParam("priority", v),
            options: ANNOUNCEMENT_PRIORITIES.map((p) => ({ value: p.value, label: p.label })),
          },
          {
            key: "status",
            label: "Status",
            value: filters.status ?? "__all__",
            onChange: (v) => updateParam("status", v),
            options: ANNOUNCEMENT_STATUSES.map((s) => ({ value: s.value, label: s.label })),
          },
        ]}
      />

      <AdminTableWrapper empty={data.length === 0} emptyTitle="No announcements" emptyDescription="No announcements found.">
        <DataTable columns={columns} data={data} />
      </AdminTableWrapper>

      <PaginationBar page={page} totalPages={totalPages} total={total} onPageChange={handlePageChange} />

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingItem ? "Edit Announcement" : "Add Announcement"}
        footer={
          <div className="flex w-full gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <FormSubmitButton loading={isCreating || isUpdating} form="announcement-form">
              {editingItem ? "Update" : "Create"}
            </FormSubmitButton>
          </div>
        }
      >
        <form id="announcement-form" onSubmit={onSubmit} className="space-y-4">
          <FormInput
            label="Title"
            name="title"
            required
            register={form.register("title")}
            error={form.formState.errors.title?.message}
          />
          <FormTextarea
            label="Description"
            name="description"
            required
            register={form.register("description")}
            error={form.formState.errors.description?.message}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              label="Priority"
              name="priority"
              required
              value={form.watch("priority")}
              onValueChange={(v) => form.setValue("priority", v as FormData["priority"])}
              options={ANNOUNCEMENT_PRIORITIES.map((p) => ({ value: p.value, label: p.label }))}
              error={form.formState.errors.priority?.message}
            />
            <FormSelect
              label="Status"
              name="status"
              required
              value={form.watch("status")}
              onValueChange={(v) => form.setValue("status", v as FormData["status"])}
              options={ANNOUNCEMENT_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
              error={form.formState.errors.status?.message}
            />
          </div>
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
        </form>
      </FormDialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        onConfirm={handleDelete}
        title="Delete Announcement"
        description="This action cannot be undone. The announcement will be permanently removed."
        confirmText="Delete"
        loading={isDeleting}
      />
    </div>
  );
}
