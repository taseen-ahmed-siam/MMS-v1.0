"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMosque,
  faGlobeAsia,
  faHandHoldingHeart,
} from "@fortawesome/free-solid-svg-icons";
import { updateSettings } from "@/lib/actions/admin";
import { mosqueSettingsSchema } from "@/lib/validations";
import {
  FormInput,
  FormTextarea,
  FormSubmitButton,
  PageHeader,
} from "@/components/forms";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { MosqueSetting } from "@/types/database";

type SettingsFormValues = z.input<typeof mosqueSettingsSchema>;
type ActionResult = { error?: string; success?: boolean; id?: string };

function toFormValues(settings?: MosqueSetting | null): SettingsFormValues {
  return {
    mosque_name: settings?.mosque_name || "",
    arabic_name: settings?.arabic_name || "",
    address: settings?.address || "",
    phone: settings?.phone || "",
    email: settings?.email || "",
    website: settings?.website || "",
    facebook: settings?.facebook || "",
    youtube: settings?.youtube || "",
    google_maps_url: settings?.google_maps_url || "",
    currency: settings?.currency || "BDT",
    timezone: settings?.timezone || "Asia/Dhaka",
    hijri_adjustment: settings?.hijri_adjustment ?? 0,
    footer_text: settings?.footer_text || "",
    prayer_calculation_method: settings?.prayer_calculation_method || "",
    prayer_madhab: settings?.prayer_madhab || "",
    manual_override: settings?.manual_override ?? true,
    donation_instructions: settings?.donation_instructions || "",
    bank_details: settings?.bank_details || "",
    bkash_number: settings?.bkash_number || "",
    nagad_number: settings?.nagad_number || "",
    rocket_number: settings?.rocket_number || "",
  };
}

function SettingsClient({ settings }: { settings: MosqueSetting | null }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(mosqueSettingsSchema) as never,
    values: toFormValues(settings),
  });

  const [manualOverride, setManualOverride] = useState<boolean>(
    settings?.manual_override ?? true
  );

  async function onSubmit(values: SettingsFormValues) {
    setPending(true);
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      formData.set(key, String(value ?? ""));
    });
    formData.set("manual_override", manualOverride ? "on" : "");
    const result = await updateSettings({} as ActionResult, formData);
    setPending(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Settings saved");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-full flex-col space-y-6">
      <PageHeader
        title="Mosque Settings"
        description="Configure the mosque&apos;s identity, prayer, and donation information."
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex max-w-4xl flex-1 flex-col space-y-6"
      >
        <div className="space-y-5 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold">
            <FontAwesomeIcon icon={faMosque} className="text-[#064E3B]" />
            Mosque Identity
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              label="Mosque Name"
              name="mosque_name"
              register={register("mosque_name")}
              error={errors.mosque_name?.message}
              required
            />
            <FormInput
              label="Arabic Name"
              name="arabic_name"
              register={register("arabic_name")}
              placeholder="الجامع"
            />
          </div>
          <FormTextarea
            label="Address"
            name="address"
            register={register("address")}
            rows={2}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput label="Phone" name="phone" register={register("phone")} />
            <FormInput label="Email" name="email" type="email" register={register("email")} error={errors.email?.message} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput label="Website" name="website" register={register("website")} />
            <FormInput label="Facebook URL" name="facebook" register={register("facebook")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput label="YouTube URL" name="youtube" register={register("youtube")} />
            <FormInput label="Google Maps URL" name="google_maps_url" register={register("google_maps_url")} />
          </div>
        </div>

        <div className="space-y-5 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold">
            <FontAwesomeIcon icon={faGlobeAsia} className="text-[#064E3B]" />
            Regional & Prayer Settings
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput label="Currency (ISO code)" name="currency" register={register("currency")} />
            <FormInput label="Timezone" name="timezone" register={register("timezone")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Hijri Date Adjustment (days)</Label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                type="number"
                step="1"
                {...register("hijri_adjustment")}
              />
              {errors.hijri_adjustment && (
                <p className="text-sm font-medium text-destructive">{errors.hijri_adjustment.message}</p>
              )}
            </div>
            <FormInput
              label="Prayer Calculation Method"
              name="prayer_calculation_method"
              register={register("prayer_calculation_method")}
              placeholder="e.g. University of Islamic Sciences"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              label="Prayer Madhab"
              name="prayer_madhab"
              register={register("prayer_madhab")}
              placeholder="e.g. Hanafi"
            />
            <div className="flex items-center justify-between rounded-xl border bg-muted/40 px-4 py-3">
              <div>
                <Label>Manual Time Override</Label>
                <p className="text-xs text-muted-foreground">Use manually entered prayer times.</p>
              </div>
              <Switch
                checked={!!manualOverride}
                onCheckedChange={(checked) => setManualOverride(checked)}
              />
            </div>
          </div>
          <FormTextarea
            label="Footer Text"
            name="footer_text"
            register={register("footer_text")}
            rows={2}
          />
        </div>

        <div className="flex flex-1 flex-col space-y-5 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold">
            <FontAwesomeIcon icon={faHandHoldingHeart} className="text-[#064E3B]" />
            Donation Information
          </h2>
          <FormTextarea
            label="Donation Instructions"
            name="donation_instructions"
            register={register("donation_instructions")}
            rows={3}
          />
          <FormTextarea
            label="Bank Details"
            name="bank_details"
            register={register("bank_details")}
            rows={2}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <FormInput label="bKash Number" name="bkash_number" register={register("bkash_number")} />
            <FormInput label="Nagad Number" name="nagad_number" register={register("nagad_number")} />
            <FormInput label="Rocket Number" name="rocket_number" register={register("rocket_number")} />
          </div>
        </div>

        <div className="mt-auto flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.refresh()}>
            Reset
          </Button>
          <FormSubmitButton loading={pending}>Save Settings</FormSubmitButton>
        </div>
      </form>
    </div>
  );
}

export { SettingsClient };
