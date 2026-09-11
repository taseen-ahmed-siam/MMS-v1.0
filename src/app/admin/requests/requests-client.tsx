"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Mail, Phone } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faUser,
  faEnvelope,
  faPhone,
  faCalendarDays,
} from "@fortawesome/free-solid-svg-icons";

import type { ContactRequest } from "@/types/database";
import {
  updateContactRequestStatus,
  deleteContactRequest,
} from "@/lib/actions/admin";
import {
  CONTACT_STATUSES,
  CONTACT_REQUEST_TYPES,
} from "@/constants";
import { formatDate } from "@/lib/utils/format";
import { DataTable } from "@/components/admin/data-table";
import { PaginationBar } from "@/components/admin/pagination-bar";
import { FilterBar } from "@/components/admin/filter-bar";
import { StatusBadge } from "@/components/admin/status-badge";
import { AdminTableWrapper } from "@/components/admin/table-wrapper";
import { Button } from "@/components/ui/button";
import {
  FormSelect,
  FormTextarea,
  FormSubmitButton,
  ConfirmDialog,
  ErrorMessage,
  PageHeader,
} from "@/components/forms";
import { FormDialog } from "@/components/admin/form-dialog";

type RequestRow = ContactRequest;

interface RequestsClientProps {
  requests: ContactRequest[];
  initialSearch: string;
  initialStatus: string;
  page: number;
  total: number;
  totalPages: number;
}

export function RequestsClient({
  requests,
  initialSearch,
  initialStatus,
  page,
  total,
  totalPages,
}: RequestsClientProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [updating, setUpdating] = useState<ContactRequest | null>(null);
  const [viewing, setViewing] = useState<ContactRequest | null>(null);
  const [deleting, setDeleting] = useState<ContactRequest | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    const qs = params.toString();
    router.push(qs ? `?${qs}` : "?");
  }, [search, status, router]);

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletePending(true);
    const fd = new FormData();
    fd.set("id", deleting.id);
    const res = await deleteContactRequest(fd);
    setDeletePending(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Request deleted");
      setDeleting(null);
      router.refresh();
    }
  };

  const columns = [
    {
      key: "name",
      header: "Name",
      cell: (r: RequestRow) => (
        <div>
          <p className="font-medium">{r.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{r.request_type.replace(/_/g, " ")}</p>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      cell: (r: RequestRow) => (
        <div className="space-y-0.5">
          {r.email && (
            <p className="flex items-center gap-1.5 text-sm">
              <Mail className="h-3 w-3 text-muted-foreground" />
              {r.email}
            </p>
          )}
          {r.phone && (
            <p className="flex items-center gap-1.5 text-sm">
              <Phone className="h-3 w-3 text-muted-foreground" />
              {r.phone}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "subject",
      header: "Subject",
      cell: (r: RequestRow) => (
        <div>
          <p className="font-medium">{r.subject || "-"}</p>
          <p className="max-w-[220px] truncate text-xs text-muted-foreground">{r.message}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r: RequestRow) => (
        <StatusBadge status={r.status} statuses={[...CONTACT_STATUSES]} />
      ),
    },
    {
      key: "created_at",
      header: "Received",
      cell: (r: RequestRow) => <span>{formatDate(r.created_at, "MMM d, yyyy h:mm a")}</span>,
    },
    {
      key: "actions",
      header: "",
      cell: (r: RequestRow) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setViewing(r);
            }}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="View"
            title="View request"
          >
            <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setUpdating(r);
            }}
            className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Update
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleting(r);
            }}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Requests"
        description="Incoming contact and inquiry requests."
      />

      <AdminTableWrapper
        title="Contact Requests"
        description={`${total} requests found`}
        empty={requests.length === 0}
        emptyTitle="No requests"
        emptyDescription="No contact requests match your current filters."
      >
        <div className="px-4 pb-4 pt-4">
          <FilterBar
            search={searchInput}
            onSearchChange={setSearchInput}
            filters={[
              {
                key: "status",
                label: "Status",
                value: status || "__all__",
                onChange: (v) => setStatus(v === "__all__" ? "" : v),
                options: CONTACT_STATUSES.map((s) => ({ value: s.value, label: s.label })),
              },
            ]}
          />
        </div>
        <DataTable data={requests} columns={columns} />
        <div className="px-4 pb-4">
          <PaginationBar
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={(p) => router.push(`?page=${p}`)}
          />
        </div>
      </AdminTableWrapper>

      <StatusUpdateDialog
        request={updating}
        onOpenChange={(o) => !o && setUpdating(null)}
      />

      <ViewRequestDialog
        request={viewing}
        onOpenChange={(o) => !o && setViewing(null)}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete request"
        description={`Are you sure you want to delete the request from "${deleting?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deletePending}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function StatusUpdateDialog({
  request,
  onOpenChange,
}: {
  request: ContactRequest | null;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [statusValue, setStatusValue] = useState("new");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (request) {
      setIsOpen(true);
      setStatusValue(request.status);
      setNotes(request.notes || "");
      setError("");
    }
  }, [request]);

  const close = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      onOpenChange(false);
    }
  };

  const handleSubmit = async () => {
    if (!request) return;
    setPending(true);
    setError("");
    const fd = new FormData();
    fd.set("id", request.id);
    fd.set("status", statusValue);
    if (notes) fd.set("notes", notes);
    const res = await updateContactRequestStatus(fd);
    setPending(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Status updated");
      close(false);
      router.refresh();
    }
  };

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={close}
      title="Update Request Status"
      description={
        request
          ? `Request from ${request.name}`
          : undefined
      }
    >
      <ErrorMessage message={error} />
      <div className="space-y-4 pt-2">
        <FormSelect
          label="Status"
          name="status"
          value={statusValue}
          onValueChange={setStatusValue}
          options={CONTACT_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
        />
        <FormTextarea
          label="Notes"
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add a note (optional)"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <FormSubmitButton onClick={handleSubmit} loading={pending}>
          Update Status
        </FormSubmitButton>
      </div>
    </FormDialog>
  );
}

function ViewRequestDialog({
  request,
  onOpenChange,
}: {
  request: ContactRequest | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (request) setIsOpen(true);
  }, [request]);

  const close = (open: boolean) => {
    setIsOpen(open);
    if (!open) onOpenChange(false);
  };

  if (!request) return null;

  const typeLabel =
    CONTACT_REQUEST_TYPES.find((t) => t.value === request.request_type)?.label ??
    request.request_type.replace(/_/g, " ");
  const mailto = request.email
    ? `mailto:${request.email}?subject=Re: ${encodeURIComponent(request.subject || "Your request")}`
    : undefined;

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={close}
      title="Request Details"
      description={`Request from ${request.name}`}
      className="sm:max-w-2xl"
    >
      <div className="space-y-4 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-[#064E3B]/10 px-2.5 py-1 text-xs font-medium text-[#064E3B]">
            {typeLabel}
          </span>
          <StatusBadge status={request.status} statuses={[...CONTACT_STATUSES]} />
        </div>

        <div className="grid gap-3 rounded-xl bg-muted/40 p-4 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-sm">
            <FontAwesomeIcon icon={faUser} className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{request.name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <FontAwesomeIcon icon={faEnvelope} className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate">{request.email || "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <FontAwesomeIcon icon={faPhone} className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{request.phone || "—"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <FontAwesomeIcon icon={faCalendarDays} className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{formatDate(request.created_at, "MMM d, yyyy h:mm a")}</span>
          </div>
        </div>

        {request.subject && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Subject
            </p>
            <p className="font-medium">{request.subject}</p>
          </div>
        )}

        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Message
          </p>
          <p className="whitespace-pre-wrap rounded-xl bg-muted/40 p-4 text-sm leading-relaxed">
            {request.message}
          </p>
        </div>

        {request.notes && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Staff Notes
            </p>
            <p className="whitespace-pre-wrap text-sm">{request.notes}</p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {mailto && (
          <Button asChild variant="outline">
            <a href={mailto}>
              <FontAwesomeIcon icon={faEnvelope} className="mr-1.5 h-3.5 w-3.5" />
              Reply via Email
            </a>
          </Button>
        )}
        <Button variant="ghost" onClick={() => close(false)}>
          Close
        </Button>
      </div>
    </FormDialog>
  );
}
