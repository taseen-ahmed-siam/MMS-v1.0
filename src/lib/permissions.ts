export const SUPER_ADMIN = "super_admin";
export const ADMIN = "admin";

/** Super admin keeps working even if every permission is revoked. */
export function isSuperAdminRole(role: string | null | undefined): boolean {
  return role === SUPER_ADMIN;
}

export function isAdminRole(role: string | null | undefined): boolean {
  return role === SUPER_ADMIN || role === ADMIN;
}

export type NavVisibility =
  | { kind: "permission"; permission: string; excludedRoles?: string[] }
  | { kind: "super_admin" };

export const NAV_PERMISSIONS: Record<string, NavVisibility> = {
  "/admin": { kind: "permission", permission: "dashboard.view" },
  "/admin/my-donations": {
    kind: "permission",
    permission: "donation.view.own",
    excludedRoles: [SUPER_ADMIN, ADMIN],
  },
  "/admin/prayer-times": { kind: "permission", permission: "prayer.view" },
  "/admin/announcements": { kind: "permission", permission: "announcement.manage" },
  "/admin/events": { kind: "permission", permission: "event.manage" },
  "/admin/khutbah": { kind: "permission", permission: "khutbah.view" },
  "/admin/donations": { kind: "permission", permission: "donation.view" },
  "/admin/funds": { kind: "permission", permission: "fund.view" },
  "/admin/income": { kind: "permission", permission: "income.view" },
  "/admin/expenses": { kind: "permission", permission: "expense.view" },
  "/admin/reports": { kind: "permission", permission: "reports.view" },
  "/admin/members": { kind: "permission", permission: "member.view" },
  "/admin/committee": { kind: "permission", permission: "committee.view" },
  "/admin/staff": { kind: "permission", permission: "staff.manage" },
  "/admin/assets": { kind: "permission", permission: "asset.view" },
  "/admin/maintenance": { kind: "permission", permission: "maintenance.view" },
  "/admin/documents": { kind: "permission", permission: "document.view" },
  "/admin/requests": { kind: "permission", permission: "request.view" },
  "/admin/ramadan": { kind: "permission", permission: "ramadan.view" },
  "/admin/zakat": { kind: "permission", permission: "zakat.view" },
  "/admin/users": { kind: "permission", permission: "users.view" },
  "/admin/roles": { kind: "super_admin" },
  "/admin/audit-logs": { kind: "permission", permission: "audit.view" },
  "/admin/settings": { kind: "permission", permission: "settings.manage" },
};

/**
 * `permissions` must be the list resolved from Postgres by
 * `getPermissionsForRole()` in `@/lib/access`, so revoking a checkbox in
 * /admin/roles removes access on the very next request.
 */
export function permissionsAllow(
  permissions: string[] | null | undefined,
  permission: string
): boolean {
  if (!permissions?.length) return false;
  if (permissions.includes("*")) return true;
  return permissions.includes(permission);
}

export function navItemAllowed(
  role: string | null | undefined,
  permissions: string[] | null | undefined,
  href: string
): boolean {
  const visibility = NAV_PERMISSIONS[href];
  if (!visibility) return false;

  if (visibility.kind === "permission") {
    if (visibility.excludedRoles?.includes(role ?? "")) return false;
    return permissionsAllow(permissions, visibility.permission);
  }
  if (visibility.kind === "super_admin") return role === SUPER_ADMIN;
  return false;
}

/** Longest-prefix lookup so nested routes inherit their section's permission. */
export function permissionForPath(
  role: string | null | undefined,
  permissions: string[] | null | undefined,
  pathname: string
): boolean {
  if (pathname === "/admin" || pathname === "/admin/") {
    return navItemAllowed(role, permissions, "/admin");
  }
  const match = Object.keys(NAV_PERMISSIONS)
    .filter((href) => href !== "/admin" && pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];
  if (match) return navItemAllowed(role, permissions, match);
  return navItemAllowed(role, permissions, pathname);
}
