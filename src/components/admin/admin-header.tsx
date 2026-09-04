"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  ChevronRight,
  ExternalLink,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils/format";
import { logoutAction } from "@/lib/auth/actions";
import { CrescentStar } from "@/components/public/islamic";
import { roleHasPermission } from "@/lib/permissions";

interface AdminHeaderProps {
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
  };
  onToggleSidebar: () => void;
  onToggleMobile: () => void;
}

const pathLabels: Record<string, string> = {
  admin: "Admin",
  "prayer-times": "Prayer Management",
  announcements: "Announcements",
  events: "Events",
  khutbah: "Khutbah",
  donations: "Donations",
  funds: "Funds",
  income: "Income",
  expenses: "Expenses",
  reports: "Reports",
  members: "Members",
  committee: "Committee",
  staff: "Staff",
  assets: "Assets",
  maintenance: "Maintenance",
  documents: "Documents",
  requests: "Requests",
  ramadan: "Ramadan",
  zakat: "Zakat & Charity",
  users: "Users",
  roles: "Roles & Permissions",
  "audit-logs": "Audit Logs",
  settings: "Settings",
  forbidden: "Forbidden",
};

function Breadcrumbs({ pathname }: { pathname: string }) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((segment, index) => ({
    label: pathLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
    href: "/" + segments.slice(0, index + 1).join("/"),
    isLast: index === segments.length - 1,
  }));

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1">
          {crumb.isLast ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <>
              <Link href={crumb.href} className="hover:text-foreground transition-colors">
                {crumb.label}
              </Link>
              <ChevronRight className="h-3 w-3" />
            </>
          )}
        </span>
      ))}
    </nav>
  );
}

export function AdminHeader({
  user,
  onToggleSidebar,
  onToggleMobile,
}: AdminHeaderProps) {
  const pathname = usePathname();
  const initials = getInitials(user.full_name);
  const canManageSettings = roleHasPermission(user.role, "settings.manage");

  return (
    <header className="flex h-16 shrink-0 items-center border-b border-[#C8A951]/30 bg-white px-4 gap-3">
      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:flex shrink-0"
        onClick={onToggleSidebar}
      >
        <Menu className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden shrink-0"
        onClick={onToggleMobile}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex flex-1 items-center gap-2 overflow-hidden">
        <CrescentStar className="hidden sm:block h-4 w-4 text-[#C8A951]" />
        <Breadcrumbs pathname={pathname} />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 gap-2 px-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-[#064E3B] text-xs text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden md:inline-block text-sm font-medium">
              {user.full_name}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{user.full_name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/" target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Site
            </Link>
          </DropdownMenuItem>
          {canManageSettings && (
            <DropdownMenuItem asChild>
              <Link href="/admin/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={(e) => {
              e.preventDefault();
              logoutAction();
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
