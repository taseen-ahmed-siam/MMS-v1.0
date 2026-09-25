"use client";

import * as React from "react";
import { useTransition, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faCopy,
  faPen,
  faTrash,
  faStarAndCrescent,
  faSun,
  faCloudSun,
  faMoon,
  faStar,
  faMosque,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  upsertPrayerTimes,
  copyPrayerTimes,
  deletePrayerTimes,
} from "@/lib/actions/admin";
import { PageActions } from "@/components/admin/page-actions";
import { FormDialog } from "@/components/admin/form-dialog";
import {
  FormInput,
  FormTextarea,
  FormSubmitButton,
  ConfirmDialog,
  PageHeader,
} from "@/components/forms";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatTime, cn } from "@/lib/utils/format";
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

const TIME_FIELDS: {
  key: keyof FormValues & string;
  label: string;
  required: boolean;
}[] = [
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

type PrayerKey = "fajr" | "sunrise" | "dhuhr" | "asr" | "maghrib" | "isha";

interface PrayerDef {
  key: PrayerKey;
  name: string;
  icon: IconDefinition;
  adhanKey: keyof PrayerTime;
  jamaatKey: keyof PrayerTime;
}

const PRAYERS: PrayerDef[] = [
  {
    key: "fajr",
    name: "Fajr",
    icon: faStar,
    adhanKey: "fajr_adhan",
    jamaatKey: "fajr_jamaat",
  },
  {
    key: "sunrise",
    name: "Sunrise",
    icon: faSun,
    adhanKey: "sunrise",
    jamaatKey: "sunrise",
  },
  {
    key: "dhuhr",
    name: "Dhuhr",
    icon: faCloudSun,
    adhanKey: "dhuhr_adhan",
    jamaatKey: "dhuhr_jamaat",
  },
  {
    key: "asr",
    name: "Asr",
    icon: faCloudSun,
    adhanKey: "asr_adhan",
    jamaatKey: "asr_jamaat",
  },
  {
    key: "maghrib",
    name: "Maghrib",
    icon: faMoon,
    adhanKey: "maghrib_adhan",
    jamaatKey: "maghrib_jamaat",
  },
  {
    key: "isha",
    name: "Isha",
    icon: faMoon,
    adhanKey: "isha_adhan",
    jamaatKey: "isha_jamaat",
  },
];

const PRAYER_COLS = PRAYERS.filter((p) => p.key !== "sunrise");

function getCurrentPrayerIndex(): number {
  const now = new Date();
  const m = now.getHours() * 60 + now.getMinutes();
  if (m < 360) return 0;
  if (m < 420) return 1;
  if (m < 720) return 2;
  if (m < 1020) return 3;
  if (m < 1200) return 4;
  return 5;
}

function PrayerTimesClient({
  upcoming,
  recent,
  today,
}: {
  upcoming: PrayerTime[];
  recent: PrayerTime[];
  today: PrayerTime | null;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PrayerTime | null>(null);
  const [editDefault, setEditDefault] = useState<FormValues>(defaults());
  const [upsertPending, startUpsert] = useTransition();
  const [copyPending, startCopy] = useTransition();
  const [deletePending, startDelete] = useTransition();

  const currentIdx = useMemo(() => getCurrentPrayerIndex(), []);

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

  const todayStr = today?.date ?? "";

  function renderWeeklyTable(rows: PrayerTime[]) {
    if (rows.length === 0) {
      return (
        <div className="px-5 pb-6 text-center">
          <FontAwesomeIcon
            icon={faMosque}
            className="mb-3 h-10 w-10 text-[#064E3B]/20"
          />
          <p className="text-sm font-medium text-foreground">
            No prayer times yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add prayer times for a date to start building the weekly schedule.
          </p>
          <Button size="sm" className="mt-3" onClick={openCreate}>
            Add Times
          </Button>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[64rem] text-sm lg:min-w-0">
          <thead>
            <tr className="bg-[#064E3B] text-white">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                Date
              </th>
              {PRAYER_COLS.map((prayer) => (
                <th
                  key={prayer.key}
                  className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider"
                >
                  {prayer.name}
                </th>
              ))}
              <th className="w-20 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.05]">
            {rows.map((row) => {
              const isToday = row.date === todayStr;
              return (
                <tr
                  key={row.id}
                  className={cn(
                    "transition-colors hover:bg-[#064E3B]/[0.03]",
                    isToday && "bg-[#C8A951]/[0.06]",
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isToday && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#C8A951]" />
                      )}
                      <div>
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            isToday ? "text-[#064E3B]" : "text-foreground",
                          )}
                        >
                          {formatDate(row.date, "EEE")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(row.date, "MMM d")}
                        </p>
                      </div>
                    </div>
                  </td>
                  {PRAYER_COLS.map((prayer) => {
                    const adhan = row[prayer.adhanKey] as string;
                    const jamaat = row[prayer.jamaatKey] as string;
                    return (
                      <td key={prayer.key} className="px-4 py-3 text-center">
                        <p className="text-sm font-semibold text-foreground">
                          {formatTime(jamaat)}
                        </p>
                        {adhan && adhan !== jamaat && (
                          <p className="text-[11px] text-muted-foreground/60">
                            {formatTime(adhan)}
                          </p>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(row);
                        }}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="Edit"
                      >
                        <FontAwesomeIcon icon={faPen} className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(row);
                        }}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        title="Delete"
                      >
                        <FontAwesomeIcon
                          icon={faTrash}
                          className="h-3.5 w-3.5"
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prayer Times"
        description="Manage the daily prayer schedule — adhan, jamaat, and weekly records."
        icon={faClock}
      >
        <PageActions onNew={openCreate} newLabel="Add Times">
          <Button variant="outline" size="sm" onClick={() => setCopyOpen(true)}>
            <FontAwesomeIcon icon={faCopy} className="mr-1.5 h-3.5 w-3.5" />
            Copy Schedule
          </Button>
        </PageActions>
      </PageHeader>

      {/* Today's Prayer Schedule */}
      {today && (
        <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#C8A951]" />
              <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">
                Today&apos;s Schedule
              </h2>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDate(today.date, "EEEE, MMMM d, yyyy")}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {PRAYERS.map((prayer, i) => {
              const isCurrent = i === currentIdx;
              const jamaatTime = today[prayer.jamaatKey] as string;
              const adhanTime = today[prayer.adhanKey] as string;
              const isSunrise = prayer.key === "sunrise";

              return (
                <div
                  key={prayer.key}
                  className={cn(
                    "relative overflow-hidden rounded-2xl border p-4 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
                    isCurrent
                      ? "border-[#064E3B]/20 bg-[#064E3B]/[0.03] ring-1 ring-[#064E3B]/10"
                      : "border-black/5 bg-white",
                  )}
                >
                  {/* Current dot */}
                  {isCurrent && (
                    <span className="absolute left-2.5 top-2.5 h-2 w-2 rounded-full bg-[#064E3B] animate-pulse" />
                  )}

                  {/* Icon */}
                  <div
                    className={cn(
                      "mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl text-sm ring-1 ring-inset ring-black/5 shadow-sm",
                      isCurrent
                        ? "bg-[#064E3B]/10 text-[#064E3B]"
                        : "bg-[#C8A951]/10 text-[#C8A951]",
                    )}
                  >
                    <FontAwesomeIcon icon={prayer.icon} />
                  </div>

                  {/* Name */}
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {prayer.name}
                  </p>

                  <div className="my-2 h-px w-full bg-black/[0.04]" />

                  {/* Times */}
                  {isSunrise ? (
                    <p className="text-lg font-bold tracking-tight text-foreground">
                      {formatTime(jamaatTime)}
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      <div>
                        <p className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground/60">
                          Adhan
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {formatTime(adhanTime)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground/60">
                          Jamaat
                        </p>
                        <p
                          className={cn(
                            "text-base font-bold",
                            isCurrent ? "text-[#064E3B]" : "text-foreground",
                          )}
                        >
                          {formatTime(jamaatTime)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Weekly Table */}
      <Tabs
        defaultValue="upcoming"
        className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm"
      >
        <div className="flex flex-col gap-3 border-b border-black/[0.05] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#C8A951]" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">
              Weekly Records
            </h2>
          </div>
          <TabsList className="h-auto w-full justify-start bg-[#F4F6F4] p-1 sm:w-auto">
            <TabsTrigger value="upcoming" className="flex-1 sm:flex-none">
              Upcoming 7 Days
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex-1 sm:flex-none">
              Recent 7 Days
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="upcoming" className="mt-0">
          {renderWeeklyTable(upcoming)}
        </TabsContent>
        <TabsContent value="recent" className="mt-0">
          {renderWeeklyTable(recent)}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title={
          editDefault.date
            ? `Prayer Times — ${formatDate(editDefault.date)}`
            : "Add Prayer Times"
        }
        description="Set the adhan and jamaat times for this date."
        className="sm:max-w-3xl"
      >
        <form action={handleUpsert} className="space-y-5">
          <FormInput
            label="Date"
            name="date"
            type="date"
            defaultValue={editDefault.date}
            required
          />
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
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </Button>
            <FormSubmitButton loading={upsertPending}>
              Save Times
            </FormSubmitButton>
          </div>
        </form>
      </FormDialog>

      {/* Copy Dialog */}
      <FormDialog
        open={copyOpen}
        onOpenChange={setCopyOpen}
        title="Copy Schedule"
        description="Copy one day's prayer times to the following days."
      >
        <form action={handleCopy} className="space-y-5">
          <FormInput
            label="Source Date"
            name="from_date"
            type="date"
            required
          />
          <FormInput
            label="Target Date (inclusive)"
            name="to_date"
            type="date"
            required
          />
          <div className="flex items-start gap-3 rounded-xl border border-[#064E3B]/10 bg-[#064E3B]/[0.03] p-4">
            <FontAwesomeIcon
              icon={faStarAndCrescent}
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#064E3B]"
            />
            <p className="text-sm text-muted-foreground">
              Prayer times from the source date will be applied to every date
              between the source and target dates (excluding the source date
              itself).
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCopyOpen(false)}
            >
              Cancel
            </Button>
            <FormSubmitButton type="submit" loading={copyPending}>
              Copy Times
            </FormSubmitButton>
          </div>
        </form>
      </FormDialog>

      {/* Delete Confirmation */}
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
