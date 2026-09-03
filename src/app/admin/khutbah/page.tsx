import { Metadata } from "next";
import { getAllKhutbahs } from "@/lib/queries/admin";
import { PAGE_SIZE } from "@/constants";
import { KhutbahClient } from "./khutbah-client";

export const metadata: Metadata = {
  title: "Khutbah",
};

export default async function KhutbahPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const search = params.search ?? "";
  const status = params.status !== "__all__" ? params.status : undefined;
  const page = Number(params.page) || 1;

  const result = await getAllKhutbahs({ search, status, page, pageSize: PAGE_SIZE });

  return (
    <KhutbahClient
      data={result.data}
      total={result.total}
      page={result.page}
      totalPages={result.totalPages}
      filters={{ search, status: params.status }}
    />
  );
}
