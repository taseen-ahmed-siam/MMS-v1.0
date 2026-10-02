"use client";

import { useState } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";

interface AdminShellProps {
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
  };
  permissions: string[];
  children: React.ReactNode;
}

export function AdminShell({ user, permissions, children }: AdminShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#FAF8F2] print:h-auto print:overflow-visible">
      <div className="hidden lg:flex lg:flex-col print:hidden">
        <AdminSidebar collapsed={collapsed} onNavigate={() => {}} role={user.role} permissions={permissions} />
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-64 p-0 print:hidden [&>button]:right-3 [&>button]:top-3 [&>button]:flex [&>button]:h-9 [&>button]:w-9 [&>button]:items-center [&>button]:justify-center [&>button]:text-white [&>button]:opacity-100 [&>button]:hover:bg-white/10 [&>button]:hover:text-white [&>button]:focus:ring-white/60"
          style={{ backgroundColor: "#064E3B" }}
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <AdminSidebar collapsed={false} onNavigate={() => setMobileOpen(false)} role={user.role} permissions={permissions} />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden print:overflow-visible">
        <AdminHeader
          user={user}
          permissions={permissions}
          onToggleSidebar={() => setCollapsed((p) => !p)}
          onToggleMobile={() => setMobileOpen((p) => !p)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 transition-all duration-300 print:overflow-visible">
          {children}
        </main>
      </div>
    </div>
  );
}
