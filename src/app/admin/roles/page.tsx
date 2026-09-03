import { Metadata } from "next";
import { getRoles, getAllPermissions, getRolePermissions } from "@/lib/queries/admin";
import { RolesClient } from "./roles-client";

export const metadata: Metadata = {
  title: "Roles & Permissions",
};

export default async function RolesPage() {
  const [roles, permissions] = await Promise.all([getRoles(), getAllPermissions()]);

  const rolePermissions: Record<string, string[]> = {};
  await Promise.all(
    roles.map(async (role) => {
      rolePermissions[role.id] = await getRolePermissions(role.id);
    })
  );

  return (
    <RolesClient
      roles={roles}
      permissions={permissions}
      rolePermissions={rolePermissions}
    />
  );
}
