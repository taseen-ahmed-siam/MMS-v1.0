import { Metadata } from "next";
import { getAllAnnouncements } from "@/lib/queries/admin";
import { PAGE_SIZE } from "@/constants";
import { AnnouncementsClient } from "./announcements-client";

export const metadata: Metadata = {
  title: "Announcements",
};

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const search = params.search ?? "";
  const status = params.status !== "__all__" ? params.status : undefined;
  const priority = params.priority !== "__all__" ? params.priority : undefined;
  const page = Number(params.page) || 1;

  const result = await getAllAnnouncements({
    search,
    status,
    priority,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <AnnouncementsClient
      data={result.data}
      total={result.total}
      page={result.page}
      totalPages={result.totalPages}
      filters={{ search, status: params.status, priority: params.priority }}
    />
  );
}
