import { requireAdminRole } from "@/lib/access";
import { Metadata } from "next";
import { getIncomes } from "@/lib/queries/admin";
import { PAGE_SIZE } from "@/constants";
import { IncomeClient } from "./income-client";

export const metadata: Metadata = {
  title: "Income",
};

export const dynamic = "force-dynamic";

export default async function IncomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdminRole();

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = typeof params.search === "string" ? params.search : "";
  const category = typeof params.category === "string" ? params.category : "";

  const result = await getIncomes({
    search,
    category: category || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <IncomeClient
      incomes={result.data}
      initialSearch={search}
      initialCategory={category}
      page={page}
      total={result.total}
      totalPages={result.totalPages}
    />
  );
}
