import { Metadata } from "next";
import { getDonations, getFunds } from "@/lib/queries/admin";
import { PAGE_SIZE } from "@/constants";
import { DonationsClient } from "./donations-client";

export const metadata: Metadata = {
  title: "Donations",
};

export default async function DonationsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = typeof params.search === "string" ? params.search : "";
  const status = typeof params.status === "string" ? params.status : "";
  const fundId = typeof params.fund === "string" ? params.fund : "";
  const newTab = params.new === "1";

  const [donations, funds] = await Promise.all([
    getDonations({ search, status: status || undefined, fundId: fundId || undefined, page, pageSize: PAGE_SIZE }),
    getFunds(),
  ]);

  return (
    <DonationsClient
      donations={donations.data}
      funds={funds}
      initialSearch={search}
      initialStatus={status}
      initialFundId={fundId}
      page={page}
      total={donations.total}
      totalPages={donations.totalPages}
      autoOpenCreate={newTab}
    />
  );
}
