import { Metadata } from "next";
import { getUsers } from "@/lib/queries/admin";
import { createClient } from "@/lib/supabase/server";
import { UsersClient } from "./users-client";

export const metadata: Metadata = {
  title: "Users",
};

export default async function UsersPage() {
  const data = await getUsers();

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

  return <UsersClient data={data} currentRole={currentRole} />;
}