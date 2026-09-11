import { Metadata } from "next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHandHoldingHeart,
  faListCheck,
  faCalendarDays,
} from "@fortawesome/free-solid-svg-icons";
import { requireAuth } from "@/lib/auth/session";
import { getMyDonations } from "@/lib/queries/admin";
import { PAGE_SIZE } from "@/constants";
import { PageHeader } from "@/components/forms/page-header";
import { AdminTableWrapper } from "@/components/admin/table-wrapper";
import { MyDonationsTable } from "./my-donations-client";
import { formatCurrency, formatDate, cn } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "My Donations",
};

function SummaryCard({
  icon,
  label,
  value,
  bg,
  color,
}: {
  icon: React.ComponentProps<typeof FontAwesomeIcon>["icon"];
  label: string;
  value: string;
  bg: string;
  color: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-60 blur-2xl",
          bg
        )}
      />
      <div className="relative flex items-center gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base ring-1 ring-inset ring-black/5 shadow-sm",
            bg,
            color
          )}
        >
          <FontAwesomeIcon icon={icon} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-0.5 truncate text-lg font-bold tracking-tight text-foreground">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function MyDonationsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const user = await requireAuth();
  const { data, total, totalAmount, totalPages } = await getMyDonations({
    userId: user.id,
    page,
    pageSize: PAGE_SIZE,
  });

  const lastDonation = data[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Donations"
        description="Your donation history at the mosque."
        icon={faHandHoldingHeart}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={faHandHoldingHeart}
          label="Total Donated"
          value={formatCurrency(totalAmount)}
          bg="bg-emerald-50"
          color="text-emerald-600"
        />
        <SummaryCard
          icon={faListCheck}
          label="Total Records"
          value={String(total)}
          bg="bg-sky-50"
          color="text-sky-600"
        />
        <SummaryCard
          icon={faCalendarDays}
          label="Last Donation"
          value={
            lastDonation
              ? formatDate(lastDonation.donation_date)
              : "—"
          }
          bg="bg-amber-50"
          color="text-amber-600"
        />
      </div>

      <AdminTableWrapper
        title="Donation History"
        description="Records of donations you submitted while logged in."
        empty={data.length === 0}
        emptyTitle="No donations yet"
        emptyDescription="When you donate while logged in, your records will appear here."
      >
        <MyDonationsTable
          data={data}
          total={total}
          page={page}
          totalPages={totalPages}
        />
      </AdminTableWrapper>
    </div>
  );
}