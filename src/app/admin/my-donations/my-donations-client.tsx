"use client";

import * as React from "react";
import type { Donation } from "@/types/database";
import { DONATION_STATUSES, PAYMENT_METHODS } from "@/constants";
import { DataTable } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { MyDonationsPagination } from "./my-donations-pagination";

type MyDonation = Donation & { donation_funds: { name: string } | null };

function paymentMethodLabel(value: string) {
  return PAYMENT_METHODS.find((m) => m.value === value)?.label ?? value;
}

export function MyDonationsTable({
  data,
  total,
  page,
  totalPages,
}: {
  data: MyDonation[];
  total: number;
  page: number;
  totalPages: number;
}) {
  const columns = [
    {
      key: "fund",
      header: "Fund",
      cell: (d: MyDonation) => (
        <span className="font-medium text-foreground">{d.donation_funds?.name || "General"}</span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (d: MyDonation) => (
        <span className="font-bold text-emerald-700">{formatCurrency(Number(d.amount))}</span>
      ),
    },
    {
      key: "donation_date",
      header: "Date",
      cell: (d: MyDonation) => <span>{formatDate(d.donation_date)}</span>,
    },
    {
      key: "payment_method",
      header: "Method",
      cell: (d: MyDonation) => <span className="capitalize">{paymentMethodLabel(d.payment_method)}</span>,
    },
    {
      key: "receipt_number",
      header: "Receipt",
      cell: (d: MyDonation) => (
        <span className="font-mono text-xs text-muted-foreground">{d.receipt_number || "—"}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (d: MyDonation) => (
        <StatusBadge status={d.status} statuses={[...DONATION_STATUSES]} />
      ),
    },
  ];

  return (
    <>
      <DataTable columns={columns} data={data} />
      {totalPages > 1 && (
        <div className="border-t border-black/[0.05] px-4 pt-4">
          <MyDonationsPagination page={page} totalPages={totalPages} total={total} />
        </div>
      )}
    </>
  );
}