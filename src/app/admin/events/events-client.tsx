"use client";

import { useActionState, useEffect, useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { z } from "zod";
import { eventSchema } from "@/lib/validations";
import { createEvent, updateEvent, deleteEvent } from "@/lib/actions/admin";
import { EVENT_TYPES, EVENT_STATUSES } from "@/constants";
import { formatDate } from "@/lib/utils/format";
import type { Event } from "@/types/database";
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

type FormData = z.input<typeof eventSchema>;

interface EventsClientProps {
  data: Event[];
  total: number;
  page: number;
  totalPages: number;
  filters: { search: string; status?: string; event_type?: string };
}

const defaultValues: FormData = {
  title: "",
  description: "",
  event_type: "",
  start_date: "",
  end_date: "",
  start_time: "",
  end_time: "",
  venue: "",
  speaker: "",
  capacity: null,
  registration_enabled: false,
  status: "draft",
  featured: false,
};

export function EventsClient({ data, total, page, totalPages, filters }: EventsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Event | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [createState, createFormAction, isCreating] = useActionState(createEvent, {});
  const [updateState, updateFormAction, isUpdating] = useActionState(updateEvent, {});
  const [isDeleting, startDeleteTransition] = useTransition();
  const [, startSubmitTransition] = useTransition();

  const form = useForm<FormData>({
    resolver: zodResolver(eventSchema),
    defaultValues,
  });

  useEffect(() => {
    if (createState.success) {
      toast.success("Event created successfully");
      router.refresh();
      setDialogOpen(false);
      form.reset(defaultValues);
    } else if (createState.error) {
      toast.error(createState.error);
    }
  }, [createState, router, form]);

  useEffect(() => {
    if (updateState.success) {
      toast.success("Event updated successfully");
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

  const openEdit = (item: Event) => {
    setEditingItem(item);
    form.reset({
      title: item.title,
      description: item.description ?? "",
      event_type: item.event_type,
      start_date: item.start_date,
      end_date: item.end_date ?? "",
      start_time: item.start_time ?? "",
      end_time: item.end_time ?? "",
      venue: item.venue ?? "",
      speaker: item.speaker ?? "",
      capacity: item.capacity,
      registration_enabled: item.registration_enabled,
      status: item.status,
      featured: item.featured,
    });
    setDialogOpen(true);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    startDeleteTransition(async () => {
      const fd = new FormData();
      fd.set("id", deleteId);
      const result = await deleteEvent(fd);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Event deleted");
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

  const columns: Column<Event>[] = [
    { key: "title", header: "Title", cell: (row) => (
      <div>
        <p className="font-medium">{row.title}</p>
        {row.speaker && <p className="text-xs text-muted-foreground">{row.speaker}</p>}
      </div>
    )},
    { key: "event_type", header: "Type", cell: (row) => (
      <span className="capitalize">{row.event_type}</span>
    )},
    { key: "start_date", header: "Date", cell: (row) => (
      <div>
        <p className="text-sm">{formatDate(row.start_date)}</p>
        {row.start_time && <p className="text-xs text-muted-foreground">{row.start_time}</p>}
      </div>
    )},
    { key: "venue", header: "Venue", cell: (row) => (
      <span className="text-sm text-muted-foreground">{row.venue || "—"}</span>
    )},
    { key: "status", header: "Status", cell: (row) => (
      <StatusBadge status={row.status} statuses={[...EVENT_STATUSES]} />
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
      <PageHeader title="Events" description="Manage mosque events">
        <Button size="sm" onClick={openCreate}>Add Event</Button>
      </PageHeader>

      <FilterBar
        search={filters.search}
        onSearchChange={(v) => updateParam("search", v)}
        filters={[
          {
            key: "event_type",
            label: "Type",
            value: filters.event_type ?? "__all__",
            onChange: (v) => updateParam("event_type", v),
            options: EVENT_TYPES.map((t) => ({ value: t, label: t })),
          },
          {
            key: "status",
            label: "Status",
            value: filters.status ?? "__all__",
            onChange: (v) => updateParam("status", v),
            options: EVENT_STATUSES.map((s) => ({ value: s.value, label: s.label })),
          },
        ]}
      />

      <AdminTableWrapper empty={data.length === 0} emptyTitle="No events" emptyDescription="No events found.">
        <DataTable columns={columns} data={data} />
      </AdminTableWrapper>

      <PaginationBar page={page} totalPages={totalPages} total={total} onPageChange={handlePageChange} />

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingItem ? "Edit Event" : "Add Event"}
        footer={
          <div className="flex w-full gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <FormSubmitButton loading={isCreating || isUpdating} form="event-form">
              {editingItem ? "Update" : "Create"}
            </FormSubmitButton>
          </div>
        }
      >
        <form id="event-form" onSubmit={onSubmit} className="space-y-4">
          <FormInput
            label="Title"
            name="title"
            required
            register={form.register("title")}
            error={form.formState.errors.title?.message}
          />
          <FormSelect
            label="Event Type"
            name="event_type"
            required
            value={form.watch("event_type")}
            onValueChange={(v) => form.setValue("event_type", v)}
            options={EVENT_TYPES.map((t) => ({ value: t, label: t }))}
            error={form.formState.errors.event_type?.message}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Start Date"
              name="start_date"
              type="date"
              required
              register={form.register("start_date")}
              error={form.formState.errors.start_date?.message}
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
              label="Start Time"
              name="start_time"
              type="time"
              register={form.register("start_time")}
            />
            <FormInput
              label="End Time"
              name="end_time"
              type="time"
              register={form.register("end_time")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Venue"
              name="venue"
              register={form.register("venue")}
            />
            <FormInput
              label="Speaker"
              name="speaker"
              register={form.register("speaker")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Capacity"
              name="capacity"
              type="number"
              register={form.register("capacity", { valueAsNumber: true })}
              error={form.formState.errors.capacity?.message}
            />
            <FormSelect
              label="Status"
              name="status"
              required
              value={form.watch("status")}
              onValueChange={(v) => form.setValue("status", v as FormData["status"])}
              options={EVENT_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
              error={form.formState.errors.status?.message}
            />
          </div>
          <FormTextarea
            label="Description"
            name="description"
            register={form.register("description")}
          />
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded accent-primary"
                checked={form.watch("featured")}
                onChange={(e) => form.setValue("featured", e.target.checked)}
              />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded accent-primary"
                checked={form.watch("registration_enabled")}
                onChange={(e) => form.setValue("registration_enabled", e.target.checked)}
              />
              Registration enabled
            </label>
          </div>
        </form>
      </FormDialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        onConfirm={handleDelete}
        title="Delete Event"
        description="This action cannot be undone. The event will be permanently removed."
        confirmText="Delete"
        loading={isDeleting}
      />
    </div>
  );
}
