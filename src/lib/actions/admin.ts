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
  eventMemberBulkSchema,
  eventMemberAmountSchema,
  reminderEmailSchema,
  bulkReminderSchema,
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
import { getCurrentAccess, isAdminRole } from "@/lib/access";
import { buildReminderHtml, sendReminderEmail } from "@/lib/email";
import {
  findUnknownPlaceholders,
  isDeliverableEmail,
  renderReminderTemplate,
} from "@/lib/reminders";
import type {
  BulkReminderRecipientResult,
  ContributionReminderEmailInsert,
  Expense,
} from "@/types/database";

type ActionResult = { error?: string; success?: boolean; id?: string; warning?: string };

const emptyToNull = (v: string | undefined | null): string | null | undefined =>
  v === "" ? null : v;

async function ensureUniqueSlug(
  table: "events" | "khutbahs",
  baseSlug: string,
  excludeId?: string
): Promise<string> {
  const base = baseSlug || "-";
  const supabase = await createClient();
  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("slug", base)
    .neq("id", excludeId ?? "");
  if (!count) return base;
  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
}

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
  const access = await getCurrentAccess();
  if (!access.has("donation.create")) {
    return { error: "You are not allowed to create donations" };
  }

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
      // The form always sends member_id, as "" when no member was picked. An
      // empty string passes `z.string()` but is not a valid uuid, so it has to
      // become NULL rather than being handed to Postgres.
      member_id: parsed.data.member_id || null,
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
  revalidatePath("/admin/funds");
  revalidatePath("/admin");
  return { success: true, id: data?.id };
}

export async function updateDonation(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const access = await getCurrentAccess();
  if (!access.has("donation.update")) {
    return { error: "You are not allowed to update donations" };
  }

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
    .update({
      ...parsed.data,
      fund_id: parsed.data.fund_id || null,
      // Same normalisation as create: "" means "no member", and is what the form
      // sends when the admin clears an existing link.
      member_id: parsed.data.member_id || null,
    })
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
  revalidatePath("/admin/funds");
  revalidatePath("/admin");
  return { success: true, id };
}

export async function deleteDonation(formData: FormData) {
  const access = await getCurrentAccess();
  if (!access.has("donation.delete")) {
    return { error: "You are not allowed to delete donations" };
  }

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
  revalidatePath("/admin/funds");
  revalidatePath("/admin");
  return { success: true };
}

export async function approveDonation(formData: FormData) {
  const access = await getCurrentAccess();
  if (!access.has("donation.update")) {
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
  revalidatePath("/admin/funds");
  revalidatePath("/admin");
  return { success: true };
}

export async function rejectDonation(formData: FormData) {
  const access = await getCurrentAccess();
  if (!access.has("donation.update")) {
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
  revalidatePath("/admin/funds");
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
  const access = await getCurrentAccess();
  if (!access.has("expense.create")) {
    return { error: "You are not allowed to create expenses" };
  }

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
  const access = await getCurrentAccess();
  if (!access.has("expense.update")) {
    return { error: "You are not allowed to update expenses" };
  }

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
  const access = await getCurrentAccess();
  if (!access.has("expense.approve")) {
    return { error: "You are not allowed to approve expenses" };
  }

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
  const access = await getCurrentAccess();
  if (!access.has("expense.approve")) {
    return { error: "You are not allowed to reject expenses" };
  }

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
  const access = await getCurrentAccess();
  if (!access.has("expense.delete")) {
    return { error: "You are not allowed to delete expenses" };
  }

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
  const access = await getCurrentAccess();
  if (!access.has("income.manage")) {
    return { error: "You do not have permission to perform this action." };
  }

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
  const access = await getCurrentAccess();
  if (!access.has("income.manage")) {
    return { error: "You do not have permission to perform this action." };
  }

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
  const access = await getCurrentAccess();
  if (!access.has("income.manage")) {
    return { error: "You do not have permission to perform this action." };
  }

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
  const access = await getCurrentAccess();
  if (!access.has("fund.manage")) {
    return { error: "You do not have permission to perform this action." };
  }

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
  revalidatePath("/");
  return { success: true, id: data?.id };
}

export async function updateFund(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const access = await getCurrentAccess();
  if (!access.has("fund.manage")) {
    return { error: "You do not have permission to perform this action." };
  }

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
  revalidatePath("/");
  return { success: true, id };
}

export async function deleteFund(formData: FormData) {
  const id = formData.get("id") as string;
  const supabase = await createClient();
  const { error } = await supabase.from("donation_funds").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/funds");
  revalidatePath("/");
  return { success: true };
}

// ============================================================
// MEMBERS
// ============================================================

export async function createMember(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const access = await getCurrentAccess();
  if (!access.has("member.create")) {
    return { error: "You are not allowed to create member records" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = memberSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const userId = await getCurrentUserId();
  const linkUserId = (formData.get("user_id") as string)?.trim() || null;
  const memberId = `MEM-${Date.now().toString().slice(-6)}`;
  const { data, error } = await supabase
    .from("members")
    .insert({
      ...parsed.data,
      member_id: memberId,
      created_by: userId,
      ...(linkUserId ? { user_id: linkUserId } : {}),
    })
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
  const access = await getCurrentAccess();
  if (!access.has("member.update")) {
    return { error: "You are not allowed to update member records" };
  }

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
  const access = await getCurrentAccess();
  if (!access.has("member.update")) {
    return { error: "You are not allowed to delete member records" };
  }

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
  const access = await getCurrentAccess();
  if (!access.has("committee.manage")) {
    return { error: "You do not have permission to perform this action." };
  }

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
  const access = await getCurrentAccess();
  if (!access.has("committee.manage")) {
    return { error: "You do not have permission to perform this action." };
  }

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
  const access = await getCurrentAccess();
  if (!access.has("staff.manage")) {
    return { error: "You are not allowed to create staff records" };
  }

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
  const access = await getCurrentAccess();
  if (!access.has("staff.manage")) {
    return { error: "You are not allowed to update staff records" };
  }

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
  const access = await getCurrentAccess();
  if (!access.has("staff.manage")) {
    return { error: "You are not allowed to delete staff records" };
  }

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
  const access = await getCurrentAccess();
  if (!access.has("event.manage")) {
    return { error: "You are not allowed to create events" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = eventSchema.safeParse({
    ...raw,
    capacity: raw.capacity ? Number(raw.capacity) : null,
    contribution_amount: emptyToNull(raw.contribution_amount as string)
      ? Number(raw.contribution_amount)
      : null,
    registration_enabled: raw.registration_enabled === "on",
    featured: raw.featured === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("events")
    .insert({
      ...parsed.data,
      end_date: emptyToNull(parsed.data.end_date),
      start_time: emptyToNull(parsed.data.start_time),
      end_time: emptyToNull(parsed.data.end_time),
      contribution_start_date: emptyToNull(parsed.data.contribution_start_date),
      contribution_due_date: emptyToNull(parsed.data.contribution_due_date),
      slug: await ensureUniqueSlug("events", slugify(parsed.data.title)),
      created_by: userId,
    })
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
  const access = await getCurrentAccess();
  if (!access.has("event.manage")) {
    return { error: "You are not allowed to update events" };
  }

  const id = formData.get("id") as string;
  const raw = Object.fromEntries(formData.entries());
  delete raw.id;
  const parsed = eventSchema.safeParse({
    ...raw,
    capacity: raw.capacity ? Number(raw.capacity) : null,
    contribution_amount: emptyToNull(raw.contribution_amount as string)
      ? Number(raw.contribution_amount)
      : null,
    registration_enabled: raw.registration_enabled === "on",
    featured: raw.featured === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({
      ...parsed.data,
      end_date: emptyToNull(parsed.data.end_date),
      start_time: emptyToNull(parsed.data.start_time),
      end_time: emptyToNull(parsed.data.end_time),
      contribution_start_date: emptyToNull(parsed.data.contribution_start_date),
      contribution_due_date: emptyToNull(parsed.data.contribution_due_date),
slug: await ensureUniqueSlug("events", slugify(parsed.data.title), id),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/events");
  return { success: true, id };
}

export async function deleteEvent(formData: FormData) {
  const access = await getCurrentAccess();
  if (!access.has("event.manage")) {
    return { error: "You are not allowed to delete events" };
  }

  const id = formData.get("id") as string;
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/events");
  return { success: true };
}

// ============================================================
// EVENT CONTRIBUTION TRACKING
// ============================================================

/**
 * Assign members to an event. The amount comes from the event's per-head
 * contribution unless the admin overrides it here, and `onConflict` ignores
 * members that are already assigned so a double submit cannot fail the batch.
 */
export async function addEventMembers(formData: FormData) {
  const access = await getCurrentAccess();
  if (!access.has("event.manage")) {
    return { error: "You are not allowed to manage event members" };
  }

  const parsed = eventMemberBulkSchema.safeParse({
    event_id: formData.get("event_id"),
    member_ids: formData.getAll("member_ids").map(String).filter(Boolean),
    assigned_amount: emptyToNull(formData.get("assigned_amount") as string),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createAdminClient();
  const userId = await getCurrentUserId();

  const { data: event } = await supabase
    .from("events")
    .select("contribution_amount")
    .eq("id", parsed.data.event_id)
    .maybeSingle();

  const assignedAmount =
    parsed.data.assigned_amount ?? Number(event?.contribution_amount ?? 0) ?? 0;

  const { data, error } = await supabase
    .from("event_members")
    .upsert(
      parsed.data.member_ids.map((memberId) => ({
        event_id: parsed.data.event_id,
        member_id: memberId,
        assigned_amount: assignedAmount,
        created_by: userId,
      })),
      { onConflict: "event_id,member_id", ignoreDuplicates: true }
    )
    .select("member_id");

  if (error) return { error: error.message };

  const addedCount = data?.length ?? 0;

  logAudit({
    action: "add_members",
    module: "event",
    entity: "event_members",
    entityId: parsed.data.event_id,
    newData: { member_ids: parsed.data.member_ids, assigned_amount: assignedAmount },
  });

  revalidatePath(`/admin/events/${parsed.data.event_id}`);
  revalidatePath("/admin/events");

  return {
    success: true,
    count: addedCount,
    message:
      addedCount > 0
        ? `${addedCount} member${addedCount === 1 ? "" : "s"} assigned`
        : "Those members are already assigned to this event",
  };
}

/** Remove an assignment. Already-approved payments are never touched. */
export async function removeEventMember(formData: FormData) {
  const access = await getCurrentAccess();
  if (!access.has("event.manage")) {
    return { error: "You are not allowed to manage event members" };
  }

  const eventId = String(formData.get("event_id") ?? "");
  const memberId = String(formData.get("member_id") ?? "");
  if (!eventId || !memberId) return { error: "Missing event or member" };

  const supabase = await createAdminClient();
  const { data: existing } = await supabase
    .from("event_members")
    .select("id, assigned_amount")
    .eq("event_id", eventId)
    .eq("member_id", memberId)
    .maybeSingle();

  const { error } = await supabase
    .from("event_members")
    .delete()
    .eq("event_id", eventId)
    .eq("member_id", memberId);
  if (error) return { error: error.message };

  logAudit({
    action: "remove_member",
    module: "event",
    entity: "event_members",
    entityId: existing?.id,
    oldData: { event_id: eventId, member_id: memberId, assigned_amount: existing?.assigned_amount },
  });

  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath("/admin/events");
  return { success: true };
}

/** Per-member override of the default per-head amount (e.g. a family giving double). */
export async function updateEventMemberAmount(formData: FormData) {
  const access = await getCurrentAccess();
  if (!access.has("event.manage")) {
    return { error: "You are not allowed to manage event members" };
  }

  const parsed = eventMemberAmountSchema.safeParse({
    event_id: formData.get("event_id"),
    member_id: formData.get("member_id"),
    assigned_amount: formData.get("assigned_amount"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createAdminClient();
  const { data: old, error: readError } = await supabase
    .from("event_members")
    .select("assigned_amount")
    .eq("event_id", parsed.data.event_id)
    .eq("member_id", parsed.data.member_id)
    .maybeSingle();
  if (readError) return { error: readError.message };

  // An assignment only exists if the member was assigned to this event. Without
  // this check a tampered member_id updates zero rows yet still reports success
  // and writes an audit row for a change that never happened.
  if (!old) {
    return { error: "This member is not assigned to the event." };
  }

  const { data: updated, error } = await supabase
    .from("event_members")
    .update({ assigned_amount: parsed.data.assigned_amount })
    .eq("event_id", parsed.data.event_id)
    .eq("member_id", parsed.data.member_id)
    .select("assigned_amount")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!updated) return { error: "Unable to save the amount. Please try again." };

  logAudit({
    action: "update_member_amount",
    module: "event",
    entity: "event_members",
    entityId: `${parsed.data.event_id}:${parsed.data.member_id}`,
    oldData: {
      event_id: parsed.data.event_id,
      member_id: parsed.data.member_id,
      assigned_amount: old.assigned_amount,
    },
    newData: {
      event_id: parsed.data.event_id,
      member_id: parsed.data.member_id,
      assigned_amount: updated.assigned_amount,
    },
  });

  revalidatePath(`/admin/events/${parsed.data.event_id}`);
  return { success: true, member_id: parsed.data.member_id, assigned_amount: parsed.data.assigned_amount };
}

/**
 * Send a contribution reminder to one assigned member.
 *
 * Everything that reaches the member is re-derived server-side from the event
 * and the member row: the recipient address, the assigned amount, the paid
 * amount (approved donations only) and the due date. The admin only controls the
 * subject and the message wording, so a tampered form cannot leak another
 * member's figures or redirect the mail.
 */
export async function sendContributionReminder(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const access = await getCurrentAccess();
  if (!access.has("event.manage")) {
    return { error: "You are not allowed to send contribution reminders" };
  }

  const eventId = String(formData.get("event_id") ?? "");
  const memberId = String(formData.get("member_id") ?? "");
  if (!eventId || !memberId) return { error: "Missing event or member" };

  const supabase = await createAdminClient();
  const userId = await getCurrentUserId();

  const { data: event } = await supabase
    .from("events")
    .select("id, title, contribution_due_date, fund_id")
    .eq("id", eventId)
    .maybeSingle();
  if (!event) return { error: "Event not found" };

  const { data: member } = await supabase
    .from("members")
    .select("id, full_name, email")
    .eq("id", memberId)
    .maybeSingle();
  if (!member) return { error: "Member not found" };
  if (!member.email) {
    return { error: "This member has no email address on their profile" };
  }

  // Reuse the single derivation the table uses so the email can never disagree
  // with what the admin is looking at.
  const { getEventContributionRows } = await import("@/lib/queries/admin");
  const row = (await getEventContributionRows(eventId)).find(
    (item) => item.member_id === memberId
  );
  if (!row) return { error: "This member is not assigned to the event" };

  const parsed = reminderEmailSchema.safeParse({
    event_id: eventId,
    member_id: memberId,
    recipient_email: member.email,
    subject: formData.get("subject"),
    message: formData.get("message"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { data: settings } = await supabase
    .from("mosque_settings")
    .select("mosque_name, logo_url, address, phone")
    .limit(1)
    .maybeSingle();

  const mosqueName = settings?.mosque_name || "Beara-Jam-e-Masjid";
  const details = {
    memberName: member.full_name,
    eventName: event.title,
    assignedAmount: row.assigned_amount,
    paidAmount: row.paid_amount,
    remainingAmount: row.remaining_amount,
    dueDate: event.contribution_due_date,
    mosqueName,
    mosqueAddress: settings?.address ?? null,
    mosquePhone: settings?.phone ?? null,
    logoUrl: settings?.logo_url ?? null,
    adminMessage: parsed.data.message,
  };

  try {
    await sendReminderEmail({
      to: member.email,
      subject: parsed.data.subject,
      html: buildReminderHtml(details),
      text: parsed.data.message,
    });
  } catch (error) {
    // Keep the failed attempt on record so the admin knows a reminder was tried,
    // but never surface transport internals to the browser.
    await recordReminderAttempt({
      event_id: eventId,
      member_id: memberId,
      recipient_email: member.email,
      subject: parsed.data.subject,
      message: parsed.data.message,
      sent_by: userId,
      status: "failed",
    });

    console.error("[event-reminder] send failed", error);
    return { error: "Unable to send email. Please try again." };
  }

  await recordReminderAttempt({
    event_id: eventId,
    member_id: memberId,
    recipient_email: member.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
    sent_by: userId,
    status: "sent",
  });

  logAudit({
    action: "send_reminder",
    module: "event",
    entity: "contribution_reminder_emails",
    entityId: eventId,
    newData: {
      member_id: memberId,
      member_name: member.full_name,
      recipient_email: member.email,
      subject: parsed.data.subject,
    },
  });

  revalidatePath(`/admin/events/${eventId}`);
  return { success: true, id: member.email };
}

/** How many reminders one server action call will deliver. */
const BULK_REMINDER_BATCH_SIZE = 10;

/**
 * Send contribution reminders to every incomplete member of an event.
 *
 * Recipients are chosen entirely on the server from the derived contribution
 * rows, so a tampered request cannot reach a completed member and cannot invent
 * a recipient. Each recipient gets their own individually resolved message and
 * their own `sendMail` call: never one message addressed to everyone.
 *
 * Work is split into bounded batches because one server action invocation has to
 * finish inside the platform timeout, and 290 sequential SMTP handshakes will
 * not. Resumption uses an `after_member_id` cursor over a member_id-ordered queue
 * rather than a numeric offset: if someone completes their contribution between
 * batches the queue shrinks, and an offset would then skip a member and email
 * another one twice.
 */
// Records a reminder attempt. Delivery has already happened by the time this is
// called, so a write failure must never turn a real send into a reported error
// -- but it must not vanish either: a silently dropped history row leaves the
// "last reminder" column permanently stale with no way to diagnose why.
async function recordReminderAttempt(row: ContributionReminderEmailInsert) {
  const { error } = await createAdminClient()
    .from("contribution_reminder_emails")
    .insert(row);
  if (error) {
    console.error(`[event-reminder] history insert failed (${row.status}): ${error.message}`);
  }
}

export async function sendBulkContributionReminders(formData: FormData) {
  const access = await getCurrentAccess();
  if (!access.has("event.manage")) {
    return { error: "You are not allowed to send contribution reminders" };
  }

  const parsed = bulkReminderSchema.safeParse({
    event_id: formData.get("event_id"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { event_id: eventId, subject: subjectTemplate, message: messageTemplate } = parsed.data;

  // A typo in a placeholder would otherwise be mailed to every recipient.
  const unknown = [
    ...findUnknownPlaceholders(subjectTemplate),
    ...findUnknownPlaceholders(messageTemplate),
  ];
  if (unknown.length) {
    return {
      error: `Unknown placeholder${unknown.length > 1 ? "s" : ""}: ${unknown
        .map((name) => `{{${name}}}`)
        .join(", ")}. Remove ${unknown.length > 1 ? "them" : "it"} before sending.`,
    };
  }

  const supabase = createAdminClient();
  const userId = await getCurrentUserId();

  const { data: event } = await supabase
    .from("events")
    .select("id, title, contribution_due_date, fund_id")
    .eq("id", eventId)
    .maybeSingle();
  if (!event) return { error: "Event not found" };

  // Only Incomplete members are ever considered, and each is re-derived from
  // approved donations on every batch so a member who completed mid-run is
  // skipped rather than emailed.
  const { getEventContributionRows } = await import("@/lib/queries/admin");
  const rows = await getEventContributionRows(eventId);

  const incomplete = rows
    .filter((row) => row.status === "incomplete")
    // Stable queue order, so the cursor below can never repeat or skip anyone.
    .sort((a, b) => a.member_id.localeCompare(b.member_id));
  if (!incomplete.length) {
    return { error: "All assigned members have completed their contribution." };
  }

  // Resume strictly after the last member of the previous batch. Compared by id
  // rather than by index: the incomplete set can shrink mid-run, and a positional
  // cursor would then skip one member and email another twice.
  const afterMemberId = String(formData.get("after_member_id") ?? "");
  const startIndex = afterMemberId
    ? incomplete.filter((row) => row.member_id.localeCompare(afterMemberId) <= 0).length
    : 0;

  const { data: settings } = await supabase
    .from("mosque_settings")
    .select("mosque_name, logo_url, address, phone")
    .limit(1)
    .maybeSingle();

  const mosqueName = settings?.mosque_name || "Beara-Jam-e-Masjid";
  const batch = incomplete.slice(startIndex, startIndex + BULK_REMINDER_BATCH_SIZE);

  const results: BulkReminderRecipientResult[] = [];

  for (const row of batch) {
    const base = {
      member_id: row.member_id,
      member_name: row.member_name,
      email: row.email,
    };

    // Missing or malformed address: skip this recipient, never fail the batch.
    if (!isDeliverableEmail(row.email)) {
      results.push({ ...base, status: "skipped" });
      continue;
    }

    const details = {
      memberName: row.member_name,
      eventName: event.title,
      assignedAmount: row.assigned_amount,
      paidAmount: row.paid_amount,
      remainingAmount: row.remaining_amount,
      dueDate: event.contribution_due_date,
      mosqueName,
    };
    const message = renderReminderTemplate(messageTemplate, details);
    const subject = renderReminderTemplate(subjectTemplate, details);

    let outcome: BulkReminderRecipientResult["status"] = "failed";

    try {
      await sendReminderEmail({
        to: row.email,
        subject,
        html: buildReminderHtml({
          ...details,
          mosqueAddress: settings?.address ?? null,
          mosquePhone: settings?.phone ?? null,
          logoUrl: settings?.logo_url ?? null,
          adminMessage: message,
        }),
        text: message,
      });
      outcome = "sent";
    } catch (error) {
      console.error(`[event-bulk-reminder] send failed for member ${row.member_id}`, error);
    }

    // One history row per attempt, exactly like the single-member path. Written
    // after the send so the recorded status always matches what happened.
    results.push({ ...base, status: outcome });
    await recordReminderAttempt({
      event_id: eventId,
      member_id: row.member_id,
      recipient_email: row.email,
      subject,
      message,
      sent_by: userId,
      status: outcome,
    });
  }

  const sent = results.filter((r) => r.status === "sent").length;
  const failed = results.filter((r) => r.status === "failed").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const total = incomplete.length;

  // A member that completed after this batch was already taken still counts as
  // processed: it was addressed, and its absence from the next batch is correct.
  const lastProcessed = batch[batch.length - 1];
  const nextCursor = lastProcessed?.member_id ?? afterMemberId;
  const remainingAfter =
    total - incomplete.filter((row) => row.member_id.localeCompare(nextCursor) <= 0).length;
  const hasMore = remainingAfter > 0;

  // Audited once, when the queue drains, so a 290-recipient send does not leave
  // 29 near-identical audit rows behind.
  //
  // The action only ever holds one batch, so the run totals are supplied by the
  // caller, which accumulates them across batches. They are clamped to
  // non-negative integers here, and still reported alongside this batch's own
  // counts, so a mistyped client cannot record a negative or fractional send.
  if (!hasMore) {
    const readCount = (key: string) => {
      const parsed = Number.parseInt(String(formData.get(key) ?? ""), 10);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    };
    logAudit({
      action: "send_bulk_reminders",
      module: "event",
      entity: "contribution_reminder_emails",
      entityId: eventId,
      newData: {
        event_id: eventId,
        event_title: event.title,
        incomplete_total: total,
        attempted: readCount("run_processed"),
        sent: readCount("run_sent"),
        failed: readCount("run_failed"),
        skipped_no_email: readCount("run_skipped"),
        batches_run: Number(formData.get("batch_number") ?? "0") + 1,
      },
    });
  }

  revalidatePath(`/admin/events/${eventId}`);

  return {
    success: true,
    results,
    stats: { sent, failed, skipped, processed: results.length, total },
    cursor: nextCursor,
    hasMore,
    remaining: remainingAfter,
  };
}

// ============================================================
// ANNOUNCEMENTS
// ============================================================

export async function createAnnouncement(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const access = await getCurrentAccess();
  if (!access.has("announcement.manage")) {
    return { error: "You are not allowed to create announcements" };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = announcementSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { data, error } = await (await createClient())
    .from("announcements")
    .insert({
      ...parsed.data,
      start_date: emptyToNull(parsed.data.start_date),
      end_date: emptyToNull(parsed.data.end_date),
      created_by: await getCurrentUserId(),
    })
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
  const access = await getCurrentAccess();
  if (!access.has("announcement.manage")) {
    return { error: "You are not allowed to update announcements" };
  }

  const id = formData.get("id") as string;
  const raw = Object.fromEntries(formData.entries());
  delete raw.id;
  const parsed = announcementSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { error } = await (await createClient())
    .from("announcements")
    .update({
      ...parsed.data,
      start_date: emptyToNull(parsed.data.start_date),
      end_date: emptyToNull(parsed.data.end_date),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/announcements");
  revalidatePath("/");
  return { success: true, id };
}

export async function deleteAnnouncement(formData: FormData) {
  const access = await getCurrentAccess();
  if (!access.has("announcement.manage")) {
    return { error: "You are not allowed to delete announcements" };
  }

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
  const access = await getCurrentAccess();
  if (!access.has("khutbah.manage")) {
    return { error: "You do not have permission to perform this action." };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = khutbahSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { data, error } = await (await createClient())
    .from("khutbahs")
    .insert({
      ...parsed.data,
      date: emptyToNull(parsed.data.date),
      slug: await ensureUniqueSlug("khutbahs", slugify(parsed.data.title)),
      created_by: await getCurrentUserId(),
    })
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
  const access = await getCurrentAccess();
  if (!access.has("khutbah.manage")) {
    return { error: "You do not have permission to perform this action." };
  }

  const id = formData.get("id") as string;
  const raw = Object.fromEntries(formData.entries());
  delete raw.id;
  const parsed = khutbahSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { error } = await (await createClient())
    .from("khutbahs")
    .update({
      ...parsed.data,
      date: emptyToNull(parsed.data.date),
      slug: await ensureUniqueSlug("khutbahs", slugify(parsed.data.title), id),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/khutbah");
  return { success: true, id };
}

export async function deleteKhutbah(formData: FormData) {
  const access = await getCurrentAccess();
  if (!access.has("khutbah.manage")) {
    return { error: "You do not have permission to perform this action." };
  }

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
  const access = await getCurrentAccess();
  if (!access.has("asset.manage")) {
    return { error: "You do not have permission to perform this action." };
  }

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
  const access = await getCurrentAccess();
  if (!access.has("asset.manage")) {
    return { error: "You do not have permission to perform this action." };
  }

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
  const access = await getCurrentAccess();
  if (!access.has("asset.manage")) {
    return { error: "You do not have permission to perform this action." };
  }

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
  const access = await getCurrentAccess();
  if (!access.has("maintenance.manage")) {
    return { error: "You do not have permission to perform this action." };
  }

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
  const access = await getCurrentAccess();
  if (!access.has("maintenance.manage")) {
    return { error: "You do not have permission to perform this action." };
  }

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
  const access = await getCurrentAccess();
  if (!access.has("maintenance.manage")) {
    return { error: "You do not have permission to perform this action." };
  }

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
  const access = await getCurrentAccess();
  if (!access.has("document.manage")) {
    return { error: "You do not have permission to perform this action." };
  }

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
  const access = await getCurrentAccess();
  if (!access.has("request.manage")) {
    return { error: "You are not allowed to manage contact requests" };
  }

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
  const access = await getCurrentAccess();
  if (!access.has("request.manage")) {
    return { error: "You are not allowed to delete contact requests" };
  }

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
  const access = await getCurrentAccess();
  if (!access.has("prayer.update")) {
    return { error: "You are not allowed to manage prayer times" };
  }

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
  const access = await getCurrentAccess();
  if (!access.has("prayer.update")) {
    return { error: "You are not allowed to copy prayer times" };
  }

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
  const access = await getCurrentAccess();
  if (!access.has("prayer.update")) {
    return { error: "You are not allowed to delete prayer times" };
  }

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
  const access = await getCurrentAccess();
  if (!access.has("settings.manage")) {
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
  const access = await getCurrentAccess();
  if (!access.has("zakat.manage")) {
    return { error: "You do not have permission to perform this action." };
  }

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
  const access = await getCurrentAccess();
  if (!access.has("zakat.manage")) {
    return { error: "You do not have permission to perform this action." };
  }

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
  const access = await getCurrentAccess();
  if (!access.has("zakat.manage")) {
    return { error: "You do not have permission to perform this action." };
  }

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

export async function createUserAccount(formData: FormData): Promise<ActionResult> {
  const access = await getCurrentAccess();
  if (!access.isSuperAdmin) {
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

  const memberOptIn =
    (formData.get("create_member") as string) === "on" ||
    (formData.get("create_member") as string) === "1";
  let warning: string | undefined;

  if (memberOptIn) {
    const actorId = await getCurrentUserId();
    const memberSeed = {
      full_name: fullName,
      email,
      phone: (formData.get("phone") as string)?.trim() || "",
      father_name: (formData.get("father_name") as string)?.trim() || undefined,
      address: (formData.get("address") as string)?.trim() || undefined,
      occupation: (formData.get("occupation") as string)?.trim() || undefined,
      blood_group: (formData.get("blood_group") as string)?.trim() || undefined,
      emergency_contact: (formData.get("emergency_contact") as string)?.trim() || undefined,
      date_joined: (formData.get("date_joined") as string)?.trim() || undefined,
      membership_type:
        (formData.get("membership_type") as string) || "regular",
      status: (formData.get("status") as string) || "active",
      notes: (formData.get("notes") as string)?.trim() || undefined,
    };

    const parsedMember = memberSchema.safeParse(memberSeed);
    if (!parsedMember.success) {
      warning = `Account created, but member details were invalid and skipped: ${parsedMember.error.issues[0]?.message}`;
    } else {
      const memberId = `MEM-${Date.now().toString().slice(-6)}`;
      const { error: memberError } = await supabase
        .from("members")
        .insert({
          ...parsedMember.data,
          member_id: memberId,
          user_id: data.user.id,
          created_by: actorId,
        });
      if (memberError) {
        warning = `Account created, but member record could not be saved: ${memberError.message}`;
      }
    }
  }

  logAudit({
    action: "create",
    module: "users",
    entity: "user",
    entityId: data.user.id,
    newData: { email, role, memberOptIn },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/members");
  return { success: true, id: data.user.id, warning };
}

export async function updateUserRole(formData: FormData) {
  const access = await getCurrentAccess();
  if (!isAdminRole(access.role)) {
    return { error: "You are not allowed to change roles" };
  }

  const userId = formData.get("id") as string;
  const role = formData.get("role") as string;
  if (role === "super_admin" && !access.isSuperAdmin) {
    return { error: "Only the Super Admin can assign the Super Admin role" };
  }
  const supabase = createAdminClient();

  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) return { error: error.message };

  await syncUserRole(userId, role);

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
  const access = await getCurrentAccess();
  if (!isAdminRole(access.role)) {
    return { error: "You are not allowed to change user status" };
  }

  const userId = formData.get("id") as string;
  const status = formData.get("status") as string;
  const supabase = createAdminClient();
  if (!access.isSuperAdmin) {
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

export async function deleteUserAccount(formData: FormData): Promise<ActionResult> {
  const access = await getCurrentAccess();
  if (!isAdminRole(access.role)) {
    return { error: "You are not allowed to delete users" };
  }

  const userId = (formData.get("id") as string)?.trim();
  if (!userId) return { error: "Missing user id" };

  const actorId = await getCurrentUserId();
  if (actorId && userId === actorId) {
    return { error: "You cannot delete your own account" };
  }

  const supabase = createAdminClient();

  const { data: target } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", userId)
    .maybeSingle();
  if (!target) return { error: "This user no longer exists" };
  if (!access.isSuperAdmin && (target.role === "super_admin" || target.role === "admin")) {
    return { error: "Only the Super Admin can delete admin accounts" };
  }
  if (target.role === "super_admin") {
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "super_admin");
    if ((count ?? 0) <= 1) {
      return { error: "The last Super Admin cannot be deleted" };
    }
  }

  // Cascades remove `profiles` and `user_roles`; everything else (donations,
  // events, audit trails) keeps its history with the reference nulled.
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };

  logAudit({
    action: "delete",
    module: "users",
    entity: "user",
    entityId: userId,
    oldData: { email: target.email, full_name: target.full_name, role: target.role },
    newData: null,
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/members");
  return { success: true };
}

export async function changeUserPassword(formData: FormData): Promise<ActionResult> {
  const access = await getCurrentAccess();
  if (!isAdminRole(access.role)) {
    return { error: "You are not allowed to change passwords" };
  }

  const userId = (formData.get("id") as string)?.trim();
  const password = formData.get("password") as string;
  if (!userId) return { error: "Missing user id" };
  if (!password || password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  const supabase = createAdminClient();

  const { data: target } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", userId)
    .maybeSingle();
  if (!target) return { error: "This user no longer exists" };
  if (!access.isSuperAdmin && (target.role === "super_admin" || target.role === "admin")) {
    return { error: "Only the Super Admin can change this user's password" };
  }

  const { error } = await supabase.auth.admin.updateUserById(userId, { password });
  if (error) return { error: error.message };

  logAudit({
    action: "update",
    module: "users",
    entity: "user_password",
    entityId: userId,
    oldData: null,
    newData: { email: target.email },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function saveRolePermissions(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const access = await getCurrentAccess();
  if (!access.isSuperAdmin) {
    return { error: "Only the Super Admin can change permissions" };
  }

  const roleId = (formData.get("role_id") as string)?.trim();
  const permissionIds = (formData.getAll("permissions") as string[])
    .map((id) => (id ?? "").trim())
    .filter(Boolean);
  if (!roleId) return { error: "Missing role" };

  // The session client is subject to RLS, which is not a live boundary here.
  const supabase = createAdminClient();

  const { data: roleRow, error: roleErr } = await supabase
    .from("roles")
    .select("id, name")
    .eq("id", roleId)
    .single();
  if (roleErr || !roleRow) return { error: "That role no longer exists" };

  const { data: validRows } = await supabase.from("permissions").select("id, name");
  const validById = new Map((validRows ?? []).map((p) => [p.id as string, p.name as string]));
  const uniqueIds = Array.from(new Set(permissionIds)).filter((id) => validById.has(id));

  if (permissionIds.length !== uniqueIds.length) {
    return {
      error: `${permissionIds.length - uniqueIds.length} permission(s) could not be recognised. Reload the page and try again.`,
    };
  }

  // Never let the last super admin lock everyone out of the Roles page.
  if (roleRow.name === "super_admin") {
    const total = validById.size;
    if (uniqueIds.length < total) {
      return { error: "The Super Admin role must keep every permission enabled" };
    }
  }

  const { data: before } = await supabase
    .from("role_permissions")
    .select("permissions(name), roles!inner(name)")
    .eq("role_id", roleId);
  const beforeNames = (before ?? [])
    .map((row) => (row as { permissions?: { name?: string } | null }).permissions?.name)
    .filter((name): name is string => typeof name === "string");

  const { error: delErr } = await supabase.from("role_permissions").delete().eq("role_id", roleId);
  if (delErr) return { error: delErr.message };

  if (uniqueIds.length) {
    const { error: insErr } = await supabase
      .from("role_permissions")
      .insert(uniqueIds.map((pid) => ({ role_id: roleId, permission_id: pid })));
    if (insErr) return { error: insErr.message };
  }

  const afterNames = uniqueIds.map((id) => validById.get(id)!);

  logAudit({
    action: "update",
    module: "roles",
    entity: "role_permissions",
    entityId: roleId,
    newData: { role: roleRow.name, permissions: afterNames },
    oldData: { role: roleRow.name, permissions: beforeNames },
  });

  // The admin layout resolves the nav from these rows, so the change must be
  // pushed to every server-rendered admin surface immediately.
  revalidatePath("/admin/roles");
  revalidatePath("/admin", "layout");
  return { success: true };
}

/**
 * `profiles.role` is what the app reads, but the RBAC tables also expect a
 * `user_roles` row. Keeping both in sync means DB-level policies and the app
 * agree on who a user is.
 */
async function syncUserRole(userId: string, role: string) {
  const supabase = createAdminClient();
  const { data: roleRow } = await supabase
    .from("roles")
    .select("id")
    .eq("name", role)
    .maybeSingle();
  if (!roleRow) return;

  await supabase.from("user_roles").delete().eq("user_id", userId);
  const { error } = await supabase
    .from("user_roles")
    .insert({ user_id: userId, role_id: roleRow.id });
  if (error) {
    console.error("[roles] failed to sync user_roles for", userId, error.message);
  }
}

