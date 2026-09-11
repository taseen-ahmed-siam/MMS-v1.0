"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { saveRolePermissions } from "@/lib/actions/admin";
import { AdminTableWrapper } from "@/components/admin/table-wrapper";
import { PageHeader } from "@/components/forms/page-header";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
}

interface RolesClientProps {
  roles: Role[];
  permissions: Permission[];
  rolePermissions: Record<string, string[]>;
  currentRole?: string | null;
}

export function RolesClient({ roles, permissions, rolePermissions, currentRole }: RolesClientProps) {
  const router = useRouter();

  const canSavePermissions = currentRole === "super_admin";

  const [selectedRole, setSelectedRole] = useState<Role | null>(roles[0] ?? null);
  const [selected, setSelected] = useState<string[]>([]);

  const [state, formAction, isSaving] = useActionState(saveRolePermissions, {});
  const [, startSubmitTransition] = useTransition();

  useEffect(() => {
    if (state.success) {
      toast.success("Permissions saved");
      router.refresh();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  useEffect(() => {
    setSelected(selectedRole ? rolePermissions[selectedRole.id] ?? [] : []);
  }, [selectedRole, rolePermissions]);

  const grouped = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    permissions.forEach((p) => {
      if (!groups[p.module]) groups[p.module] = [];
      groups[p.module].push(p);
    });
    return Object.entries(groups);
  }, [permissions]);

  const toggle = (permissionId: string) => {
    setSelected((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const isModuleAllChecked = (modulePermissions: Permission[]) =>
    modulePermissions.every((p) => selected.includes(p.id));

  const toggleModule = (modulePermissions: Permission[]) => {
    const allChecked = isModuleAllChecked(modulePermissions);
    const moduleIds = modulePermissions.map((p) => p.id);
    setSelected((prev) =>
      allChecked
        ? prev.filter((id) => !moduleIds.includes(id))
        : Array.from(new Set([...prev, ...moduleIds]))
    );
  };

  const handleSave = () => {
    if (!selectedRole) return;
    const fd = new FormData();
    fd.set("role_id", selectedRole.id);
    selected.forEach((pid) => fd.append("permissions", pid));
    startSubmitTransition(() => {
      formAction(fd);
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Roles & Permissions" description="Manage role-based access control" />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <AdminTableWrapper title="Roles" empty={roles.length === 0} emptyTitle="No roles">
            <div className="divide-y divide-black/[0.05]">
              {roles.map((role) => {
                const active = selectedRole?.id === role.id;
                const count = rolePermissions[role.id]?.length ?? 0;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors sm:px-5",
                      active ? "bg-[#064E3B]/[0.06]" : "hover:bg-black/[0.02]"
                    )}
                  >
                    <div className="min-w-0">
                      <p className={cn("font-medium", active ? "text-[#064E3B]" : "text-foreground")}>
                        {role.name}
                      </p>
                      {role.description && (
                        <p className="truncate text-xs text-muted-foreground">{role.description}</p>
                      )}
                    </div>
                    <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                      {count} perm{count === 1 ? "" : "s"}
                    </span>
                  </button>
                );
              })}
            </div>
          </AdminTableWrapper>
        </div>

        <div className="lg:col-span-3">
          <AdminTableWrapper
            title={selectedRole ? `Permissions — ${selectedRole.name}` : "Select a role"}
            description={selectedRole?.description ?? undefined}
            empty={!selectedRole}
            emptyTitle="No role selected"
            emptyDescription="Select a role from the list to manage its permissions."
            actions={
              selectedRole && canSavePermissions ? (
                (<Button size="sm" onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>)
              ) : undefined
            }
          >
            {selectedRole && (
              <div className="divide-y px-4 py-1 sm:px-6">
                {!canSavePermissions && (
                  <div className="rounded-lg bg-amber-50 text-amber-800 text-xs p-3 border border-amber-200 mb-1 mt-3">
                    Read-only — only the Super Admin can change permissions.
                  </div>
                )}
                {grouped.map(([module, modulePermissions]) => {
                  const allChecked = isModuleAllChecked(modulePermissions);
                  const someChecked = modulePermissions.some((p) => selected.includes(p.id));
                  return (
                    <div key={module} className="py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <Checkbox
                            checked={allChecked}
                            disabled={!canSavePermissions}
                            onCheckedChange={() => toggleModule(modulePermissions)}
                            className={someChecked && !allChecked ? "bg-primary/50" : ""}
                          />
                          <Label className="truncate font-medium capitalize">{module}</Label>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {modulePermissions.filter((p) => selected.includes(p.id)).length}/{modulePermissions.length}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-1 gap-2 pl-7 sm:grid-cols-2">
                        {modulePermissions.map((p) => (
                          <label
                            key={p.id}
                            className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground"
                          >
                            <Checkbox
                              checked={selected.includes(p.id)}
                              disabled={!canSavePermissions}
                              onCheckedChange={() => toggle(p.id)}
                            />
                            <span>{p.name.replace(".", " ")}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </AdminTableWrapper>
        </div>
      </div>
    </div>
  );
}