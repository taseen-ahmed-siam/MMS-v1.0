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
  children: React.ReactNode;
}

export function AdminShell({ user, children }: AdminShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAF8F2]">
      <div className="hidden lg:flex lg:flex-col">
        <AdminSidebar collapsed={collapsed} onNavigate={() => {}} role={user.role} />
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0" style={{ backgroundColor: "#064E3B" }}>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <AdminSidebar collapsed={false} onNavigate={() => setMobileOpen(false)} role={user.role} />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader
          user={user}
          onToggleSidebar={() => setCollapsed((p) => !p)}
          onToggleMobile={() => setMobileOpen((p) => !p)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
