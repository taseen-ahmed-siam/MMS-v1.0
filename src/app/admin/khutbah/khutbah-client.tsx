"use client";

import { useActionState, useEffect, useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { z } from "zod";
import { khutbahSchema } from "@/lib/validations";
import { createKhutbah, updateKhutbah, deleteKhutbah } from "@/lib/actions/admin";
import { KHUTBAH_STATUSES } from "./constants";
import { formatDate } from "@/lib/utils/format";
import type { Khutbah } from "@/types/database";
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

type FormData = z.infer<typeof khutbahSchema>;

interface KhutbahClientProps {
  data: Khutbah[];
  total: number;
  page: number;
  totalPages: number;
  filters: { search: string; status?: string };
}

const defaultValues: FormData = {
  title: "",
  speaker: "",
  date: "",
  description: "",
  article: "",
  status: "draft",
};

export function KhutbahClient({ data, total, page, totalPages, filters }: KhutbahClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Khutbah | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [createState, createFormAction, isCreating] = useActionState(createKhutbah, {});
  const [updateState, updateFormAction, isUpdating] = useActionState(updateKhutbah, {});
  const [isDeleting, startDeleteTransition] = useTransition();

  const form = useForm<FormData>({
    resolver: zodResolver(khutbahSchema),
    defaultValues,
  });

  useEffect(() => {
    if (createState.success) {
      toast.success("Khutbah created successfully");
      router.refresh();
      setDialogOpen(false);
      form.reset(defaultValues);
    } else if (createState.error) {
      toast.error(createState.error);
    }
  }, [createState, router, form]);

  useEffect(() => {
    if (updateState.success) {
      toast.success("Khutbah updated successfully");
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

  const openEdit = (item: Khutbah) => {
    setEditingItem(item);
    form.reset({
      title: item.title,
      speaker: item.speaker,
      date: item.date ?? "",
      description: item.description ?? "",
      article: item.article ?? "",
      status: item.status,
    });
    setDialogOpen(true);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    startDeleteTransition(async () => {
      const fd = new FormData();
      fd.set("id", deleteId);
      const result = await deleteKhutbah(fd);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Khutbah deleted");
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

  const columns: Column<Khutbah>[] = [
    { key: "title", header: "Title", cell: (row) => (
      <div>
        <p className="font-medium">{row.title}</p>
        {row.description && (
          <p className="max-w-xs truncate text-xs text-muted-foreground">{row.description}</p>
        )}
      </div>
    )},
    { key: "speaker", header: "Speaker", cell: (row) => (
      <span>{row.speaker}</span>
    )},
    { key: "date", header: "Date", cell: (row) => (
      <span className="text-sm text-muted-foreground">{formatDate(row.date)}</span>
    )},
    { key: "status", header: "Status", cell: (row) => (
      <StatusBadge status={row.status} statuses={[...KHUTBAH_STATUSES]} />
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
      <PageHeader title="Khutbah" description="Manage Friday khutbah records">
        <Button size="sm" onClick={openCreate}>Add Khutbah</Button>
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
            options: KHUTBAH_STATUSES.map((s) => ({ value: s.value, label: s.label })),
          },
        ]}
      />

      <AdminTableWrapper empty={data.length === 0} emptyTitle="No khutbahs" emptyDescription="No khutbah records found.">
        <DataTable columns={columns} data={data} />
      </AdminTableWrapper>

      <PaginationBar page={page} totalPages={totalPages} total={total} onPageChange={handlePageChange} />

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingItem ? "Edit Khutbah" : "Add Khutbah"}
        className="sm:max-w-2xl"
        footer={
          <div className="flex w-full gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <FormSubmitButton loading={isCreating || isUpdating}>
              {editingItem ? "Update" : "Create"}
            </FormSubmitButton>
          </div>
        }
      >
        <form id="khutbah-form" onSubmit={onSubmit} className="space-y-4">
          <FormInput
            label="Title"
            name="title"
            required
            register={form.register("title")}
            error={form.formState.errors.title?.message}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Speaker"
              name="speaker"
              required
              register={form.register("speaker")}
              error={form.formState.errors.speaker?.message}
            />
            <FormInput
              label="Date"
              name="date"
              type="date"
              register={form.register("date")}
            />
          </div>
          <FormSelect
            label="Status"
            name="status"
            required
            value={form.watch("status")}
            onValueChange={(v) => form.setValue("status", v as FormData["status"])}
            options={KHUTBAH_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
            error={form.formState.errors.status?.message}
          />
          <FormTextarea
            label="Description"
            name="description"
            register={form.register("description")}
          />
          <FormTextarea
            label="Article"
            name="article"
            rows={10}
            register={form.register("article")}
          />
        </form>
      </FormDialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        onConfirm={handleDelete}
        title="Delete Khutbah"
        description="This action cannot be undone. The khutbah will be permanently removed."
        confirmText="Delete"
        loading={isDeleting}
      />
    </div>
  );
}
