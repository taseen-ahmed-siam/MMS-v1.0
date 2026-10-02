import "server-only";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth/session";

import { isAdminRole, isSuperAdminRole } from "@/lib/permissions";

export { SUPER_ADMIN, ADMIN, isAdminRole, isSuperAdminRole } from "@/lib/permissions";

export type UserAccess = {
  role: string | null;
  permissions: string[];
  isSuperAdmin: boolean;
  has: (permission: string) => boolean;
};

/**
 * Reads the effective permission list for a role straight from Postgres
 * (`roles` -> `role_permissions` -> `permissions`). This is the single source
 * of truth, so a change made in /admin/roles takes effect on the next request.
 */
export async function getPermissionsForRole(role: string | null | undefined): Promise<string[]> {
  if (!role) return [];
  if (isSuperAdminRole(role)) return ["*"];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("role_permissions")
    .select("permissions(name), roles!inner(name)")
    .eq("roles.name", role);

  if (error) {
    console.error("[access] failed to load permissions for role", role, error.message);
    return [];
  }

  return (data ?? [])
    .map((row) => (row as { permissions?: { name?: string } | null }).permissions?.name)
    .filter((name): name is string => typeof name === "string");
}

export function buildAccess(role: string | null | undefined, permissions: string[]): UserAccess {
  const list = isSuperAdminRole(role) ? ["*", ...permissions] : permissions;
  return {
    role: role ?? null,
    permissions: list,
    isSuperAdmin: isSuperAdminRole(role),
    has: (permission: string) => list.includes("*") || list.includes(permission),
  };
}

/** Access for the currently signed-in user, resolved from the database. */
export async function getCurrentAccess(): Promise<UserAccess> {
  const profile = await getCurrentProfile();
  const role = profile?.role ?? null;
  const permissions = await getPermissionsForRole(role);
  return buildAccess(role, permissions);
}

/**
 * Server-component guard. Redirects to /admin/forbidden the moment a
 * permission is revoked, so hiding a nav item is not the only defence.
 */
export async function requirePermission(permission: string): Promise<UserAccess> {
  const access = await getCurrentAccess();
  if (!access.has(permission)) {
    redirect("/admin/forbidden");
  }
  return access;
}

export async function requireSuperAdmin(): Promise<UserAccess> {
  const access = await getCurrentAccess();
  if (!access.isSuperAdmin) {
    redirect("/admin/forbidden");
  }
  return access;
}

export async function requireAdminRole(): Promise<UserAccess> {
  const access = await getCurrentAccess();
  if (!isAdminRole(access.role)) {
    redirect("/admin/forbidden");
  }
  return access;
}

/** Throwing variant for server actions and route handlers (no redirect). */
export async function assertPermission(permission: string): Promise<UserAccess> {
  const access = await getCurrentAccess();
  if (!access.has(permission)) {
    throw new Error("You do not have permission to perform this action.");
  }
  return access;
}

export async function assertSuperAdmin(): Promise<UserAccess> {
  const access = await getCurrentAccess();
  if (!access.isSuperAdmin) {
    throw new Error("Only a super admin can perform this action.");
  }
  return access;
}
