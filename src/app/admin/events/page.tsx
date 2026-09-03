import { Metadata } from "next";
import { getAllEvents } from "@/lib/queries/admin";
import { PAGE_SIZE } from "@/constants";
import { EventsClient } from "./events-client";

export const metadata: Metadata = {
  title: "Events",
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const search = params.search ?? "";
  const status = params.status !== "__all__" ? params.status : undefined;
  const event_type = params.event_type !== "__all__" ? params.event_type : undefined;
  const page = Number(params.page) || 1;

  const result = await getAllEvents({ search, status, event_type, page, pageSize: PAGE_SIZE });

  return (
    <EventsClient
      data={result.data}
      total={result.total}
      page={result.page}
      totalPages={result.totalPages}
      filters={{ search, status: params.status, event_type: params.event_type }}
    />
  );
}
