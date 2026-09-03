"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { saveRolePermissions } from "@/lib/actions/admin";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FormDialog } from "@/components/admin/form-dialog";
import { AdminTableWrapper } from "@/components/admin/table-wrapper";
import { PageHeader } from "@/components/forms/page-header";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
}

export function RolesClient({ roles, permissions, rolePermissions }: RolesClientProps) {
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState<Role | null>(roles[0] ?? null);
  const [selected, setSelected] = useState<string[]>([]);

  const [state, formAction, isSaving] = useActionState(saveRolePermissions, {});

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
    formAction(fd);
  };

  const columns: Column<Role>[] = [
    { key: "name", header: "Role", cell: (row) => (
      <div>
        <p className="font-medium">{row.name}</p>
        {row.description && (
          <p className="text-xs text-muted-foreground">{row.description}</p>
        )}
      </div>
    ), className: "w-16" },
    { key: "permissions", header: "Permissions", cell: (row) => {
      const count = rolePermissions[row.id]?.length ?? 0;
      return (
        <span className="text-sm text-muted-foreground">
          {count} permission{count === 1 ? "" : "s"}
        </span>
      );
    }},
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Roles & Permissions" description="Manage role-based access control" />

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <AdminTableWrapper empty={roles.length === 0} emptyTitle="No roles">
            <DataTable
              columns={columns}
              data={roles}
              onRowClick={(row) => setSelectedRole(row)}
            />
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
              selectedRole ? (
                (<Button size="sm" onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>)
              ) : undefined
            }
          >
            {selectedRole && (
              <div className="divide-y p-4">
                {grouped.map(([module, modulePermissions]) => {
                  const allChecked = isModuleAllChecked(modulePermissions);
                  const someChecked = modulePermissions.some((p) => selected.includes(p.id));
                  return (
                    <div key={module} className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={allChecked}
                            onCheckedChange={() => toggleModule(modulePermissions)}
                            className={someChecked && !allChecked ? "bg-primary/50" : ""}
                          />
                          <Label className="font-medium capitalize">{module}</Label>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {modulePermissions.filter((p) => selected.includes(p.id)).length}/{modulePermissions.length}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 pl-7">
                        {modulePermissions.map((p) => (
                          <label
                            key={p.id}
                            className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer"
                          >
                            <Checkbox
                              checked={selected.includes(p.id)}
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
