"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { HandCoins, Copy, Check } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { submitPublicDonation } from "@/lib/actions/public";
import { donationSchema } from "@/lib/validations";
import { FormInput, FormSelect, FormTextarea } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PRESET_DONATION_AMOUNTS, CURRENCY_SYMBOL } from "@/constants";
import type { DonationFund, MosqueSetting } from "@/types/database";

interface DonationFormProps {
  funds: DonationFund[];
  settings?: MosqueSetting | null;
}

type FormValues = z.input<typeof donationSchema>;

export function DonationForm({ funds, settings }: DonationFormProps) {
  const [state, formAction, pending] = useActionState(submitPublicDonation, {});
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(donationSchema) as never,
  });

  const didScroll = useRef(false);
  const [copied, setCopied] = useState(false);

  const paymentMethod = watch("payment_method") as string;

  const methodInfo = (() => {
    switch (paymentMethod) {
      case "bkash":
        return settings?.bkash_number
          ? { title: "bKash Number", value: settings.bkash_number }
          : null;
      case "nagad":
        return settings?.nagad_number
          ? { title: "Nagad Number", value: settings.nagad_number }
          : null;
      case "rocket":
        return settings?.rocket_number
          ? { title: "Rocket Number", value: settings.rocket_number }
          : null;
      case "bank_transfer":
        return settings?.bank_details
          ? { title: "Bank Transfer Details", value: settings.bank_details }
          : null;
      default:
        return null;
    }
  })();

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable
    }
  };

  useEffect(() => {
    if (state.success && !didScroll.current) {
      didScroll.current = true;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [state.success]);

  if (state.success) {
    return (      <div className="text-center py-10">
        <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <HandCoins className="h-8 w-8 text-success" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Donation Submitted</h3>
        <p className="text-muted-foreground">{state.message}</p>
        <Button variant="outline" className="mt-6" onClick={() => window.location.reload()}>
          Make Another Donation
        </Button>
      </div>
    );
  }

  const handlePreset = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
    setValue("amount", amount, { shouldValidate: true });
  };

  const handleCustom = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAmount(e.target.value);
    setSelectedAmount(null);
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      setValue("amount", val, { shouldValidate: true });
    }
  };

  const handleFundChange = (value: string) => setValue("fund_id", value);

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div className="rounded-xl bg-red-50 text-red-700 text-sm p-3 border border-red-200">
          {state.error}
        </div>
      )}

      <FormSelect
        label="Donation Fund"
        name="fund_id"
        value={undefined}
        onValueChange={handleFundChange}
        options={[
          { value: "", label: "General Fund (default)" },
          ...funds.map((f) => ({ value: f.id, label: f.name })),
        ]}
        placeholder="Select a fund (optional)"
      />
      <input type="hidden" {...register("fund_id")} />

      <div>
        <Label>Amount ({CURRENCY_SYMBOL})</Label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-2">
          {PRESET_DONATION_AMOUNTS.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => handlePreset(amt)}
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                selectedAmount === amt
                  ? "border-primary bg-primary text-white"
                  : "border-border hover:border-primary hover:text-primary"
              }`}
            >
              {CURRENCY_SYMBOL}{amt.toLocaleString()}
            </button>
          ))}
        </div>
        <div className="mt-2">
          <Input
            type="number"
            placeholder="Or enter custom amount"
            value={customAmount}
            onChange={handleCustom}
            min={1}
          />
        </div>
        <input type="hidden" {...register("amount")} />
      </div>

      <FormInput
        label="Full Name"
        name="donor_name"
        register={register("donor_name")}
        error={errors.donor_name?.message}
        placeholder="Your name"
        required
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <FormInput
          label="Phone"
          name="donor_phone"
          register={register("donor_phone")}
          error={errors.donor_phone?.message}
          placeholder="01XXXXXXXXX"
        />
        <FormInput
          label="Email"
          name="donor_email"
          register={register("donor_email")}
          error={errors.donor_email?.message}
          placeholder="you@example.com"
          type="email"
        />
      </div>

      <FormSelect
        label="Payment Method"
        name="payment_method"
        value={undefined}
        onValueChange={(v) => setValue("payment_method", v as FormValues["payment_method"])}
        options={[
          { value: "cash", label: "Cash" },
          { value: "bank_transfer", label: "Bank Transfer" },
          { value: "bkash", label: "bKash" },
          { value: "nagad", label: "Nagad" },
          { value: "rocket", label: "Rocket" },
          { value: "card", label: "Card" },
          { value: "other", label: "Other" },
        ]}
        placeholder="Select payment method"
        required
      />
      <input type="hidden" {...register("payment_method")} />

      {methodInfo && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {methodInfo.title}
          </p>
          <button
            type="button"
            onClick={() => handleCopy(methodInfo.value)}
            className="mt-1 flex items-start gap-2 text-left"
            title="Click to copy"
          >
            <span
              className={`text-base font-semibold text-foreground ${
                methodInfo.title === "Bank Transfer Details" ? "text-sm whitespace-pre-line" : ""
              }`}
            >
              {methodInfo.value}
            </span>
            {copied ? (
              <Check className="h-4 w-4 shrink-0 text-success" />
            ) : (
              <Copy className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
          </button>
          <p className="mt-1 text-xs text-muted-foreground">
            Send your donation using this {methodInfo.title.toLowerCase()}, then enter the
            transaction ID below for verification.
          </p>
        </div>
      )}

      <FormInput
        label="Transaction / Reference ID"
        name="transaction_id"
        register={register("transaction_id")}
        placeholder="Transaction ID (optional)"
      />

      <FormTextarea
        label="Notes"
        name="notes"
        register={register("notes")}
        placeholder="Any additional notes (optional)"
        rows={2}
      />

      <label className="flex items-center gap-3 text-sm cursor-pointer">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-input accent-primary"
          checked={anonymous}
          onChange={(e) => setAnonymous(e.target.checked)}
        />
        <span>I would like to donate anonymously</span>
      </label>
      <input type="hidden" name="is_anonymous" value={anonymous ? "on" : ""} />

      <div className="rounded-xl bg-muted p-4 text-xs text-muted-foreground">
        <p>
          This is a manual submission. Your donation will be verified by a mosque administrator.
          Keep your transaction ID for reference. JazakAllahu Khairan for your generosity.
        </p>
      </div>

      <Button type="submit" disabled={pending} className="w-full h-12 text-base" size="lg">
        {pending ? "Submitting..." : `Donate ${CURRENCY_SYMBOL}${(selectedAmount || customAmount || "").toString() || "Now"}`}
      </Button>
    </form>
  );
}
