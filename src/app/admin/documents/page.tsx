import { Metadata } from "next";
import { getDocuments } from "@/lib/queries/admin";
import { PAGE_SIZE } from "@/constants";
import { DocumentsClient } from "./documents-client";

export const metadata: Metadata = {
  title: "Documents",
};

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = typeof params.search === "string" ? params.search : "";
  const category = typeof params.category === "string" ? params.category : "";

  const { data, total, totalPages } = await getDocuments({
    search,
    category: category || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <DocumentsClient
      documents={data}
      initialSearch={search}
      initialCategory={category}
      page={page}
      total={total}
      totalPages={totalPages}
    />
  );
}
