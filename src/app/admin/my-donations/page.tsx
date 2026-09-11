import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { getMyDonations } from "@/lib/queries/admin";
import { PAGE_SIZE, DONATION_STATUSES, PAYMENT_METHODS } from "@/constants";
import { PageHeader } from "@/components/forms/page-header";
import { AdminTableWrapper } from "@/components/admin/table-wrapper";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "My Donations",
};

function paymentMethodLabel(value: string) {
  return PAYMENT_METHODS.find((m) => m.value === value)?.label ?? value;
}

export default async function MyDonationsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const user = await requireAuth();
  const { data, total, totalPages } = await getMyDonations({
    userId: user.id,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="My Donations" description="Your donation history at the mosque." />

      <AdminTableWrapper
        title="Donation History"
        description="Records of donations you submitted while logged in."
        empty={data.length === 0}
        emptyTitle="No donations yet"
        emptyDescription="When you donate while logged in, your records will appear here."
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="px-6 py-3 font-medium">Fund</th>
              <th className="px-6 py-3 font-medium text-right">Amount</th>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium">Method</th>
              <th className="px-6 py-3 font-medium">Receipt</th>
              <th className="px-6 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((d) => (
              <tr key={d.id}>
                <td className="px-6 py-3">{d.donation_funds?.name || "General"}</td>
                <td className="px-6 py-3 text-right font-semibold">
                  {formatCurrency(Number(d.amount))}
                </td>
                <td className="px-6 py-3">{formatDate(d.donation_date)}</td>
                <td className="px-6 py-3 capitalize">{paymentMethodLabel(d.payment_method)}</td>
                <td className="px-6 py-3 font-mono text-xs">{d.receipt_number || "—"}</td>
                <td className="px-6 py-3">
                  <StatusBadge status={d.status} statuses={[...DONATION_STATUSES]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableWrapper>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} {total === 1 ? "record" : "records"}
          </p>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={`/admin/my-donations?page=${page - 1}`}
                className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Link>
            )}
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/admin/my-donations?page=${page + 1}`}
                className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}