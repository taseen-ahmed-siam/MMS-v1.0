import { Metadata } from "next";
import { getRoles, getAllPermissions, getRolePermissions } from "@/lib/queries/admin";
import { createClient } from "@/lib/supabase/server";
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let currentRole: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    currentRole = profile?.role ?? null;
  }

  return (
    <RolesClient
      roles={roles}
      permissions={permissions}
      rolePermissions={rolePermissions}
      currentRole={currentRole}
    />
  );
}
