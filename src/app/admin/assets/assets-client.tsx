"use client";

import * as React from "react";
import { useActionState, useState, useEffect, useMemo, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { z } from "zod";

import type { Asset } from "@/types/database";
import { createAsset, updateAsset, deleteAsset } from "@/lib/actions/admin";
import { assetSchema } from "@/lib/validations";
import { ASSET_CATEGORIES, ASSET_CONDITIONS } from "@/constants";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { DataTable } from "@/components/admin/data-table";
import {
  DesktopTableOnly,
  MobileActionButton,
  MobileRecordCard,
  MobileRecordFooter,
  MobileRecordHead,
  MobileRecordList,
} from "@/components/admin/mobile-record-card";
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

interface AssetClientProps {
  assets: Asset[];
  initialSearch: string;
  initialCategory: string;
  page: number;
  total: number;
  totalPages: number;
}

export function AssetsClient({
  assets,
  initialSearch,
  initialCategory,
  page,
  total,
  totalPages,
}: AssetClientProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [condition, setCondition] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [deleting, setDeleting] = useState<Asset | null>(null);
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

  const filtered = useMemo(() => {
    if (!condition) return assets;
    return assets.filter((a) => a.current_condition === condition);
  }, [assets, condition]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (asset: Asset) => {
    setEditing(asset);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletePending(true);
    const fd = new FormData();
    fd.set("id", deleting.id);
    const res = await deleteAsset(fd);
    setDeletePending(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Asset deleted");
      setDeleting(null);
      router.refresh();
    }
  };

  const columns = [
    {
      key: "name",
      header: "Asset",
      cell: (a: Asset) => (
        <div>
          <p className="font-medium">{a.name}</p>
          <p className="text-xs text-muted-foreground">{a.asset_id}</p>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (a: Asset) => <span className="capitalize">{a.category || "-"}</span>,
    },
    {
      key: "brand",
      header: "Brand",
      cell: (a: Asset) => <span>{a.brand || "-"}</span>,
    },
    {
      key: "quantity",
      header: "Qty",
      cell: (a: Asset) => <span>{a.quantity}</span>,
    },
    {
      key: "purchase_date",
      header: "Purchase Date",
      cell: (a: Asset) => <span>{a.purchase_date ? formatDate(a.purchase_date) : "-"}</span>,
    },
    {
      key: "purchase_cost",
      header: "Cost",
      cell: (a: Asset) => (
        <span className="font-medium">{formatCurrency(Number(a.purchase_cost) || 0)}</span>
      ),
    },
    {
      key: "condition",
      header: "Condition",
      cell: (a: Asset) => (
        <StatusBadge
          status={a.current_condition}
          statuses={[...ASSET_CONDITIONS]}
        />
      ),
    },
    {
      key: "location",
      header: "Location",
      cell: (a: Asset) => <span>{a.location || "-"}</span>,
    },
    {
      key: "actions",
      header: "",
      cell: (a: Asset) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(a);
            }}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleting(a);
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
      <PageHeader title="Assets" description="Manage mosque assets and inventory.">
        <PageActions onNew={openCreate} newLabel="Add Asset" />
      </PageHeader>

      <AdminTableWrapper
        title="All Assets"
        description={`${total} assets found`}
        empty={filtered.length === 0}
        emptyTitle="No assets"
        emptyDescription="No assets match your current filters."
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
                options: ASSET_CATEGORIES.map((c) => ({ value: c, label: c })),
              },
              {
                key: "condition",
                label: "Condition",
                value: condition || "__all__",
                onChange: (v) => setCondition(v === "__all__" ? "" : v),
                options: ASSET_CONDITIONS.map((c) => ({ value: c.value, label: c.label })),
              },
            ]}
          />
        </div>
        <MobileRecordList
          items={filtered}
          getKey={(asset) => asset.id}
          renderCard={(asset) => (
            <MobileRecordCard className="px-3 py-3.5">
              <div className="flex items-start gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold uppercase text-primary">
                  {asset.name
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <MobileRecordHead
                    title={asset.name}
                    subtitle={asset.brand || asset.category}
                    trailing={
                      <StatusBadge
                        status={asset.current_condition}
                        statuses={[...ASSET_CONDITIONS]}
                      />
                    }
                  />
                  <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-border/70 pt-2.5 text-[11px]">
                    <div>
                      <p className="uppercase tracking-wide text-muted-foreground">Asset ID</p>
                      <p className="mt-0.5 truncate font-medium text-foreground">{asset.asset_id}</p>
                    </div>
                    <div>
                      <p className="uppercase tracking-wide text-muted-foreground">Category</p>
                      <p className="mt-0.5 truncate capitalize font-medium text-foreground">{asset.category || "—"}</p>
                    </div>
                    <div>
                      <p className="uppercase tracking-wide text-muted-foreground">Quantity</p>
                      <p className="mt-0.5 font-medium text-foreground">{asset.quantity}</p>
                    </div>
                    <div>
                      <p className="uppercase tracking-wide text-muted-foreground">Location</p>
                      <p className="mt-0.5 truncate font-medium text-foreground">{asset.location || "—"}</p>
                    </div>
                  </div>
                  <MobileRecordFooter
                    meta={asset.purchase_date ? `Purchased ${formatDate(asset.purchase_date)}` : undefined}
                  >
                    <span className="mr-1 text-xs font-semibold text-foreground">
                      {formatCurrency(Number(asset.purchase_cost) || 0)}
                    </span>
                    <MobileActionButton label="Edit" onClick={() => openEdit(asset)}>
                      <Pencil className="h-4 w-4" />
                    </MobileActionButton>
                    <MobileActionButton label="Delete" destructive onClick={() => setDeleting(asset)}>
                      <Trash2 className="h-4 w-4" />
                    </MobileActionButton>
                  </MobileRecordFooter>
                </div>
              </div>
            </MobileRecordCard>
          )}
        />
        <DesktopTableOnly>
          <DataTable data={filtered} columns={columns} />
        </DesktopTableOnly>
        <div className="px-4 pb-4">
          <PaginationBar
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={(p) => router.push(`?page=${p}`)}
          />
        </div>
      </AdminTableWrapper>

      <AssetFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete asset"
        description={`Are you sure you want to delete "${deleting?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deletePending}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function AssetFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Asset | null;
}) {
  const [condition, setCondition] = useState("good");
  const [categoryValue, setCategoryValue] = useState("");
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  const editingRef = useRef(editing);
  editingRef.current = editing;

  const action = editing ? updateAsset : createAsset;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [, startSubmitTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof assetSchema>>({
    resolver: zodResolver(assetSchema) as never,
    defaultValues: {
      name: "",
      category: "",
      brand: "",
      model: "",
      quantity: 1,
      purchase_date: "",
      purchase_cost: undefined,
      current_condition: "good",
      location: "",
      warranty_expiry: "",
      supplier: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: editing?.name || "",
        category: editing?.category || "",
        brand: editing?.brand || "",
        model: editing?.model || "",
        quantity: Number(editing?.quantity) || 1,
        purchase_date: editing?.purchase_date || "",
        purchase_cost: editing?.purchase_cost != null ? Number(editing.purchase_cost) : undefined,
        current_condition: editing?.current_condition || "good",
        location: editing?.location || "",
        warranty_expiry: editing?.warranty_expiry || "",
        supplier: editing?.supplier || "",
        notes: editing?.notes || "",
      });
      setCondition(editing?.current_condition || "good");
      setCategoryValue(editing?.category || "");
    }
  }, [open, editing, reset]);

  useEffect(() => {
    if (state.success) {
      toast.success(editingRef.current ? "Asset updated" : "Asset created");
      onOpenChangeRef.current(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  const onSubmit = (values: z.input<typeof assetSchema>) => {
    const fd = new FormData();
    if (editing) fd.set("id", editing.id);
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") fd.set(k, String(v));
    });
    fd.set("current_condition", condition);
    fd.set("category", categoryValue);
    startSubmitTransition(() => {
      formAction(fd);
    });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Edit Asset" : "Add Asset"}
      description="Fill in the asset details below."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <ErrorMessage message={state.error} />
        <FormInput
          label="Asset name"
          name="name"
          register={register("name")}
          error={errors.name?.message}
          required
        />
        <FormSelect
          label="Category"
          name="category"
          value={categoryValue}
          onValueChange={(value) => {
            setCategoryValue(value);
            setValue("category", value, { shouldValidate: true });
          }}
          options={ASSET_CATEGORIES.map((c) => ({ value: c, label: c }))}
          error={errors.category?.message}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="Brand" name="brand" register={register("brand")} />
          <FormInput label="Model" name="model" register={register("model")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Quantity"
            name="quantity"
            type="number"
            register={register("quantity")}
            error={errors.quantity?.message}
          />
          <FormSelect
            label="Condition"
            name="current_condition"
            value={condition}
            onValueChange={setCondition}
            options={ASSET_CONDITIONS.map((c) => ({ value: c.value, label: c.label }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Purchase date"
            name="purchase_date"
            type="date"
            register={register("purchase_date")}
          />
          <FormInput
            label="Purchase cost"
            name="purchase_cost"
            type="number"
            step="0.01"
            register={register("purchase_cost")}
            error={errors.purchase_cost?.message}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Location"
            name="location"
            register={register("location")}
          />
          <FormInput
            label="Warranty expiry"
            name="warranty_expiry"
            type="date"
            register={register("warranty_expiry")}
          />
        </div>
        <FormInput label="Supplier" name="supplier" register={register("supplier")} />
        <FormTextarea label="Notes" name="notes" register={register("notes")} />
        <div className="flex justify-end gap-2 pt-2">
          <FormSubmitButton loading={pending}>
            {editing ? "Save Changes" : "Create Asset"}
          </FormSubmitButton>
        </div>
      </form>
    </FormDialog>
  );
}
