"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RotateCcw, Save, Search, ShieldCheck, Users } from "lucide-react";
import { saveRolePermissions } from "@/lib/actions/admin";
import { PageHeader } from "@/components/forms/page-header";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { USER_ROLES } from "@/constants";
import { cn } from "@/lib/utils/format";

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions?: { name: string }[];
}

interface Permission {
  id: string;
  name: string;
  module: string;
  action: string;
  description?: string | null;
}

interface RolesClientProps {
  roles: Role[];
  permissions: Permission[];
  rolePermissions: Record<string, string[]>;
  roleUserCounts: Record<string, number>;
  currentRole?: string | null;
}

const SUPER_ADMIN = "super_admin";

const ROLE_LABELS: Record<string, string> = Object.fromEntries(
  USER_ROLES.map((r) => [r.value, r.label])
);

/** "donation.view.own" -> "View Own" */
function humanize(permission: Permission): string {
  const suffix = permission.name.startsWith(`${permission.module}.`)
    ? permission.name.slice(permission.module.length + 1)
    : permission.action;
  return suffix
    .split(".")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function RolesClient({
  roles,
  permissions,
  rolePermissions,
  roleUserCounts,
  currentRole,
}: RolesClientProps) {
  const router = useRouter();

  const canSavePermissions = currentRole === SUPER_ADMIN;

  const [selectedRole, setSelectedRole] = useState<Role | null>(roles[0] ?? null);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const [state, formAction, isSaving] = useActionState(saveRolePermissions, {});

  // Super Admin resolves to a wildcard at runtime, so its checkboxes are a
  // read-only mirror rather than something the admin can toggle.
  const isLocked = selectedRole?.name === SUPER_ADMIN;

  useEffect(() => {
    if (state.success) {
      toast.success("Permissions saved");
      router.refresh();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  const savedSelection = useMemo(
    () => (selectedRole ? rolePermissions[selectedRole.id] ?? [] : []),
    [selectedRole, rolePermissions]
  );

  useEffect(() => {
    setSelected(isLocked ? permissions.map((p) => p.id) : savedSelection);
    setSearch("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRole?.id, rolePermissions, isLocked]);

  const grouped = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matches = permissions.filter((p) => {
      if (!query) return true;
      return (
        p.name.toLowerCase().includes(query) ||
        p.module.toLowerCase().includes(query) ||
        (p.description ?? "").toLowerCase().includes(query)
      );
    });
    const groups: Record<string, Permission[]> = {};
    matches.forEach((p) => {
      if (!groups[p.module]) groups[p.module] = [];
      groups[p.module].push(p);
    });
    return Object.entries(groups);
  }, [permissions, search]);

  const editable = canSavePermissions && !isLocked;

  const toggle = (permissionId: string) => {
    if (!editable) return;
    setSelected((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const isModuleAllChecked = (modulePermissions: Permission[]) =>
    modulePermissions.every((p) => selected.includes(p.id));

  const toggleModule = (modulePermissions: Permission[]) => {
    if (!editable) return;
    const allChecked = isModuleAllChecked(modulePermissions);
    const moduleIds = modulePermissions.map((p) => p.id);
    setSelected((prev) =>
      allChecked
        ? prev.filter((id) => !moduleIds.includes(id))
        : Array.from(new Set([...prev, ...moduleIds]))
    );
  };

  const dirty = useMemo(() => {
    if (!selectedRole || isLocked) return false;
    const a = Array.from(new Set(savedSelection)).sort();
    const b = Array.from(new Set(selected)).sort();
    return a.length !== b.length || a.some((id, i) => id !== b[i]);
  }, [savedSelection, selected, selectedRole, isLocked]);

  const handleSave = () => {
    if (!selectedRole) return;
    const fd = new FormData();
    fd.set("role_id", selectedRole.id);
    selected.forEach((pid) => fd.append("permissions", pid));
    formAction(fd);
  };

  const handleReset = () => setSelected(savedSelection);

  const total = permissions.length;
  const enabledCount = isLocked ? total : selected.length;
  const percent = total === 0 ? 0 : Math.round((enabledCount / total) * 100);
  const affectedUsers = selectedRole ? roleUserCounts[selectedRole.name] ?? 0 : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description="Choose a role, then tick the permissions it should have. Changes apply to every user in that role."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Role picker */}
        <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-foreground">
            <span className="h-2 w-2 rounded-full bg-[#C8A951]" />
            Roles
          </h2>

          <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            {roles.map((role) => {
              const active = selectedRole?.id === role.id;
              const count = rolePermissions[role.id]?.length ?? 0;
              const users = roleUserCounts[role.name] ?? 0;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  aria-pressed={active}
                  className={cn(
                    "flex min-w-0 flex-1 basis-[calc(50%-0.25rem)] items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors lg:basis-auto",
                    active
                      ? "border-[#064E3B]/20 bg-[#064E3B]/[0.06] ring-1 ring-[#064E3B]/10"
                      : "border-black/5 bg-white hover:border-black/10 hover:bg-black/[0.02]"
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {role.name === SUPER_ADMIN && (
                      <ShieldCheck className="h-4 w-4 shrink-0 text-[#C8A951]" />
                    )}
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "block truncate text-sm font-semibold",
                          active ? "text-[#064E3B]" : "text-foreground"
                        )}
                      >
                        {ROLE_LABELS[role.name] ?? role.name.replace(/_/g, " ")}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {users} {users === 1 ? "user" : "users"}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 whitespace-nowrap rounded-full bg-black/[0.04] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
                    {role.name === SUPER_ADMIN ? "full" : count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Permission editor */}
        <section className="lg:col-span-3">
          <div className="rounded-2xl border border-black/5 bg-white shadow-sm">
            <div className="border-b border-black/[0.05] p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-foreground">
                    <span className="h-2 w-2 rounded-full bg-[#C8A951]" />
                    {selectedRole
                      ? `${ROLE_LABELS[selectedRole.name] ?? selectedRole.name.replace(/_/g, " ")} permissions`
                      : "Select a role"}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {isLocked
                      ? "Always on for every account that can sign in."
                      : selectedRole?.description ??
                        "Select a role from the list to manage its permissions."}
                  </p>
                </div>

                {editable && (
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                      disabled={!dirty || isSaving}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={!dirty || isSaving}>
                      <Save className="h-4 w-4" />
                      {isSaving ? "Saving…" : "Save"}
                    </Button>
                  </div>
                )}
              </div>

              {selectedRole && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">
                      {enabledCount} of {total} permissions enabled
                    </span>
                    <span className="font-bold tabular-nums text-[#064E3B]">{percent}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
                    <div
                      className="h-full rounded-full bg-[#064E3B] transition-[width] duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  {!isLocked && dirty && (
                    <p className="mt-2 text-xs font-medium text-amber-700">
                      Unsaved changes — {affectedUsers}{" "}
                      {affectedUsers === 1 ? "user" : "users"} in this role will be
                      affected on save.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="border-b border-black/[0.05] px-5 py-3 sm:px-6">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search permissions…"
                  className="pl-9"
                />
              </div>
            </div>

            {!canSavePermissions && (
              <div className="border-b border-black/[0.05] px-5 py-4 sm:px-6">
                <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  Read-only — only the Super Admin can change permissions.
                </p>
              </div>
            )}

            {isLocked && (
              <div className="border-b border-black/[0.05] px-5 py-4 sm:px-6">
                <p className="flex items-start gap-2 rounded-lg border border-[#C8A951]/30 bg-[#C8A951]/[0.08] p-3 text-xs text-[#7A5F1F]">
                  <ShieldCheck className="mt-px h-4 w-4 shrink-0" />
                  <span>
                    Super Admin always keeps full access, so these cannot be
                    switched off. That stops anyone from locking the mosque out
                    of the Roles page.
                  </span>
                </p>
              </div>
            )}

            {grouped.length === 0 ? (
              <div className="px-5 py-14 text-center sm:px-6">
                <p className="text-sm font-semibold text-foreground">No matches</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Nothing matches “{search.trim()}”.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-black/[0.05]">
                {grouped.map(([module, modulePermissions]) => {
                  const allChecked = isModuleAllChecked(modulePermissions);
                  const someChecked = modulePermissions.some((p) =>
                    selected.includes(p.id)
                  );
                  const activeCount = modulePermissions.filter((p) =>
                    selected.includes(p.id)
                  ).length;

                  return (
                    <div key={module} className="p-5 sm:p-6">
                      <div className="flex items-center justify-between gap-3">
                        <label
                          className={cn(
                            "flex min-w-0 items-center gap-2.5",
                            editable ? "cursor-pointer" : "cursor-default"
                          )}
                        >
                          <Checkbox
                            checked={allChecked}
                            disabled={!editable}
                            onCheckedChange={() => toggleModule(modulePermissions)}
                            className={cn(
                              someChecked && !allChecked && "bg-primary/50"
                            )}
                          />
                          <span className="truncate text-sm font-bold uppercase tracking-wide text-foreground">
                            {module.replace(/_/g, " ")}
                          </span>
                        </label>
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                          {activeCount}/{modulePermissions.length}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 pl-0 sm:grid-cols-2 sm:pl-8">
                        {modulePermissions.map((p) => {
                          const on = selected.includes(p.id);
                          return (
                            <label
                              key={p.id}
                              className={cn(
                                "flex items-start gap-2.5 rounded-lg px-2.5 py-2 transition-colors",
                                editable
                                  ? "cursor-pointer hover:bg-black/[0.02]"
                                  : "cursor-default"
                              )}
                            >
                              <Checkbox
                                checked={on}
                                disabled={!editable}
                                onCheckedChange={() => toggle(p.id)}
                                className="mt-0.5"
                              />
                              <span className="min-w-0 flex-1">
                                <span
                                  className={cn(
                                    "block text-sm font-medium",
                                    on ? "text-foreground" : "text-muted-foreground"
                                  )}
                                >
                                  {humanize(p)}
                                </span>
                                {p.description && (
                                  <span className="mt-0.5 block text-xs leading-snug text-muted-foreground/80">
                                    {p.description}
                                  </span>
                                )}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}