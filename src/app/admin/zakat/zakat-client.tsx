"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  zakatCollectionSchema,
  zakatBeneficiarySchema,
  zakatDistributionSchema,
} from "@/lib/validations";
import {
  createZakatCollection,
  createZakatBeneficiary,
  createZakatDistribution,
} from "@/lib/actions/admin";
import type {
  ZakatCollection,
  ZakatBeneficiary,
  ZakatDistribution,
} from "@/types/database";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FormDialog } from "@/components/admin/form-dialog";
import { StatusBadge } from "@/components/admin/status-badge";
import { AdminTableWrapper } from "@/components/admin/table-wrapper";
import { PageHeader } from "@/components/forms/page-header";
import { FormInput } from "@/components/forms/form-input";
import { FormSelect } from "@/components/forms/form-select";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormSubmitButton } from "@/components/forms/form-submit-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

type CollectionFormData = z.infer<typeof zakatCollectionSchema>;
type BeneficiaryFormData = z.infer<typeof zakatBeneficiarySchema>;
type DistributionFormData = z.infer<typeof zakatDistributionSchema>;

const beneficiaryStatuses = [
  { value: "pending", label: "Pending", color: "text-yellow-600" },
  { value: "verified", label: "Verified", color: "text-blue-600" },
  { value: "active", label: "Active", color: "text-green-600" },
  { value: "rejected", label: "Rejected", color: "text-red-600" },
];

const collectionDefaults: CollectionFormData = {
  amount: 0,
  collection_date: "",
  fund_source: "",
  notes: "",
};

const beneficiaryDefaults: BeneficiaryFormData = {
  name: "",
  phone: "",
  address: "",
  family_size: undefined,
  financial_condition: "",
  verification_notes: "",
  status: "pending",
};

interface ZakatClientProps {
  collections: ZakatCollection[];
  beneficiaries: (ZakatBeneficiary & { zakat_distributions: { amount: number }[] })[];
  distributions: (ZakatDistribution & { zakat_beneficiaries: { name: string } | null })[];
}

export function ZakatClient({ collections, beneficiaries, distributions }: ZakatClientProps) {
  const router = useRouter();

  const [collectionOpen, setCollectionOpen] = useState(false);
  const [beneficiaryOpen, setBeneficiaryOpen] = useState(false);
  const [distributionOpen, setDistributionOpen] = useState(false);

  const [collectionState, collectionFormAction, isCreatingCollection] = useActionState(createZakatCollection, {});
  const [beneficiaryState, beneficiaryFormAction, isCreatingBeneficiary] = useActionState(createZakatBeneficiary, {});
  const [distributionState, distributionFormAction, isCreatingDistribution] = useActionState(createZakatDistribution, {});
  const [, startSubmitTransition] = useTransition();

  const collectionForm = useForm<CollectionFormData>({
    resolver: zodResolver(zakatCollectionSchema),
    defaultValues: collectionDefaults,
  });

  const beneficiaryForm = useForm<BeneficiaryFormData>({
    resolver: zodResolver(zakatBeneficiarySchema),
    defaultValues: beneficiaryDefaults,
  });

  const distributionForm = useForm<DistributionFormData>({
    resolver: zodResolver(zakatDistributionSchema),
    defaultValues: {
      beneficiary_id: "",
      amount: 0,
      distribution_date: "",
      distribution_method: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (collectionState.success) {
      toast.success("Zakat collection recorded");
      router.refresh();
      setCollectionOpen(false);
      collectionForm.reset(collectionDefaults);
    } else if (collectionState.error) {
      toast.error(collectionState.error);
    }
  }, [collectionState, router, collectionForm]);

  useEffect(() => {
    if (beneficiaryState.success) {
      toast.success("Beneficiary added");
      router.refresh();
      setBeneficiaryOpen(false);
      beneficiaryForm.reset(beneficiaryDefaults);
    } else if (beneficiaryState.error) {
      toast.error(beneficiaryState.error);
    }
  }, [beneficiaryState, router, beneficiaryForm]);

  useEffect(() => {
    if (distributionState.success) {
      toast.success("Distribution recorded");
      router.refresh();
      setDistributionOpen(false);
      distributionForm.reset({ beneficiary_id: "", amount: 0, distribution_date: "", distribution_method: "", notes: "" });
    } else if (distributionState.error) {
      toast.error(distributionState.error);
    }
  }, [distributionState, router, distributionForm]);

  const collectionColumns: Column<ZakatCollection>[] = [
    { key: "collection_date", header: "Date", cell: (row) => (
      <span className="text-sm text-muted-foreground">{formatDate(row.collection_date)}</span>
    )},
    { key: "amount", header: "Amount", cell: (row) => (
      <span className="font-medium">{formatCurrency(row.amount)}</span>
    )},
    { key: "fund_source", header: "Source", cell: (row) => row.fund_source || "—" },
    { key: "created_at", header: "Recorded", cell: (row) => (
      <span className="text-sm text-muted-foreground">{formatDate(row.created_at)}</span>
    )},
  ];

  const beneficiaryColumns: Column<ZakatBeneficiary & { zakat_distributions: { amount: number }[] }>[] = [
    { key: "name", header: "Name", cell: (row) => (
      <div>
        <p className="font-medium">{row.name}</p>
        {row.phone && <p className="text-xs text-muted-foreground">{row.phone}</p>}
      </div>
    )},
    { key: "family_size", header: "Family", cell: (row) => row.family_size ?? "—" },
    { key: "status", header: "Status", cell: (row) => (
      <StatusBadge status={row.status} statuses={beneficiaryStatuses} />
    )},
    { key: "total_distributed", header: "Total Distributed", cell: (row) => {
      const total = (row.zakat_distributions || []).reduce(
        (sum: number, d: { amount: number }) => sum + Number(d.amount),
        0
      );
      return <span>{formatCurrency(total)}</span>;
    }},
  ];

  const distributionColumns: Column<ZakatDistribution & { zakat_beneficiaries: { name: string } | null }>[] = [
    { key: "distribution_date", header: "Date", cell: (row) => (
      <span className="text-sm text-muted-foreground">{formatDate(row.distribution_date)}</span>
    )},
    { key: "beneficiary", header: "Beneficiary", cell: (row) => (
      <span>{row.zakat_beneficiaries?.name || "—"}</span>
    )},
    { key: "amount", header: "Amount", cell: (row) => (
      <span className="font-medium">{formatCurrency(row.amount)}</span>
    )},
    { key: "distribution_method", header: "Method", cell: (row) => row.distribution_method || "—" },
  ];

  const beneficiaryOptions = beneficiaries.filter((b) => b.status !== "rejected").map((b) => ({
    value: b.id,
    label: b.name,
  }));

  const onCollectionSubmit = collectionForm.handleSubmit((data) => {
    const fd = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) fd.set(key, String(value));
    });
    startSubmitTransition(() => {
      collectionFormAction(fd);
    });
  });

  const onBeneficiarySubmit = beneficiaryForm.handleSubmit((data) => {
    const fd = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) fd.set(key, String(value));
    });
    startSubmitTransition(() => {
      beneficiaryFormAction(fd);
    });
  });

  const onDistributionSubmit = distributionForm.handleSubmit((data) => {
    const fd = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) fd.set(key, String(value));
    });
    startSubmitTransition(() => {
      distributionFormAction(fd);
    });
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Zakat" description="Manage zakat collections, beneficiaries, and distributions" />

      <Tabs defaultValue="collections">
        <TabsList>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="beneficiaries">Beneficiaries</TabsTrigger>
          <TabsTrigger value="distributions">Distributions</TabsTrigger>
        </TabsList>

        <TabsContent value="collections" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setCollectionOpen(true)}>Record Collection</Button>
          </div>
          <AdminTableWrapper empty={collections.length === 0} emptyTitle="No collections">
            <DataTable columns={collectionColumns} data={collections} />
          </AdminTableWrapper>
        </TabsContent>

        <TabsContent value="beneficiaries" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setBeneficiaryOpen(true)}>Add Beneficiary</Button>
          </div>
          <AdminTableWrapper empty={beneficiaries.length === 0} emptyTitle="No beneficiaries">
            <DataTable columns={beneficiaryColumns} data={beneficiaries} />
          </AdminTableWrapper>
        </TabsContent>

        <TabsContent value="distributions" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setDistributionOpen(true)}>Record Distribution</Button>
          </div>
          <AdminTableWrapper empty={distributions.length === 0} emptyTitle="No distributions">
            <DataTable columns={distributionColumns} data={distributions} />
          </AdminTableWrapper>
        </TabsContent>
      </Tabs>

      <FormDialog
        open={collectionOpen}
        onOpenChange={setCollectionOpen}
        title="Record Zakat Collection"
        footer={
          <div className="flex w-full gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setCollectionOpen(false)}>Cancel</Button>
            <FormSubmitButton loading={isCreatingCollection} form="collection-form">Save</FormSubmitButton>
          </div>
        }
      >
        <form id="collection-form" onSubmit={onCollectionSubmit} className="space-y-4">
          <FormInput
            label="Amount"
            name="amount"
            type="number"
            required
            register={collectionForm.register("amount", { valueAsNumber: true })}
            error={collectionForm.formState.errors.amount?.message}
          />
          <FormInput
            label="Collection Date"
            name="collection_date"
            type="date"
            required
            register={collectionForm.register("collection_date")}
            error={collectionForm.formState.errors.collection_date?.message}
          />
          <FormInput
            label="Fund Source"
            name="fund_source"
            register={collectionForm.register("fund_source")}
          />
          <FormTextarea
            label="Notes"
            name="notes"
            register={collectionForm.register("notes")}
          />
        </form>
      </FormDialog>

      <FormDialog
        open={beneficiaryOpen}
        onOpenChange={setBeneficiaryOpen}
        title="Add Zakat Beneficiary"
        footer={
          <div className="flex w-full gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setBeneficiaryOpen(false)}>Cancel</Button>
            <FormSubmitButton loading={isCreatingBeneficiary} form="beneficiary-form">Save</FormSubmitButton>
          </div>
        }
      >
        <form id="beneficiary-form" onSubmit={onBeneficiarySubmit} className="space-y-4">
          <FormInput
            label="Name"
            name="name"
            required
            register={beneficiaryForm.register("name")}
            error={beneficiaryForm.formState.errors.name?.message}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Phone"
              name="phone"
              register={beneficiaryForm.register("phone")}
            />
            <FormInput
              label="Family Size"
              name="family_size"
              type="number"
              register={beneficiaryForm.register("family_size", { valueAsNumber: true })}
            />
          </div>
          <FormInput
            label="Address"
            name="address"
            register={beneficiaryForm.register("address")}
          />
          <FormInput
            label="Financial Condition"
            name="financial_condition"
            register={beneficiaryForm.register("financial_condition")}
          />
          <FormSelect
            label="Status"
            name="status"
            required
            value={beneficiaryForm.watch("status")}
            onValueChange={(v) => beneficiaryForm.setValue("status", v as BeneficiaryFormData["status"])}
            options={beneficiaryStatuses.map((s) => ({ value: s.value, label: s.label }))}
          />
          <FormTextarea
            label="Verification Notes"
            name="verification_notes"
            register={beneficiaryForm.register("verification_notes")}
          />
        </form>
      </FormDialog>

      <FormDialog
        open={distributionOpen}
        onOpenChange={setDistributionOpen}
        title="Record Zakat Distribution"
        footer={
          <div className="flex w-full gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setDistributionOpen(false)}>Cancel</Button>
            <FormSubmitButton loading={isCreatingDistribution} form="distribution-form">Save</FormSubmitButton>
          </div>
        }
      >
        <form id="distribution-form" onSubmit={onDistributionSubmit} className="space-y-4">
          <FormSelect
            label="Beneficiary"
            name="beneficiary_id"
            required
            value={distributionForm.watch("beneficiary_id")}
            onValueChange={(v) => distributionForm.setValue("beneficiary_id", v)}
            options={beneficiaryOptions}
            error={distributionForm.formState.errors.beneficiary_id?.message}
          />
          <FormInput
            label="Amount"
            name="amount"
            type="number"
            required
            register={distributionForm.register("amount", { valueAsNumber: true })}
            error={distributionForm.formState.errors.amount?.message}
          />
          <FormInput
            label="Distribution Date"
            name="distribution_date"
            type="date"
            required
            register={distributionForm.register("distribution_date")}
            error={distributionForm.formState.errors.distribution_date?.message}
          />
          <FormInput
            label="Distribution Method"
            name="distribution_method"
            register={distributionForm.register("distribution_method")}
          />
          <FormTextarea
            label="Notes"
            name="notes"
            register={distributionForm.register("notes")}
          />
        </form>
      </FormDialog>
    </div>
  );
}
