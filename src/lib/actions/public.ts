"use server";

import { createClient } from "@/lib/supabase/server";
import { donationSchema, contactRequestSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export type PublicActionState = {
  error?: string | null;
  success?: boolean;
  message?: string;
};

export async function submitPublicDonation(
  _prevState: PublicActionState,
  formData: FormData
): Promise<PublicActionState> {
  const raw = {
    donor_name: formData.get("donor_name") as string,
    donor_phone: (formData.get("donor_phone") as string) || undefined,
    donor_email: (formData.get("donor_email") as string) || undefined,
    fund_id: (formData.get("fund_id") as string) || null,
    amount: formData.get("amount"),
    payment_method: formData.get("payment_method") as string,
    transaction_id: (formData.get("transaction_id") as string) || undefined,
    donation_date: new Date().toISOString().split("T")[0],
    is_anonymous: formData.get("is_anonymous") === "on",
  };

  const parsed = donationSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid submission",
    };
  }

  const supabase = await createClient();

  const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const { error } = await supabase.from("donations").insert({
    donor_name: parsed.data.donor_name,
    donor_phone: parsed.data.donor_phone || null,
    donor_email: parsed.data.donor_email || null,
    fund_id: parsed.data.fund_id || null,
    amount: parsed.data.amount,
    payment_method: parsed.data.payment_method,
    transaction_id: parsed.data.transaction_id || null,
    donation_date: parsed.data.donation_date || new Date().toISOString().split("T")[0],
    is_anonymous: parsed.data.is_anonymous,
    notes: "Submitted via public donation page",
    status: "pending",
    receipt_number: receiptNumber,
  });

  if (error) {
    return { error: "Unable to submit donation. Please try again." };
  }

  revalidatePath("/donate");
  return {
    success: true,
    message:
      "JazakAllahu Khairan! Your donation pledge has been received. An admin will verify and confirm your payment. Please keep your transaction/reference number.",
  };
}

export async function submitContactRequest(
  _prevState: PublicActionState,
  formData: FormData
): Promise<PublicActionState> {
  const raw = {
    name: formData.get("name") as string,
    phone: (formData.get("phone") as string) || undefined,
    email: (formData.get("email") as string) || undefined,
    subject: (formData.get("subject") as string) || undefined,
    request_type: formData.get("request_type") as string,
    message: formData.get("message") as string,
  };

  const parsed = contactRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid submission",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("contact_requests").insert({
    name: parsed.data.name,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    subject: parsed.data.subject || null,
    request_type: parsed.data.request_type,
    message: parsed.data.message,
    status: "new",
  });

  if (error) {
    return { error: "Unable to submit your request. Please try again." };
  }

  return {
    success: true,
    message: "Assalamu Alaikum! Your message has been received. We'll get back to you soon, insha'Allah.",
  };
}
