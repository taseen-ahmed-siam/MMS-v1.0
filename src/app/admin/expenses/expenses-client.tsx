"use client";

import * as React from "react";
import { useActionState, useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Check, Pencil, RotateCcw, Trash2, X } from "lucide-react";
import { z } from "zod";

import type { Expense } from "@/types/database";
import {
  createExpense,
  updateExpense,
  deleteExpense,
  approveExpense,
  rejectExpense,
} from "@/lib/actions/admin";
import { expenseSchema } from "@/lib/validations";
import { EXPENSE_STATUSES, EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@/constants";
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

type ExpenseFormValues = Omit<z.input<typeof expenseSchema>, "payment_method"> & {
  payment_method: string;
};

type ActionResult = { error?: string; success?: boolean; id?: string };

const initialState: ActionResult = {};

interface ExpensesClientProps {
  expenses: Expense[];
  initialSearch: string;
  initialStatus: string;
  initialCategory: string;
  page: number;
  total: number;
  totalPages: number;
}

export function ExpensesClient({
  expenses,
  initialSearch,
  initialStatus,
  initialCategory,
  page,
  total,
  totalPages,
}: ExpensesClientProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [category, setCategory] = useState(initialCategory);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [rejecting, setRejecting] = useState<Expense | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectPending, setRejectPending] = useState(false);

  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (category) params.set("category", category);
    const qs = params.toString();
    router.push(qs ? `?${qs}` : "?");
  }, [search, status, category, router]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (e: Expense) => {
    setEditing(e);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletePending(true);
    const fd = new FormData();
    fd.set("id", deleting.id);
    const res = await deleteExpense(fd);
    setDeletePending(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Expense archived");
      setDeleting(null);
      router.refresh();
    }
  };

  const handleApprove = async (exp: Expense) => {
    const fd = new FormData();
    fd.set("id", exp.id);
    const res = await approveExpense(fd);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Expense approved");
      router.refresh();
    }
  };

  const handleReject = async () => {
    if (!rejecting) return;
    setRejectPending(true);
    const fd = new FormData();
    fd.set("id", rejecting.id);
    fd.set("reason", rejectReason);
    const res = await rejectExpense(fd);
    setRejectPending(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Expense rejected");
      setRejecting(null);
      setRejectReason("");
      router.refresh();
    }
  };

  const columns = [
    {
      key: "category",
      header: "Category",
      cell: (e: Expense) => (
        <div>
          <p className="font-medium capitalize">{e.expense_category || "-"}</p>
          {e.voucher_number && (
            <p className="text-xs text-muted-foreground">{e.voucher_number}</p>
          )}
        </div>
      ),
    },
    {
      key: "vendor",
      header: "Vendor",
      cell: (e: Expense) => <span>{e.vendor || "-"}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      cell: (e: Expense) => <span className="font-medium">{formatCurrency(Number(e.amount) || 0)}</span>,
    },
    {
      key: "method",
      header: "Method",
      cell: (e: Expense) => (
        <span className="capitalize">{e.payment_method?.replace("_", " ") || "-"}</span>
      ),
    },
    {
      key: "date",
      header: "Date",
      cell: (e: Expense) => <span>{e.date ? formatDate(e.date) : "-"}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (e: Expense) => (
        <StatusBadge status={e.status} statuses={[...EXPENSE_STATUSES]} />
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (e: Expense) => (
        <div className="flex items-center justify-end gap-1">
          {e.status === "pending" && (
            <>
              <button
                onClick={(ev) => {
                  ev.stopPropagation();
                  handleApprove(e);
                }}
                className="rounded-md p-1.5 text-green-600 hover:bg-green-50"
                aria-label="Approve"
                title="Approve"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={(ev) => {
                  ev.stopPropagation();
                  setRejecting(e);
                }}
                className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
                aria-label="Reject"
                title="Reject"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
          <button
            onClick={(ev) => {
              ev.stopPropagation();
              openEdit(e);
            }}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={(ev) => {
              ev.stopPropagation();
              setDeleting(e);
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
      <PageHeader title="Expenses" description="Track all mosque expenses and approvals.">
        <PageActions onNew={openCreate} newLabel="Add Expense" />
      </PageHeader>

      <AdminTableWrapper
        title="All Expenses"
        description={`${total} expenses found`}
        empty={expenses.length === 0}
        emptyTitle="No expenses"
        emptyDescription="No expenses match your current filters."
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
                options: EXPENSE_STATUSES.map((s) => ({ value: s.value, label: s.label })),
              },
              {
                key: "category",
                label: "Category",
                value: category || "__all__",
                onChange: (v) => setCategory(v === "__all__" ? "" : v),
                options: EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c })),
              },
            ]}
          />
        </div>
        <DataTable data={expenses} columns={columns} />
        <div className="px-4 pb-4">
          <PaginationBar
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={(p) => router.push(`?page=${p}`)}
          />
        </div>
      </AdminTableWrapper>

      <ExpenseFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Archive expense"
        description={`Are you sure you want to archive this expense record? This action cannot be undone.`}
        confirmText="Archive"
        loading={deletePending}
        onConfirm={handleDelete}
      />

      <FormDialog
        open={!!rejecting}
        onOpenChange={(o) => {
          if (!o) {
            setRejecting(null);
            setRejectReason("");
          }
        }}
        title="Reject expense"
        description="Provide a reason for rejecting this expense."
      >
        <div className="space-y-4">
          <FormTextarea
            label="Rejection reason"
            name="reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRejecting(null)}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              <RotateCcw className="h-4 w-4" />
              Cancel
            </button>
            <FormSubmitButton loading={rejectPending} onClick={handleReject}>
              Reject Expense
            </FormSubmitButton>
          </div>
        </div>
      </FormDialog>
    </div>
  );
}

function ExpenseFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Expense | null;
}) {
  const [categoryValue, setCategoryValue] = useState("");
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  const editingRef = useRef(editing);
  editingRef.current = editing;

  const action = editing ? updateExpense : createExpense;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [, startSubmitTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema) as never,
    defaultValues: {
      expense_category: "",
      vendor: "",
      amount: undefined,
      payment_method: "",
      date: new Date().toISOString().split("T")[0],
      voucher_number: "",
      description: "",
      status: "pending",
    },
  });

  const watchPayment = watch("payment_method") as string;

  useEffect(() => {
    if (open) {
      reset({
        expense_category: editing?.expense_category || "",
        vendor: editing?.vendor || "",
        amount: editing?.amount != null ? Number(editing.amount) : undefined,
        payment_method: editing?.payment_method || "",
        date: editing?.date || new Date().toISOString().split("T")[0],
        voucher_number: editing?.voucher_number || "",
        description: editing?.description || "",
        status: editing?.status || "pending",
      });
      setCategoryValue(editing?.expense_category || "");
    }
  }, [open, editing, reset]);

  useEffect(() => {
    if (state.success) {
      toast.success(editingRef.current ? "Expense updated" : "Expense added");
      onOpenChangeRef.current(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  const onSubmit = (values: ExpenseFormValues) => {
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
      title={editing ? "Edit Expense" : "Add Expense"}
      description={editing ? "Update the expense details below." : "Record a new expense entry."}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={state.error} />
        <FormSelect
          label="Category"
          name="expense_category"
          value={categoryValue}
          onValueChange={(v) => {
            setCategoryValue(v);
            setValue("expense_category", v);
          }}
          options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="Vendor" name="vendor" register={register("vendor")} />
          <FormInput
            label="Voucher number"
            name="voucher_number"
            register={register("voucher_number")}
          />
        </div>
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
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="Date" name="date" type="date" register={register("date")} error={errors.date?.message} required />
          <FormInput label="Description" name="description" register={register("description")} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <FormSubmitButton loading={pending}>
            {editing ? "Save Changes" : "Add Expense"}
          </FormSubmitButton>
        </div>
      </form>
    </FormDialog>
  );
}
