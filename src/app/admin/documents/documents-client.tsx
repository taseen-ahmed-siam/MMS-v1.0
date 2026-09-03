"use client";

import * as React from "react";
import { useActionState, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Trash2, FileText, ExternalLink } from "lucide-react";
import { z } from "zod";
import Link from "next/link";

import type { Document } from "@/types/database";
import { createDocument, deleteDocument } from "@/lib/actions/admin";
import { documentSchema } from "@/lib/validations";
import { DOCUMENT_CATEGORIES } from "@/constants";
import { formatDate } from "@/lib/utils/format";
import { DataTable } from "@/components/admin/data-table";
import { PaginationBar } from "@/components/admin/pagination-bar";
import { FilterBar } from "@/components/admin/filter-bar";
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

type DocumentRow = Document & {
  file_size?: string | null;
  file_type?: string | null;
};

interface DocumentsClientProps {
  documents: Document[];
  initialSearch: string;
  initialCategory: string;
  page: number;
  total: number;
  totalPages: number;
}

const ACCESS_LEVELS = [
  { value: "public", label: "Public" },
  { value: "admin", label: "Admin" },
  { value: "restricted", label: "Restricted" },
];

export function DocumentsClient({
  documents,
  initialSearch,
  initialCategory,
  page,
  total,
  totalPages,
}: DocumentsClientProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<Document | null>(null);
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
    if (category) params.set("category", category);
    const qs = params.toString();
    router.push(qs ? `?${qs}` : "?");
  }, [search, category, router]);

  const openCreate = () => {
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletePending(true);
    const fd = new FormData();
    fd.set("id", deleting.id);
    const res = await deleteDocument(fd);
    setDeletePending(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Document deleted");
      setDeleting(null);
      router.refresh();
    }
  };

  const columns = [
    {
      key: "title",
      header: "Title",
      cell: (d: DocumentRow) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium">{d.title}</span>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (d: DocumentRow) => <span className="capitalize">{d.category || "-"}</span>,
    },
    {
      key: "access_level",
      header: "Access",
      cell: (d: DocumentRow) => (
        <span className="capitalize">{d.access_level}</span>
      ),
    },
    {
      key: "file",
      header: "File",
      cell: (d: DocumentRow) =>
        d.file_url ? (
          <Link
            href={d.file_url}
            target="_blank"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            View <ExternalLink className="h-3 w-3" />
          </Link>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "size",
      header: "Size",
      cell: (d: DocumentRow) => (
        <span>{d.file_size || "-"}</span>
      ),
    },
    {
      key: "created_at",
      header: "Uploaded",
      cell: (d: DocumentRow) => <span>{formatDate(d.created_at)}</span>,
    },
    {
      key: "actions",
      header: "",
      cell: (d: DocumentRow) => (
        <div className="flex items-center justify-end gap-1">
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
      <PageHeader
        title="Documents"
        description="Manage mosque documents and records."
      >
        <PageActions onNew={openCreate} newLabel="Add Document" />
      </PageHeader>

      <AdminTableWrapper
        title="All Documents"
        description={`${total} documents found`}
        empty={documents.length === 0}
        emptyTitle="No documents"
        emptyDescription="No documents match your current filters."
      >
        <div className="px-4 pt-4">
          <FilterBar
            search={searchInput}
            onSearchChange={setSearchInput}
            filters={[
              {
                key: "category",
                label: "Category",
                value: category || "__all__",
                onChange: (v) => setCategory(v === "__all__" ? "" : v),
                options: DOCUMENT_CATEGORIES.map((c) => ({ value: c, label: c })),
              },
            ]}
          />
        </div>
        <DataTable data={documents} columns={columns} />
        <div className="px-4 pb-4">
          <PaginationBar
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={(p) => router.push(`?page=${p}`)}
          />
        </div>
      </AdminTableWrapper>

      <DocumentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete document"
        description={`Are you sure you want to delete "${deleting?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deletePending}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function DocumentFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [accessLevel, setAccessLevel] = useState("public");
  const [categoryValue, setCategoryValue] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  const [state, formAction, pending] = useActionState(createDocument, initialState);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof documentSchema>>({
    resolver: zodResolver(documentSchema) as never,
    defaultValues: {
      title: "",
      category: "",
      description: "",
      access_level: "public",
    },
  });

  useEffect(() => {
    if (open) {
      reset({ title: "", category: "", description: "", access_level: "public" });
      setAccessLevel("public");
      setCategoryValue("");
      setFileUrl("");
    }
  }, [open, reset]);

  useEffect(() => {
    if (state.success) {
      toast.success("Document created");
      onOpenChangeRef.current(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  const onSubmit = (values: z.input<typeof documentSchema>) => {
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") fd.set(k, String(v));
    });
    fd.set("access_level", accessLevel);
    fd.set("category", categoryValue);
    fd.set("file_url", fileUrl);
    formAction(fd);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add Document"
      description="Upload new mosque document information."
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
          label="Category"
          name="category"
          value={categoryValue}
          onValueChange={setCategoryValue}
          options={DOCUMENT_CATEGORIES.map((c) => ({ value: c, label: c }))}
          required
        />
        <FormSelect
          label="Access level"
          name="access_level"
          value={accessLevel}
          onValueChange={setAccessLevel}
          options={ACCESS_LEVELS}
        />
        <FormInput
          label="File URL"
          name="file_url"
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
          placeholder="https://..."
        />
        <FormTextarea
          label="Description"
          name="description"
          register={register("description")}
        />
        <div className="flex justify-end gap-2 pt-2">
          <FormSubmitButton loading={pending}>Create Document</FormSubmitButton>
        </div>
      </form>
    </FormDialog>
  );
}
