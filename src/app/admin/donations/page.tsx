import { requirePermission } from "@/lib/access";
import { Metadata } from "next";
import { getDonations, getEventLinkedFundIds, getFunds } from "@/lib/queries/admin";
import { PAGE_SIZE } from "@/constants";
import { DonationsClient } from "./donations-client";

export const metadata: Metadata = {
  title: "Donations",
};

export const dynamic = "force-dynamic";

export default async function DonationsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requirePermission("donation.view");

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = typeof params.search === "string" ? params.search : "";
  const status = typeof params.status === "string" ? params.status : "";
  const fundId = typeof params.fund === "string" ? params.fund : "";
  const linked = typeof params.linked === "string" ? params.linked : "";
  const newTab = params.new === "1";

  const [donations, funds, eventFundIds] = await Promise.all([
    getDonations({
      search,
      status: status || undefined,
      fundId: fundId || undefined,
      linked: linked || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    getFunds(),
    getEventLinkedFundIds(),
  ]);

  return (
    <DonationsClient
      donations={donations.data}
      funds={funds}
      eventFundIds={eventFundIds}
      initialSearch={search}
      initialStatus={status}
      initialFundId={fundId}
      initialLinked={linked}
      page={page}
      total={donations.total}
      totalPages={donations.totalPages}
      autoOpenCreate={newTab}
    />
  );
}
