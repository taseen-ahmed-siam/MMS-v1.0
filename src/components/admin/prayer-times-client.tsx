"use client";

import * as React from "react";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, Copy, Clock } from "lucide-react";
import {
  upsertPrayerTimes,
  copyPrayerTimes,
  deletePrayerTimes,
} from "@/lib/actions/admin";
import { DataTable } from "@/components/admin/data-table";
import { AdminTableWrapper } from "@/components/admin/table-wrapper";
import { PageActions } from "@/components/admin/page-actions";
import { FormDialog } from "@/components/admin/form-dialog";
import { FormInput, FormTextarea, FormSubmitButton, ConfirmDialog } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime } from "@/lib/utils/format";
import type { PrayerTime } from "@/types/database";

type FormValues = {
  date: string;
  fajr_adhan: string;
  fajr_jamaat: string;
  sunrise: string;
  dhuhr_adhan: string;
  dhuhr_jamaat: string;
  asr_adhan: string;
  asr_jamaat: string;
  maghrib_adhan: string;
  maghrib_jamaat: string;
  isha_adhan: string;
  isha_jamaat: string;
  notes?: string;
};

type ActionResult = { error?: string; success?: boolean; id?: string };

const TIME_FIELDS: { key: keyof FormValues & string; label: string; required: boolean }[] = [
  { key: "fajr_adhan", label: "Fajr Adhan", required: true },
  { key: "fajr_jamaat", label: "Fajr Jamaat", required: true },
  { key: "sunrise", label: "Sunrise", required: false },
  { key: "dhuhr_adhan", label: "Dhuhr Adhan", required: true },
  { key: "dhuhr_jamaat", label: "Dhuhr Jamaat", required: true },
  { key: "asr_adhan", label: "Asr Adhan", required: true },
  { key: "asr_jamaat", label: "Asr Jamaat", required: true },
  { key: "maghrib_adhan", label: "Maghrib Adhan", required: true },
  { key: "maghrib_jamaat", label: "Maghrib Jamaat", required: true },
  { key: "isha_adhan", label: "Isha Adhan", required: true },
  { key: "isha_jamaat", label: "Isha Jamaat", required: true },
];

function defaults(row?: PrayerTime | null): FormValues {
  return {
    date: row?.date || new Date().toISOString().split("T")[0],
    fajr_adhan: row?.fajr_adhan || "",
    fajr_jamaat: row?.fajr_jamaat || "",
    sunrise: row?.sunrise || "",
    dhuhr_adhan: row?.dhuhr_adhan || "",
    dhuhr_jamaat: row?.dhuhr_jamaat || "",
    asr_adhan: row?.asr_adhan || "",
    asr_jamaat: row?.asr_jamaat || "",
    maghrib_adhan: row?.maghrib_adhan || "",
    maghrib_jamaat: row?.maghrib_jamaat || "",
    isha_adhan: row?.isha_adhan || "",
    isha_jamaat: row?.isha_jamaat || "",
    notes: row?.notes || "",
  };
}

function PrayerTimesClient({ data, today }: { data: PrayerTime[]; today: PrayerTime | null }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PrayerTime | null>(null);
  const [editDefault, setEditDefault] = useState<FormValues>(defaults());
  const [upsertPending, startUpsert] = useTransition();
  const [copyPending, startCopy] = useTransition();
  const [deletePending, startDelete] = useTransition();

  function openCreate() {
    setEditDefault(defaults(today));
    setEditOpen(true);
  }

  function openEdit(row: PrayerTime) {
    setEditDefault(defaults(row));
    setEditOpen(true);
  }

  function handleUpsert(formData: FormData) {
    startUpsert(async () => {
      const result = await upsertPrayerTimes({} as ActionResult, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Prayer times saved");
        setEditOpen(false);
        router.refresh();
      }
    });
  }

  function handleCopy(formData: FormData) {
    startCopy(async () => {
      const result = await copyPrayerTimes(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message || "Schedule copied");
        setCopyOpen(false);
        router.refresh();
      }
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startDelete(async () => {
      const fd = new FormData();
      fd.set("id", deleteTarget.id);
      const result = await deletePrayerTimes(fd);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Prayer times deleted");
        setDeleteTarget(null);
        router.refresh();
      }
    });
  }

  const todayCards = today
    ? [
        { label: "Fajr", time: today.fajr_jamaat },
        { label: "Sunrise", time: today.sunrise },
        { label: "Dhuhr", time: today.dhuhr_jamaat },
        { label: "Asr", time: today.asr_jamaat },
        { label: "Maghrib", time: today.maghrib_jamaat },
        { label: "Isha", time: today.isha_jamaat },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Prayer Times</h1>
            <p className="text-sm text-muted-foreground">
              Manage the weekly prayer schedule for all five daily prayers.
            </p>
          </div>
        </div>
        <PageActions onNew={openCreate} newLabel="Add Times">
          <Button variant="outline" size="sm" onClick={() => setCopyOpen(true)}>
            <Copy className="h-4 w-4" />
            Copy Schedule
          </Button>
        </PageActions>
      </div>

      {today && (
        <div className="grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {todayCards.map((p) => (
            <div key={p.label} className="rounded-2xl border bg-card p-4 text-center shadow-sm">
              <p className="text-xs font-medium text-muted-foreground">{p.label}</p>
              <p className="mt-1 text-lg font-bold">{formatTime(p.time)}</p>
            </div>
          ))}
        </div>
      )}

      <AdminTableWrapper
        title="Weekly Schedule"
        description="Last 7 days of prayer times"
        empty={data.length === 0}
        emptyTitle="No prayer times yet"
        emptyDescription="Add prayer times for a date to start building the weekly schedule."
        emptyAction={
          <Button size="sm" onClick={openCreate}>
            Add Times
          </Button>
        }
      >
        <DataTable
          columns={[
            {
              key: "date",
              header: "Date",
              cell: (row) => (
                <div className="whitespace-nowrap font-medium">{formatDate(row.date, "EEE, MMM d, yyyy")}</div>
              ),
            },
            {
              key: "fajr",
              header: "Fajr",
              cell: (row) => <div className="whitespace-nowrap text-muted-foreground">{formatTime(row.fajr_jamaat)}</div>,
            },
            {
              key: "sunrise",
              header: "Sunrise",
              cell: (row) => <div className="whitespace-nowrap text-muted-foreground">{formatTime(row.sunrise)}</div>,
            },
            {
              key: "dhuhr",
              header: "Dhuhr",
              cell: (row) => <div className="whitespace-nowrap text-muted-foreground">{formatTime(row.dhuhr_jamaat)}</div>,
            },
            {
              key: "asr",
              header: "Asr",
              cell: (row) => <div className="whitespace-nowrap text-muted-foreground">{formatTime(row.asr_jamaat)}</div>,
            },
            {
              key: "maghrib",
              header: "Maghrib",
              cell: (row) => <div className="whitespace-nowrap text-muted-foreground">{formatTime(row.maghrib_jamaat)}</div>,
            },
            {
              key: "isha",
              header: "Isha",
              cell: (row) => <div className="whitespace-nowrap text-muted-foreground">{formatTime(row.isha_jamaat)}</div>,
            },
            {
              key: "actions",
              header: "",
              className: "text-right",
              cell: (row) => (
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ),
            },
          ]}
          data={data}
        />
      </AdminTableWrapper>

      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title={editDefault.date ? `Prayer Times - ${formatDate(editDefault.date)}` : "Add Prayer Times"}
        description="Set the adhan and jamaat times for this date."
        className="sm:max-w-3xl"
      >
        <form action={handleUpsert} className="space-y-5">
          <FormInput label="Date" name="date" type="date" defaultValue={editDefault.date} required />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TIME_FIELDS.map((field) => (
              <FormInput
                key={field.key}
                label={field.label}
                name={field.key}
                type="time"
                defaultValue={editDefault[field.key]}
                required={field.required}
              />
            ))}
          </div>
          <FormTextarea
            label="Notes"
            name="notes"
            defaultValue={editDefault.notes || ""}
            rows={2}
            placeholder="Optional notes for this date"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <FormSubmitButton loading={upsertPending}>Save Times</FormSubmitButton>
          </div>
        </form>
      </FormDialog>

      <FormDialog
        open={copyOpen}
        onOpenChange={setCopyOpen}
        title="Copy Schedule"
        description="Copy one day&apos;s prayer times to the following days."
      >
        <form action={handleCopy} className="space-y-5">
          <FormInput label="Source Date" name="from_date" type="date" required />
          <FormInput label="Target Date (inclusive)" name="to_date" type="date" required />
          <div className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">
            <p>
              The prayer times from the source date will be applied to every date between the source
              date and the target date (except the source date itself).
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCopyOpen(false)}>
              Cancel
            </Button>
            <FormSubmitButton type="submit" loading={copyPending}>
              Copy Times
            </FormSubmitButton>
          </div>
        </form>
      </FormDialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Prayer Times"
        description={`Delete the prayer times for ${deleteTarget ? formatDate(deleteTarget.date) : ""}? This cannot be undone.`}
        confirmText="Delete"
        loading={deletePending}
      />
    </div>
  );
}

export { PrayerTimesClient };
