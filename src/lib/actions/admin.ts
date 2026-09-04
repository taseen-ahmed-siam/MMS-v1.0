"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/utils/audit";
import {
  donationSchema,
  expenseSchema,
  incomeSchema,
  fundSchema,
  memberSchema,
  committeeMemberSchema,
  staffSchema,
  eventSchema,
  announcementSchema,
  khutbahSchema,
  assetSchema,
  maintenanceSchema,
  documentSchema,
  mosqueSettingsSchema,
  zakatCollectionSchema,
  zakatBeneficiarySchema,
  zakatDistributionSchema,
  prayerTimeSchema,
} from "@/lib/validations";
import { slugify } from "@/lib/utils/format";
import { roleHasPermission } from "@/lib/permissions";
import type { Expense } from "@/types/database";

type ActionResult = { error?: string; success?: boolean; id?: string };

async function getCurrentUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

async function getCurrentUserRole(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return profile?.role ?? null;
}

// ============================================================
// DONATIONS
// ============================================================

export async function createDonation(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = donationSchema.safeParse({
    ...raw,
    amount: raw.amount ? Number(raw.amount) : undefined,
    is_anonymous: raw.is_anonymous === "on" || raw.is_anonymous === "true",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const userId = await getCurrentUserId();
  const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const { data, error } = await supabase
    .from("donations")
    .insert({
      ...parsed.data,
      fund_id: parsed.data.fund_id || null,
      receipt_number: receiptNumber,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  logAudit({
    action: "create",
    module: "donation",
    entity: "donation",
    entityId: data?.id,
    newData: parsed.data as unknown as Record<string, unknown>,
  });

  revalidatePath("/admin/donations");
  revalidatePath("/admin");
  return { success: true, id: data?.id };
}

export async function updateDonation(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const id = formData.get("id") as string;
  const raw = Object.fromEntries(formData.entries());
  delete raw.id;
  const parsed = donationSchema.safeParse({
    ...raw,
    amount: raw.amount ? Number(raw.amount) : undefined,
    is_anonymous: raw.is_anonymous === "on" || raw.is_anonymous === "true",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { data: old } = await supabase.from("donations").select("*").eq("id", id).single();

  const { error } = await supabase
    .from("donations")
    .update({ ...parsed.data, fund_id: parsed.data.fund_id || null })
    .eq("id", id);

  if (error) return { error: error.message };

  logAudit({
    action: "update",
    module: "donation",
    entity: "donation",
    entityId: id,
    oldData: old as unknown as Record<string, unknown>,
    newData: parsed.data as unknown as Record<string, unknown>,
  });

  revalidatePath("/admin/donations");
  revalidatePath("/admin");
  return { success: true, id };
}

export async function deleteDonation(formData: FormData) {
  const id = formData.get("id") as string;
  const supabase = await createClient();
  const { data: old } = await supabase.from("donations").select("*").eq("id", id).single();

  const { error } = await supabase
    .from("donations")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };

  logAudit({
    action: "archive",
    module: "donation",
    entity: "donation",
    entityId: id,
    oldData: old as unknown as Record<string, unknown>,
  });

  revalidatePath("/admin/donations");
  revalidatePath("/admin");
  return { success: true };
}

export async function approveDonation(formData: FormData) {
  const actorRole = await getCurrentUserRole();
  if (!roleHasPermission(actorRole, "donation.update")) {
    return { error: "You are not allowed to approve donations" };
  }
  const id = formData.get("id") as string;
  const supabase = await createAdminClient();
  const { data: old } = await supabase.from("donations").select("*").eq("id", id).single();

  const { error } = await supabase
    .from("donations")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  logAudit({
    action: "approve",
    module: "donation",
    entity: "donation",
    entityId: id,
    oldData: old as unknown as Record<string, unknown>,
    newData: { status: "completed" },
  });

  revalidatePath("/admin/donations");
  revalidatePath("/admin");
  return { success: true };
}

export async function rejectDonation(formData: FormData) {
  const actorRole = await getCurrentUserRole();
  if (!roleHasPermission(actorRole, "donation.update")) {
    return { error: "You are not allowed to reject donations" };
  }
  const id = formData.get("id") as string;
  const reason = (formData.get("reason") as string) || "Rejected";
  const supabase = await createAdminClient();
  const { data: old } = await supabase.from("donations").select("*").eq("id", id).single();

  const { error } = await supabase
    .from("donations")
    .update({
      status: "cancelled",
      notes: old?.notes
        ? `${old.notes}\nRejected: ${reason}`
        : `Rejected: ${reason}`,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  logAudit({
    action: "reject",
    module: "donation",
    entity: "donation",
    entityId: id,
    oldData: old as unknown as Record<string, unknown>,
    newData: { status: "cancelled", reason },
  });

  revalidatePath("/admin/donations");
  revalidatePath("/admin");
  return { success: true };
}

// ============================================================
// EXPENSES
// ============================================================

export async function createExpense(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = expenseSchema.safeParse({
    ...raw,
    amount: raw.amount ? Number(raw.amount) : undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("expenses")
    .insert({ ...parsed.data, created_by: userId })
    .select("id")
    .single();

  if (error) return { error: error.message };

  logAudit({
    action: "create",
    module: "expense",
    entity: "expense",
    entityId: data?.id,
    newData: parsed.data as unknown as Record<string, unknown>,
  });

  revalidatePath("/admin/expenses");
  revalidatePath("/admin");
  return { success: true, id: data?.id };
}

export async function updateExpense(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const id = formData.get("id") as string;
  const raw = Object.fromEntries(formData.entries());
  delete raw.id;
  const parsed = expenseSchema.safeParse({
    ...raw,
    amount: raw.amount ? Number(raw.amount) : undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { data: old } = await supabase.from("expenses").select("*").eq("id", id).single();

  const { error } = await supabase.from("expenses").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };

  logAudit({
    action: "update",
    module: "expense",
    entity: "expense",
    entityId: id,
    oldData: old as unknown as Record<string, unknown>,
    newData: parsed.data as unknown as Record<string, unknown>,
  });

  revalidatePath("/admin/expenses");
  return { success: true, id };
}

export async function approveExpense(formData: FormData) {
  const id = formData.get("id") as string;
  const supabase = await createClient();
  const userId = await getCurrentUserId();
  const { data: old } = await supabase.from("expenses").select("*").eq("id", id).single();

  const { error } = await supabase
    .from("expenses")
    .update({ status: "approved", approved_by: userId, approved_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  logAudit({
    action: "approve",
    module: "expense",
    entity: "expense",
    entityId: id,
    oldData: old as unknown as Record<string, unknown>,
    newData: { status: "approved" },
  });

  revalidatePath("/admin/expenses");
  return { success: true };
}

export async function rejectExpense(formData: FormData) {
  const id = formData.get("id") as string;
  const reason = (formData.get("reason") as string) || "Rejected";
  const supabase = await createClient();
  const { data: old } = await supabase.from("expenses").select("*").eq("id", id).single();

  const { error } = await supabase
    .from("expenses")
    .update({ status: "rejected", rejection_reason: reason })
    .eq("id", id);
  if (error) return { error: error.message };

  logAudit({
    action: "reject",
    module: "expense",
    entity: "expense",
    entityId: id,
    oldData: old as unknown as Record<string, unknown>,
    newData: { status: "rejected", reason },
  });

  revalidatePath("/admin/expenses");
  return { success: true };
}

export async function deleteExpense(formData: FormData) {
  const id = formData.get("id") as string;
  const supabase = await createClient();
  const { data: old } = await supabase.from("expenses").select("*").eq("id", id).single();

  const { error } = await supabase
    .from("expenses")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  logAudit({
    action: "archive",
    module: "expense",
    entity: "expense",
    entityId: id,
    oldData: old as unknown as Record<string, unknown>,
  });

  revalidatePath("/admin/expenses");
  return { success: true };
}

// ============================================================
// INCOME
// ============================================================

export async function createIncome(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = incomeSchema.safeParse({
    ...raw,
    amount: raw.amount ? Number(raw.amount) : undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("incomes")
    .insert({ ...parsed.data, created_by: userId })
    .select("id")
    .single();
  if (error) return { error: error.message };

  logAudit({
    action: "create",
    module: "income",
    entity: "income",
    entityId: data?.id,
    newData: parsed.data as unknown as Record<string, unknown>,
  });

  revalidatePath("/admin/income");
  return { success: true, id: data?.id };
}

export async function updateIncome(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const id = formData.get("id") as string;
  const raw = Object.fromEntries(formData.entries());
  delete raw.id;
  const parsed = incomeSchema.safeParse({
    ...raw,
    amount: raw.amount ? Number(raw.amount) : undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { data: old } = await supabase.from("incomes").select("*").eq("id", id).single();
  const { error } = await supabase.from("incomes").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };

  logAudit({
    action: "update",
    module: "income",
    entity: "income",
    entityId: id,
    oldData: old as unknown as Record<string, unknown>,
    newData: parsed.data as unknown as Record<string, unknown>,
  });

  revalidatePath("/admin/income");
  return { success: true, id };
}

export async function deleteIncome(formData: FormData) {
  const id = formData.get("id") as string;
  const supabase = await createClient();
  const { data: old } = await supabase.from("incomes").select("*").eq("id", id).single();
  const { error } = await supabase
    .from("incomes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  logAudit({
    action: "archive",
    module: "income",
    entity: "income",
    entityId: id,
    oldData: old as unknown as Record<string, unknown>,
  });

  revalidatePath("/admin/income");
  return { success: true };
}

// ============================================================
// FUNDS
// ============================================================

export async function createFund(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = fundSchema.safeParse({
    ...raw,
    target_amount: raw.target_amount ? Number(raw.target_amount) : 0,
    is_visible: raw.is_visible === "on",
    featured: raw.featured === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("donation_funds")
    .insert({ ...parsed.data, slug: slugify(parsed.data.name) })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/admin/funds");
  return { success: true, id: data?.id };
}

export async function updateFund(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const id = formData.get("id") as string;
  const raw = Object.fromEntries(formData.entries());
  delete raw.id;
  const parsed = fundSchema.safeParse({
    ...raw,
    target_amount: raw.target_amount ? Number(raw.target_amount) : 0,
    is_visible: raw.is_visible === "on",
    featured: raw.featured === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("donation_funds")
    .update({ ...parsed.data, slug: slugify(parsed.data.name) })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/funds");
  return { success: true, id };
}

export async function deleteFund(formData: FormData) {
  const id = formData.get("id") as string;
  const supabase = await createClient();
  const { error } = await supabase.from("donation_funds").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/funds");
  return { success: true };
}

// ============================================================
// MEMBERS
// ============================================================

export async function createMember(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = memberSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const userId = await getCurrentUserId();
  const memberId = `MEM-${Date.now().toString().slice(-6)}`;
  const { data, error } = await supabase
    .from("members")
    .insert({ ...parsed.data, member_id: memberId, created_by: userId })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/admin/members");
  return { success: true, id: data?.id };
}

export async function updateMember(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const id = formData.get("id") as string;
  const raw = Object.fromEntries(formData.entries());
  delete raw.id;
  const parsed = memberSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.from("members").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/members");
  return { success: true, id };
}

export async function deleteMember(formData: FormData) {
  const id = formData.get("id") as string;
  const supabase = await createClient();
  const { error } = await supabase
    .from("members")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/members");
  return { success: true };
}

// ============================================================
// COMMITTEE
// ============================================================

export async function createCommitteeMember(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = committeeMemberSchema.safeParse({
    ...raw,
    display_order: raw.display_order ? Number(raw.display_order) : 0,
    is_current: raw.is_current === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("committee_members")
    .insert(parsed.data)
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/admin/committee");
  return { success: true, id: data?.id };
}

export async function updateCommitteeMember(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const id = formData.get("id") as string;
  const raw = Object.fromEntries(formData.entries());
  delete raw.id;
  const parsed = committeeMemberSchema.safeParse({
    ...raw,
    display_order: raw.display_order ? Number(raw.display_order) : 0,
    is_current: raw.is_current === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.from("committee_members").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/committee");
  return { success: true, id };
}

export async function deleteCommitteeMember(formData: FormData) {
  const id = formData.get("id") as string;
  const supabase = await createClient();
  const { error } = await supabase.from("committee_members").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/committee");
  return { success: true };
}

// ============================================================
// STAFF
// ============================================================

export async function createStaff(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = staffSchema.safeParse({
    ...raw,
    salary: raw.salary ? Number(raw.salary) : null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const userId = await getCurrentUserId();
  const staffId = `STF-${Date.now().toString().slice(-6)}`;
  const { data, error } = await supabase
    .from("staff")
    .insert({ ...parsed.data, staff_id: staffId, created_by: userId })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/admin/staff");
  return { success: true, id: data?.id };
}

export async function updateStaff(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const id = formData.get("id") as string;
  const raw = Object.fromEntries(formData.entries());
  delete raw.id;
  const parsed = staffSchema.safeParse({
    ...raw,
    salary: raw.salary ? Number(raw.salary) : null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.from("staff").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/staff");
  return { success: true, id };
}

export async function deleteStaff(formData: FormData) {
  const id = formData.get("id") as string;
  const supabase = await createClient();
  const { error } = await supabase
    .from("staff")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/staff");
  return { success: true };
}

// ============================================================
// EVENTS
// ============================================================

export async function createEvent(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = eventSchema.safeParse({
    ...raw,
    capacity: raw.capacity ? Number(raw.capacity) : null,
    registration_enabled: raw.registration_enabled === "on",
    featured: raw.featured === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("events")
    .insert({ ...parsed.data, slug: slugify(parsed.data.title), created_by: userId })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/admin/events");
  return { success: true, id: data?.id };
}

export async function updateEvent(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const id = formData.get("id") as string;
  const raw = Object.fromEntries(formData.entries());
  delete raw.id;
  const parsed = eventSchema.safeParse({
    ...raw,
    capacity: raw.capacity ? Number(raw.capacity) : null,
    registration_enabled: raw.registration_enabled === "on",
    featured: raw.featured === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({ ...parsed.data, slug: slugify(parsed.data.title) })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/events");
  return { success: true, id };
}

export async function deleteEvent(formData: FormData) {
  const id = formData.get("id") as string;
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/events");
  return { success: true };
}

// ============================================================
// ANNOUNCEMENTS
// ============================================================

export async function createAnnouncement(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = announcementSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { data, error } = await (await createClient())
    .from("announcements")
    .insert({ ...parsed.data, created_by: await getCurrentUserId() })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/admin/announcements");
  revalidatePath("/");
  return { success: true, id: data?.id };
}

export async function updateAnnouncement(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const id = formData.get("id") as string;
  const raw = Object.fromEntries(formData.entries());
  delete raw.id;
  const parsed = announcementSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { error } = await (await createClient())
    .from("announcements")
    .update(parsed.data)
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/announcements");
  revalidatePath("/");
  return { success: true, id };
}

export async function deleteAnnouncement(formData: FormData) {
  const id = formData.get("id") as string;
  const { error } = await (await createClient()).from("announcements").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/announcements");
  return { success: true };
}

// ============================================================
// KHUTBAH
// ============================================================

export async function createKhutbah(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = khutbahSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { data, error } = await (await createClient())
    .from("khutbahs")
    .insert({ ...parsed.data, slug: slugify(parsed.data.title), created_by: await getCurrentUserId() })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/admin/khutbah");
  return { success: true, id: data?.id };
}

export async function updateKhutbah(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const id = formData.get("id") as string;
  const raw = Object.fromEntries(formData.entries());
  delete raw.id;
  const parsed = khutbahSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { error } = await (await createClient())
    .from("khutbahs")
    .update({ ...parsed.data, slug: slugify(parsed.data.title) })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/khutbah");
  return { success: true, id };
}

export async function deleteKhutbah(formData: FormData) {
  const id = formData.get("id") as string;
  const { error } = await (await createClient()).from("khutbahs").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/khutbah");
  return { success: true };
}

// ============================================================
// ASSETS
// ============================================================

export async function createAsset(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = assetSchema.safeParse({
    ...raw,
    quantity: raw.quantity ? Number(raw.quantity) : 1,
    purchase_cost: raw.purchase_cost ? Number(raw.purchase_cost) : null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { data, error } = await (await createClient())
    .from("assets")
    .insert({
      ...parsed.data,
      asset_id: `AST-${Date.now().toString().slice(-6)}`,
      created_by: await getCurrentUserId(),
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/admin/assets");
  return { success: true, id: data?.id };
}

export async function updateAsset(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const id = formData.get("id") as string;
  const raw = Object.fromEntries(formData.entries());
  delete raw.id;
  const parsed = assetSchema.safeParse({
    ...raw,
    quantity: raw.quantity ? Number(raw.quantity) : 1,
    purchase_cost: raw.purchase_cost ? Number(raw.purchase_cost) : null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { error } = await (await createClient()).from("assets").update(parsed.data).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/assets");
  return { success: true, id };
}

export async function deleteAsset(formData: FormData) {
  const id = formData.get("id") as string;
  const { error } = await (await createClient()).from("assets").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/assets");
  return { success: true };
}

// ============================================================
// MAINTENANCE
// ============================================================

export async function createMaintenance(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = maintenanceSchema.safeParse({
    ...raw,
    asset_id: raw.asset_id || null,
    estimated_cost: raw.estimated_cost ? Number(raw.estimated_cost) : null,
    actual_cost: raw.actual_cost ? Number(raw.actual_cost) : null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { data, error } = await (await createClient())
    .from("maintenance_requests")
    .insert({
      ...parsed.data,
      ticket_id: `MNT-${Date.now().toString().slice(-6)}`,
      created_by: await getCurrentUserId(),
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/admin/maintenance");
  return { success: true, id: data?.id };
}

export async function updateMaintenance(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const id = formData.get("id") as string;
  const raw = Object.fromEntries(formData.entries());
  delete raw.id;
  const parsed = maintenanceSchema.safeParse({
    ...raw,
    asset_id: raw.asset_id || null,
    estimated_cost: raw.estimated_cost ? Number(raw.estimated_cost) : null,
    actual_cost: raw.actual_cost ? Number(raw.actual_cost) : null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { error } = await (await createClient())
    .from("maintenance_requests")
    .update(parsed.data)
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/maintenance");
  return { success: true, id };
}

export async function deleteMaintenance(formData: FormData) {
  const id = formData.get("id") as string;
  const { error } = await (await createClient()).from("maintenance_requests").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/maintenance");
  return { success: true };
}

// ============================================================
// DOCUMENTS
// ============================================================

export async function createDocument(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = documentSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const fileUrl = (raw.file_url as string) || "";
  const { data, error } = await (await createClient())
    .from("documents")
    .insert({ ...parsed.data, file_url: fileUrl, uploaded_by: await getCurrentUserId() })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/admin/documents");
  return { success: true, id: data?.id };
}

export async function deleteDocument(formData: FormData) {
  const id = formData.get("id") as string;
  const { error } = await (await createClient()).from("documents").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/documents");
  return { success: true };
}

// ============================================================
// CONTACT REQUESTS
// ============================================================

export async function updateContactRequestStatus(formData: FormData) {
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;
  const notes = (formData.get("notes") as string) || null;

  const { error } = await (await createClient())
    .from("contact_requests")
    .update({ status, notes })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/requests");
  return { success: true };
}

export async function deleteContactRequest(formData: FormData) {
  const id = formData.get("id") as string;
  const { error } = await (await createClient()).from("contact_requests").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/requests");
  return { success: true };
}

// ============================================================
// PRAYER TIMES
// ============================================================

export async function upsertPrayerTimes(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = prayerTimeSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;

  const supabase = await createClient();
  const row = {
    fajr_adhan: data.fajr_adhan,
    fajr_jamaat: data.fajr_jamaat,
    sunrise: data.sunrise,
    dhuhr_adhan: data.dhuhr_adhan,
    dhuhr_jamaat: data.dhuhr_jamaat,
    asr_adhan: data.asr_adhan,
    asr_jamaat: data.asr_jamaat,
    maghrib_adhan: data.maghrib_adhan,
    maghrib_jamaat: data.maghrib_jamaat,
    isha_adhan: data.isha_adhan,
    isha_jamaat: data.isha_jamaat,
    notes: data.notes || null,
    manual_override: true,
  };

  const { data: existing } = await supabase
    .from("prayer_times")
    .select("id")
    .eq("date", data.date)
    .maybeSingle();

  let error;
  if (existing) {
    ({ error } = await supabase.from("prayer_times").update(row).eq("id", existing.id));
  } else {
    ({ error } = await supabase.from("prayer_times").insert({ date: data.date, ...row }));
  }
  if (error) return { error: error.message };

  logAudit({
    action: "upsert",
    module: "prayer",
    entity: "prayer_time",
    entityId: existing?.id,
    newData: row as unknown as Record<string, unknown>,
  });

  revalidatePath("/admin/prayer-times");
  revalidatePath("/prayer-times");
  return { success: true };
}

export async function copyPrayerTimes(formData: FormData) {
  const fromDate = formData.get("from_date") as string;
  const toDate = formData.get("to_date") as string;
  const supabase = await createClient();

  const { data: source } = await supabase
    .from("prayer_times")
    .select("*")
    .eq("date", fromDate)
    .maybeSingle();
  if (!source) return { error: `No prayer times found for ${fromDate}` };

  const from = new Date(fromDate + "T00:00:00");
  const to = new Date(toDate + "T00:00:00");
  const daysToCopy = Math.ceil((to.getTime() - from.getTime()) / 86400000);

  const rows = [];
  for (let i = 1; i <= daysToCopy; i++) {
    const d = new Date(from.getTime() + i * 86400000);
    const dateStr = d.toISOString().split("T")[0];
    rows.push({
      date: dateStr,
      fajr_adhan: source.fajr_adhan,
      fajr_jamaat: source.fajr_jamaat,
      sunrise: source.sunrise,
      dhuhr_adhan: source.dhuhr_adhan,
      dhuhr_jamaat: source.dhuhr_jamaat,
      asr_adhan: source.asr_adhan,
      asr_jamaat: source.asr_jamaat,
      maghrib_adhan: source.maghrib_adhan,
      maghrib_jamaat: source.maghrib_jamaat,
      isha_adhan: source.isha_adhan,
      isha_jamaat: source.isha_jamaat,
      manual_override: true,
    });
  }

  if (rows.length) {
    const { error } = await supabase.from("prayer_times").upsert(rows, { onConflict: "date" });
    if (error) return { error: error.message };
  }

  logAudit({
    action: "copy",
    module: "prayer",
    entity: "prayer_time",
    newData: { from: fromDate, to: toDate, count: rows.length },
  });

  revalidatePath("/admin/prayer-times");
  return { success: true, message: `Copied ${rows.length} days` };
}

export async function deletePrayerTimes(formData: FormData) {
  const id = formData.get("id") as string;
  const supabase = await createClient();
  const { error } = await supabase.from("prayer_times").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/prayer-times");
  return { success: true };
}

// ============================================================
// SETTINGS
// ============================================================

export async function updateSettings(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const actorRole = await getCurrentUserRole();
  if (!roleHasPermission(actorRole, "settings.manage")) {
    return { error: "You are not allowed to change settings" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = mosqueSettingsSchema.safeParse({
    ...raw,
    hijri_adjustment: raw.hijri_adjustment ? Number(raw.hijri_adjustment) : 0,
    manual_override: raw.manual_override === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = createAdminClient();
  const { data: existing } = await supabase.from("mosque_settings").select("id").limit(1).maybeSingle();

  let error;
  if (existing) {
    ({ error } = await supabase.from("mosque_settings").update(parsed.data).eq("id", existing.id));
  } else {
    ({ error } = await supabase.from("mosque_settings").insert(parsed.data));
  }
  if (error) return { error: error.message };

  logAudit({ action: "update", module: "settings", entity: "mosque_settings" });
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  return { success: true };
}

// ============================================================
// ZAKAT
// ============================================================

export async function createZakatCollection(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = zakatCollectionSchema.safeParse({
    ...raw,
    amount: raw.amount ? Number(raw.amount) : undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { data, error } = await (await createClient())
    .from("zakat_collections")
    .insert({ ...parsed.data, created_by: await getCurrentUserId() })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/admin/zakat");
  return { success: true, id: data?.id };
}

export async function createZakatBeneficiary(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = zakatBeneficiarySchema.safeParse({
    ...raw,
    family_size: raw.family_size ? Number(raw.family_size) : null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { data, error } = await (await createClient())
    .from("zakat_beneficiaries")
    .insert({ ...parsed.data, created_by: await getCurrentUserId() })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/admin/zakat");
  return { success: true, id: data?.id };
}

export async function createZakatDistribution(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = zakatDistributionSchema.safeParse({
    ...raw,
    amount: raw.amount ? Number(raw.amount) : undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { data, error } = await (await createClient())
    .from("zakat_distributions")
    .insert({ ...parsed.data, created_by: await getCurrentUserId() })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/admin/zakat");
  return { success: true, id: data?.id };
}

// ============================================================
// USERS & ROLES
// ============================================================

export async function createUserAccount(formData: FormData) {
  const actorRole = await getCurrentUserRole();
  if (actorRole !== "super_admin") {
    return { error: "Only the Super Admin can create accounts" };
  }

  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const fullName = (formData.get("full_name") as string)?.trim() || email?.split("@")?.[0];
  const role = (formData.get("role") as string) || "member";

  if (!email || !password) return { error: "Email and password are required" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Please enter a valid email" };
  if (password.length < 6) return { error: "Password must be at least 6 characters" };

  const supabase = await createAdminClient();

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) return { error: error.message };
  if (!data.user) return { error: "Failed to create user" };

  if (role && role !== "member") {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", data.user.id);
    if (profileError) {
      logAudit({
        action: "create",
        module: "users",
        entity: "user",
        entityId: data.user.id,
        newData: { email, role: "member" },
        oldData: null,
      });
      revalidatePath("/admin/users");
      return { success: true, id: data.user.id };
    }
  }

  logAudit({
    action: "create",
    module: "users",
    entity: "user",
    entityId: data.user.id,
    newData: { email, role },
  });

  revalidatePath("/admin/users");
  return { success: true, id: data.user.id };
}

export async function updateUserRole(formData: FormData) {
  const actorRole = await getCurrentUserRole();
  if (!actorRole || !["super_admin", "admin"].includes(actorRole)) {
    return { error: "You are not allowed to change roles" };
  }

  const userId = formData.get("id") as string;
  const role = formData.get("role") as string;
  if (role === "super_admin" && actorRole !== "super_admin") {
    return { error: "Only the Super Admin can assign the Super Admin role" };
  }
  const supabase = await createClient();

  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) return { error: error.message };

  logAudit({
    action: "update",
    module: "users",
    entity: "profile",
    entityId: userId,
    newData: { role },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function toggleUserStatus(formData: FormData) {
  const actorRole = await getCurrentUserRole();
  if (!actorRole || !["super_admin", "admin"].includes(actorRole)) {
    return { error: "You are not allowed to change user status" };
  }

  const userId = formData.get("id") as string;
  const status = formData.get("status") as string;
  const supabase = await createClient();
  if (actorRole !== "super_admin") {
    const { data: target } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();
    if (target?.role === "super_admin" || target?.role === "admin") {
      return { error: "Only the Super Admin can change this user's status" };
    }
  }

  const { error } = await supabase.from("profiles").update({ status }).eq("id", userId);
  if (error) return { error: error.message };

  logAudit({
    action: "update",
    module: "users",
    entity: "profile",
    entityId: userId,
    newData: { status },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function saveRolePermissions(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const roleId = formData.get("role_id") as string;
  const permissionIds = formData.getAll("permissions") as string[];
  const supabase = await createClient();

  const { error: delErr } = await supabase
    .from("role_permissions")
    .delete()
    .eq("role_id", roleId);
  if (delErr) return { error: delErr.message };

  if (permissionIds.length) {
    const { error: insErr } = await supabase.from("role_permissions").insert(
      permissionIds.map((pid) => ({ role_id: roleId, permission_id: pid }))
    );
    if (insErr) return { error: insErr.message };
  }

  logAudit({
    action: "update",
    module: "roles",
    entity: "role_permissions",
    entityId: roleId,
    newData: { permissions: permissionIds },
  });

  revalidatePath("/admin/roles");
  return { success: true };
}
