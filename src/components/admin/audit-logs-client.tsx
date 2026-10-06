"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faScroll } from "@fortawesome/free-solid-svg-icons";
import { DataTable } from "@/components/admin/data-table";
import {
  DesktopTableOnly,
  MobileRecordCard,
  MobileRecordHead,
  MobileRecordList,
} from "@/components/admin/mobile-record-card";
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
  const columns = [
    {
      key: "user",
      header: "User",
      cell: (row: AuditLog) => (
        <div>
          <p className="font-medium">{row.user_name || "System"}</p>
          <p className="text-xs text-muted-foreground">{row.user_id || "—"}</p>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      cell: (row: AuditLog) => (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${actionBadge(row.action)}`}>
          {row.action}
        </span>
      ),
    },
    {
      key: "module",
      header: "Module",
      cell: (row: AuditLog) => <span className="capitalize">{row.module}</span>,
    },
    {
      key: "entity",
      header: "Entity",
      cell: (row: AuditLog) => (
        <div>
          <p className="capitalize">{row.entity}</p>
          {row.entity_id && <p className="text-xs text-muted-foreground">{row.entity_id}</p>}
        </div>
      ),
    },
    {
      key: "ip",
      header: "IP Address",
      cell: (row: AuditLog) => <span className="text-muted-foreground">{row.ip_address || "—"}</span>,
    },
    {
      key: "created_at",
      header: "Date",
      className: "text-right",
      cell: (row: AuditLog) => (
        <div className="text-right">
          <p className="whitespace-nowrap">{formatDate(row.created_at, "MMM d, yyyy")}</p>
          <p className="text-xs text-muted-foreground">
            {formatTime(new Date(row.created_at).toTimeString().slice(0, 5))} · {timeAgo(row.created_at)}
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#064E3B]/10">
          <FontAwesomeIcon icon={faScroll} className="h-5 w-5 text-[#064E3B]" />
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
        <MobileRecordList
          items={logs}
          getKey={(row) => row.id}
          renderCard={(row) => (
            <MobileRecordCard className="px-3 py-3.5">
              <MobileRecordHead
                title={row.user_name || "System"}
                subtitle={`${row.module} · ${row.entity}`}
                trailing={
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${actionBadge(row.action)}`}>
                    {row.action}
                  </span>
                }
              />
              <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-border/70 pt-2.5 text-[11px]">
                <div>
                  <p className="uppercase tracking-wide text-muted-foreground">Module</p>
                  <p className="mt-0.5 capitalize font-medium text-foreground">{row.module}</p>
                </div>
                <div>
                  <p className="uppercase tracking-wide text-muted-foreground">Entity</p>
                  <p className="mt-0.5 capitalize font-medium text-foreground">{row.entity}</p>
                </div>
                <div>
                  <p className="uppercase tracking-wide text-muted-foreground">IP Address</p>
                  <p className="mt-0.5 truncate font-medium text-foreground">{row.ip_address || "—"}</p>
                </div>
                <div>
                  <p className="uppercase tracking-wide text-muted-foreground">Date</p>
                  <p className="mt-0.5 font-medium text-foreground">
                    {formatDate(row.created_at, "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-between border-t border-border/70 pt-2.5 text-[11px] text-muted-foreground">
                <span className="truncate">{row.entity_id || row.user_id || "System action"}</span>
                <span className="shrink-0">{timeAgo(row.created_at)}</span>
              </div>
            </MobileRecordCard>
          )}
        />
        <DesktopTableOnly>
          <DataTable columns={columns} data={logs} />
        </DesktopTableOnly>
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
