"use client";

import * as React from "react";
import { useActionState, useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { z } from "zod";

import type { Income } from "@/types/database";
import { createIncome, updateIncome, deleteIncome } from "@/lib/actions/admin";
import { incomeSchema } from "@/lib/validations";
import { INCOME_CATEGORIES, PAYMENT_METHODS } from "@/constants";
import { formatCurrency, formatDate } from "@/lib/utils/format";
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

type IncomeFormValues = Omit<z.input<typeof incomeSchema>, "payment_method"> & {
  payment_method: string;
};

type ActionResult = { error?: string; success?: boolean; id?: string };

const initialState: ActionResult = {};

interface IncomeClientProps {
  incomes: Income[];
  initialSearch: string;
  initialCategory: string;
  page: number;
  total: number;
  totalPages: number;
}

export function IncomeClient({
  incomes,
  initialSearch,
  initialCategory,
  page,
  total,
  totalPages,
}: IncomeClientProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Income | null>(null);
  const [deleting, setDeleting] = useState<Income | null>(null);
  const [deletePending, setDeletePending] = useState(false);

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

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (i: Income) => {
    setEditing(i);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletePending(true);
    const fd = new FormData();
    fd.set("id", deleting.id);
    const res = await deleteIncome(fd);
    setDeletePending(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Income archived");
      setDeleting(null);
      router.refresh();
    }
  };

  const columns = [
    {
      key: "source",
      header: "Source",
      cell: (i: Income) => (
        <div>
          <p className="font-medium">{i.source || "-"}</p>
          {i.reference_number && (
            <p className="text-xs text-muted-foreground">{i.reference_number}</p>
          )}
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (i: Income) => <span className="capitalize">{i.income_category || "-"}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      cell: (i: Income) => <span className="font-medium">{formatCurrency(Number(i.amount) || 0)}</span>,
    },
    {
      key: "method",
      header: "Method",
      cell: (i: Income) => (
        <span className="capitalize">{i.payment_method?.replace("_", " ") || "-"}</span>
      ),
    },
    {
      key: "date",
      header: "Date",
      cell: (i: Income) => <span>{i.date ? formatDate(i.date) : "-"}</span>,
    },
    {
      key: "actions",
      header: "",
      cell: (i: Income) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(i);
            }}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleting(i);
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
      <PageHeader title="Income" description="Record all sources of income for the mosque.">
        <PageActions onNew={openCreate} newLabel="Add Income" />
      </PageHeader>

      <AdminTableWrapper
        title="All Income"
        description={`${total} income records found`}
        empty={incomes.length === 0}
        emptyTitle="No income"
        emptyDescription="No income records match your current filters."
      >
        <div className="px-4 pb-4 pt-4">
          <FilterBar
            search={searchInput}
            onSearchChange={setSearchInput}
            filters={[
              {
                key: "category",
                label: "Category",
                value: category || "__all__",
                onChange: (v) => setCategory(v === "__all__" ? "" : v),
                options: INCOME_CATEGORIES.map((c) => ({ value: c, label: c })),
              },
            ]}
          />
        </div>
        <DataTable data={incomes} columns={columns} />
        <div className="px-4 pb-4">
          <PaginationBar
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={(p) => router.push(`?page=${p}`)}
          />
        </div>
      </AdminTableWrapper>

      <IncomeFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Archive income"
        description={`Are you sure you want to archive this income record? This action cannot be undone.`}
        confirmText="Archive"
        loading={deletePending}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function IncomeFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Income | null;
}) {
  const [categoryValue, setCategoryValue] = useState("");
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  const editingRef = useRef(editing);
  editingRef.current = editing;

  const action = editing ? updateIncome : createIncome;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [, startSubmitTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeSchema) as never,
    defaultValues: {
      income_category: "",
      source: "",
      amount: undefined,
      payment_method: "",
      reference_number: "",
      date: new Date().toISOString().split("T")[0],
      description: "",
    },
  });

  const watchPayment = watch("payment_method") as string;

  useEffect(() => {
    if (open) {
      reset({
        income_category: editing?.income_category || "",
        source: editing?.source || "",
        amount: editing?.amount != null ? Number(editing.amount) : undefined,
        payment_method: editing?.payment_method || "",
        reference_number: editing?.reference_number || "",
        date: editing?.date || new Date().toISOString().split("T")[0],
        description: editing?.description || "",
      });
      setCategoryValue(editing?.income_category || "");
    }
  }, [open, editing, reset]);

  useEffect(() => {
    if (state.success) {
      toast.success(editingRef.current ? "Income updated" : "Income added");
      onOpenChangeRef.current(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  const onSubmit = (values: IncomeFormValues) => {
    const fd = new FormData();
    if (editing) fd.set("id", editing.id);
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") fd.set(k, String(v));
    });
    startSubmitTransition(() => {
      formAction(fd);
    });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Edit Income" : "Add Income"}
      description={editing ? "Update the income details below." : "Record a new income entry."}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={state.error} />
        <FormSelect
          label="Category"
          name="income_category"
          value={categoryValue}
          onValueChange={(v) => {
            setCategoryValue(v);
            setValue("income_category", v);
          }}
          options={INCOME_CATEGORIES.map((c) => ({ value: c, label: c }))}
          required
        />
        <FormInput
          label="Source"
          name="source"
          register={register("source")}
          error={errors.source?.message}
          required
        />
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
            onValueChange={(v) => setValue("payment_method", v)}
            options={[...PAYMENT_METHODS]}
            required
          />
          <input type="hidden" {...register("payment_method")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Reference number"
            name="reference_number"
            register={register("reference_number")}
          />
          <FormInput label="Date" name="date" type="date" register={register("date")} error={errors.date?.message} required />
        </div>
        <FormTextarea
          label="Description"
          name="description"
          register={register("description")}
          rows={2}
        />
        <div className="flex justify-end gap-2 pt-2">
          <FormSubmitButton loading={pending}>
            {editing ? "Save Changes" : "Add Income"}
          </FormSubmitButton>
        </div>
      </form>
    </FormDialog>
  );
}
