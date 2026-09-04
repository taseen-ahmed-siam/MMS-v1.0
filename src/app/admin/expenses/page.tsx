import { Metadata } from "next";
import { getExpenses } from "@/lib/queries/admin";
import { PAGE_SIZE } from "@/constants";
import { ExpensesClient } from "./expenses-client";

export const metadata: Metadata = {
  title: "Expenses",
};

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = typeof params.search === "string" ? params.search : "";
  const status = typeof params.status === "string" ? params.status : "";
  const category = typeof params.category === "string" ? params.category : "";

  const result = await getExpenses({
    search,
    status: status || undefined,
    category: category || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <ExpensesClient
      expenses={result.data}
      initialSearch={search}
      initialStatus={status}
      initialCategory={category}
      page={page}
      total={result.total}
      totalPages={result.totalPages}
    />
  );
}
