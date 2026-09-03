import { Metadata } from "next";
import { getMembers } from "@/lib/queries/admin";
import { PAGE_SIZE } from "@/constants";
import { MembersClient } from "./members-client";

export const metadata: Metadata = {
  title: "Members",
};

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const search = params.search ?? "";
  const status = params.status !== "__all__" ? params.status : undefined;
  const membershipType = params.membershipType !== "__all__" ? params.membershipType : undefined;
  const page = Number(params.page) || 1;

  const result = await getMembers({
    search,
    status,
    membershipType,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <MembersClient
      data={result.data}
      total={result.total}
      page={result.page}
      totalPages={result.totalPages}
      filters={{ search, status: params.status, membershipType: params.membershipType }}
    />
  );
}
