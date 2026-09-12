import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type UserRole =
  | "super_admin"
  | "admin"
  | "treasurer"
  | "imam"
  | "muazzin"
  | "committee_member"
  | "staff"
  | "member";

export const ALL_PERMISSIONS = [
  "dashboard.view",
  "prayer.view",
  "prayer.create",
  "prayer.update",
  "donation.view",
  "donation.create",
  "donation.update",
  "donation.delete",
  "expense.view",
  "expense.create",
  "expense.update",
  "expense.approve",
  "member.view",
  "member.create",
  "member.update",
  "event.manage",
  "announcement.manage",
  "staff.manage",
  "reports.view",
  "users.manage",
  "settings.manage",
  "audit.view",
] as const;

export type PermissionName = (typeof ALL_PERMISSIONS)[number];

const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, PermissionName[]> = {
  super_admin: [...ALL_PERMISSIONS],
  admin: [
    "dashboard.view",
    "prayer.view",
    "prayer.create",
    "prayer.update",
    "donation.view",
    "donation.create",
    "donation.update",
    "donation.delete",
    "expense.view",
    "expense.create",
    "expense.update",
    "expense.approve",
    "member.view",
    "member.create",
    "member.update",
    "event.manage",
    "announcement.manage",
    "staff.manage",
    "reports.view",
    "settings.manage",
    "audit.view",
  ],
  treasurer: [
    "dashboard.view",
    "donation.view",
    "donation.create",
    "donation.update",
    "expense.view",
    "expense.create",
    "expense.update",
    "expense.approve",
    "reports.view",
  ],
  imam: ["dashboard.view", "prayer.view", "prayer.update", "announcement.manage"],
  muazzin: ["dashboard.view", "prayer.view", "announcement.manage"],
  committee_member: ["dashboard.view", "prayer.view", "member.view", "reports.view"],
  staff: ["dashboard.view", "prayer.view"],
  member: ["prayer.view"],
};

export async function getUserRole(): Promise<UserRole | null> {
  try {
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

    return (profile?.role as UserRole) ?? null;
  } catch {
    return null;
  }
}

export async function getPermissions(): Promise<PermissionName[]> {
  const role = await getUserRole();
  if (!role) return [];
  return ROLE_DEFAULT_PERMISSIONS[role] ?? [];
}

export async function hasPermission(permission: PermissionName): Promise<boolean> {
  const permissions = await getPermissions();
  return permissions.includes(permission);
}

export async function requirePermission(permission: PermissionName) {
  const has = await hasPermission(permission);
  if (!has) {
    redirect("/admin/forbidden");
  }
  return has;
}

export async function requireAdmin() {
  const role = await getUserRole();
  if (!role || (role !== "super_admin" && role !== "admin")) {
    redirect("/admin/forbidden");
  }
  return role;
}

export async function requireSuperAdmin() {
  const role = await getUserRole();
  if (!role || role !== "super_admin") {
    redirect("/admin/forbidden");
  }
  return role;
}
