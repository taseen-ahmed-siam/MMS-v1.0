import { requireAuth, getProfile } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  if (pathname.startsWith("/admin/forbidden")) {
    return <>{children}</>;
  }

  const user = await requireAuth();
  const profile = await getProfile(user.id);

  if (!profile) {
    redirect("/admin/forbidden");
  }

  if (profile.status !== "active") {
    redirect("/admin/forbidden");
  }

  return (
    <AdminShell
      user={{
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
      }}
    >
      {children}
    </AdminShell>
  );
}
