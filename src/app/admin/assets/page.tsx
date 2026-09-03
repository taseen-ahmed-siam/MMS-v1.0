import { Metadata } from "next";
import { getAllAssets } from "@/lib/queries/admin";
import { PAGE_SIZE } from "@/constants";
import { AssetsClient } from "./assets-client";

export const metadata: Metadata = {
  title: "Assets",
};

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = typeof params.search === "string" ? params.search : "";
  const category = typeof params.category === "string" ? params.category : "";

  const { data, total, totalPages } = await getAllAssets({
    search,
    category: category || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <AssetsClient
      assets={data}
      initialSearch={search}
      initialCategory={category}
      page={page}
      total={total}
      totalPages={totalPages}
    />
  );
}
