import { Metadata } from "next";
import { getAuditLogs } from "@/lib/queries/admin";
import { PAGE_SIZE } from "@/constants";
import { AuditLogsClient } from "@/components/admin/audit-logs-client";

export const metadata: Metadata = {
  title: "Audit Logs",
};

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; module?: string; page?: string }>;
}) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : "";
  const moduleFilter = typeof params.module === "string" ? params.module : "";
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);

  const result = await getAuditLogs({ search, module: moduleFilter, page, pageSize: PAGE_SIZE });

  return (
    <AuditLogsClient
      logs={result.data}
      total={result.total}
      page={result.page}
      totalPages={result.totalPages}
      search={search}
      module={moduleFilter}
    />
  );
}
