export const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ["*"],
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
  muazzin: ["dashboard.view", "prayer.view"],
  committee_member: [],
  staff: [],
  member: ["dashboard.view", "donation.view.own"],
};

const SUPER_ADMIN = "super_admin";
const ADMIN = "admin";

export function roleHasPermission(role: string | null | undefined, permission: string): boolean {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role] ?? [];
  if (perms.includes("*")) return true;
  return perms.includes(permission);
}

export function isAdmin(role: string | null | undefined): boolean {
  return role === SUPER_ADMIN || role === ADMIN;
}

export function isSuperAdmin(role: string | null | undefined): boolean {
  return role === SUPER_ADMIN;
}

export type NavVisibility =
  | { kind: "permission"; permission: string }
  | { kind: "super_admin" }
  | { kind: "admin" };

export const NAV_PERMISSIONS: Record<string, NavVisibility> = {
  "/admin": { kind: "permission", permission: "dashboard.view" },
  "/admin/my-donations": { kind: "permission", permission: "donation.view.own" },
  "/admin/prayer-times": { kind: "permission", permission: "prayer.view" },
  "/admin/announcements": { kind: "permission", permission: "announcement.manage" },
  "/admin/events": { kind: "permission", permission: "event.manage" },
  "/admin/khutbah": { kind: "admin" },
  "/admin/donations": { kind: "permission", permission: "donation.view" },
  "/admin/funds": { kind: "admin" },
  "/admin/income": { kind: "admin" },
  "/admin/expenses": { kind: "permission", permission: "expense.view" },
  "/admin/reports": { kind: "permission", permission: "reports.view" },
  "/admin/members": { kind: "permission", permission: "member.view" },
  "/admin/committee": { kind: "admin" },
  "/admin/staff": { kind: "permission", permission: "staff.manage" },
  "/admin/assets": { kind: "admin" },
  "/admin/maintenance": { kind: "admin" },
  "/admin/documents": { kind: "admin" },
  "/admin/requests": { kind: "admin" },
  "/admin/ramadan": { kind: "admin" },
  "/admin/zakat": { kind: "admin" },
  "/admin/users": { kind: "admin" },
  "/admin/roles": { kind: "super_admin" },
  "/admin/audit-logs": { kind: "permission", permission: "audit.view" },
  "/admin/settings": { kind: "permission", permission: "settings.manage" },
};

export function navItemAllowed(role: string | null | undefined, href: string): boolean {
  const visibility = NAV_PERMISSIONS[href];
  if (!visibility) return false;
  if (visibility.kind === "permission") return roleHasPermission(role, visibility.permission);
  if (visibility.kind === "super_admin") return isSuperAdmin(role);
  if (visibility.kind === "admin") return isAdmin(role);
  return false;
}