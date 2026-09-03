import { Metadata } from "next";
import { getContactRequests } from "@/lib/queries/admin";
import { PAGE_SIZE } from "@/constants";
import { RequestsClient } from "./requests-client";

export const metadata: Metadata = {
  title: "Requests",
};

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = typeof params.search === "string" ? params.search : "";
  const status = typeof params.status === "string" ? params.status : "";

  const { data, total, totalPages } = await getContactRequests({
    search,
    status: status || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <RequestsClient
      requests={data}
      initialSearch={search}
      initialStatus={status}
      page={page}
      total={total}
      totalPages={totalPages}
    />
  );
}
