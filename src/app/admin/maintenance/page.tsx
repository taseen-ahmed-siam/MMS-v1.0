import { Metadata } from "next";
import {
  getMaintenanceRequests,
  getAllAssets,
} from "@/lib/queries/admin";
import { PAGE_SIZE } from "@/constants";
import { MaintenanceClient } from "./maintenance-client";

export const metadata: Metadata = {
  title: "Maintenance",
};

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = typeof params.search === "string" ? params.search : "";
  const status = typeof params.status === "string" ? params.status : "";
  const priority = typeof params.priority === "string" ? params.priority : "";

  const [{ data, total, totalPages }, assetResult] = await Promise.all([
    getMaintenanceRequests({
      search,
      status: status || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    getAllAssets({ pageSize: 1000 }),
  ]);

  return (
    <MaintenanceClient
      requests={data}
      assets={assetResult.data}
      initialSearch={search}
      initialStatus={status}
      initialPriority={priority}
      page={page}
      total={total}
      totalPages={totalPages}
    />
  );
}
