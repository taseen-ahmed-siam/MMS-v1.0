import { requirePermission } from "@/lib/access";
import { Metadata } from "next";
import { getStaff } from "@/lib/queries/admin";
import { PAGE_SIZE } from "@/constants";
import { StaffClient } from "./staff-client";

export const metadata: Metadata = {
  title: "Staff",
};

export const dynamic = "force-dynamic";

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission("staff.manage");

  const params = await searchParams;
  const search = params.search ?? "";
  const status = params.status !== "__all__" ? params.status : undefined;
  const page = Number(params.page) || 1;

  const result = await getStaff({ search, status, page, pageSize: PAGE_SIZE });

  return (
    <StaffClient
      data={result.data}
      total={result.total}
      page={result.page}
      totalPages={result.totalPages}
      filters={{ search, status: params.status }}
    />
  );
}
