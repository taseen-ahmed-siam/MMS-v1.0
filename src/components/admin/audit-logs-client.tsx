"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ScrollText } from "lucide-react";
import { DataTable } from "@/components/admin/data-table";
import { AdminTableWrapper } from "@/components/admin/table-wrapper";
import { FilterBar } from "@/components/admin/filter-bar";
import { PaginationBar } from "@/components/admin/pagination-bar";
import { formatDate, formatTime, timeAgo } from "@/lib/utils/format";
import type { AuditLog } from "@/types/database";

const MODULES = [
  "donation",
  "expense",
  "income",
  "fund",
  "member",
  "committee",
  "staff",
  "event",
  "announcement",
  "khutbah",
  "asset",
  "maintenance",
  "document",
  "request",
  "prayer",
  "settings",
  "zakat",
  "user",
  "role",
];

function actionBadge(action: string) {
  const map: Record<string, string> = {
    create: "bg-green-50 text-green-700",
    update: "bg-blue-50 text-blue-700",
    archive: "bg-orange-50 text-orange-700",
    delete: "bg-red-50 text-red-700",
    approve: "bg-emerald-50 text-emerald-700",
    reject: "bg-rose-50 text-rose-700",
    upsert: "bg-violet-50 text-violet-700",
    copy: "bg-cyan-50 text-cyan-700",
  };
  return map[action] || "bg-gray-100 text-gray-700";
}

function AuditLogsClient({
  logs,
  total,
  page,
  totalPages,
  search,
  module,
}: {
  logs: AuditLog[];
  total: number;
  page: number;
  totalPages: number;
  search: string;
  module: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParams(changes: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(changes).forEach(([k, v]) => {
      if (v && v !== "__all__") params.set(k, v);
      else params.delete(k);
    });
    router.push(`/admin/audit-logs?${params.toString()}`);
  }

  const moduleOptions = MODULES.map((m) => ({ value: m, label: m.charAt(0).toUpperCase() + m.slice(1) }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
          <ScrollText className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-sm text-muted-foreground">
            A read-only record of actions performed across the system.
          </p>
        </div>
      </div>

      <FilterBar
        search={search}
        onSearchChange={(v) => updateParams({ search: v })}
        filters={[
          {
            key: "module",
            label: "Module",
            options: moduleOptions,
            value: module || "__all__",
            onChange: (v) => updateParams({ module: v === "__all__" ? "" : v }),
          },
        ]}
      />

      <AdminTableWrapper
        title="Activity Logs"
        description="Recent administrator and system actions"
        empty={logs.length === 0}
        emptyTitle="No audit logs"
        emptyDescription="No activity matches your current filters."
      >
        <DataTable
          columns={[
            {
              key: "user",
              header: "User",
              cell: (row) => (
                <div>
                  <p className="font-medium">{row.user_name || "System"}</p>
                  <p className="text-xs text-muted-foreground">{row.user_id || "—"}</p>
                </div>
              ),
            },
            {
              key: "action",
              header: "Action",
              cell: (row) => (
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${actionBadge(row.action)}`}>
                  {row.action}
                </span>
              ),
            },
            {
              key: "module",
              header: "Module",
              cell: (row) => <span className="capitalize">{row.module}</span>,
            },
            {
              key: "entity",
              header: "Entity",
              cell: (row) => (
                <div>
                  <p className="capitalize">{row.entity}</p>
                  {row.entity_id && <p className="text-xs text-muted-foreground">{row.entity_id}</p>}
                </div>
              ),
            },
            {
              key: "ip",
              header: "IP Address",
              cell: (row) => <span className="text-muted-foreground">{row.ip_address || "—"}</span>,
            },
            {
              key: "created_at",
              header: "Date",
              className: "text-right",
              cell: (row) => (
                <div className="text-right">
                  <p className="whitespace-nowrap">{formatDate(row.created_at, "MMM d, yyyy")}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(new Date(row.created_at).toTimeString().slice(0, 5))} · {timeAgo(row.created_at)}
                  </p>
                </div>
              ),
            },
          ]}
          data={logs}
        />
      </AdminTableWrapper>

      <PaginationBar
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={(p) => updateParams({ page: String(p) })}
      />
    </div>
  );
}

export { AuditLogsClient };
