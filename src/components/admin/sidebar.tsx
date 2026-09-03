"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/format";
import {
  LayoutDashboard,
  Clock,
  Megaphone,
  CalendarDays,
  BookOpen,
  HandCoins,
  PiggyBank,
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  Users,
  UserCog,
  Briefcase,
  Package,
  Wrench,
  FolderOpen,
  Inbox,
  Moon,
  HeartHandshake,
  UserRound,
  Shield,
  ScrollText,
  Settings,
  type LucideIcon,
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onNavigate: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Dashboard",
    items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Mosque",
    items: [
      { label: "Prayer Management", href: "/admin/prayer-times", icon: Clock },
      { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
      { label: "Events", href: "/admin/events", icon: CalendarDays },
      { label: "Khutbah", href: "/admin/khutbah", icon: BookOpen },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Donations", href: "/admin/donations", icon: HandCoins },
      { label: "Funds", href: "/admin/funds", icon: PiggyBank },
      { label: "Income", href: "/admin/income", icon: ArrowDownToLine },
      { label: "Expenses", href: "/admin/expenses", icon: ArrowUpFromLine },
      { label: "Reports", href: "/admin/reports", icon: BarChart3 },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Members", href: "/admin/members", icon: Users },
      { label: "Committee", href: "/admin/committee", icon: UserCog },
      { label: "Staff", href: "/admin/staff", icon: Briefcase },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Assets", href: "/admin/assets", icon: Package },
      { label: "Maintenance", href: "/admin/maintenance", icon: Wrench },
      { label: "Documents", href: "/admin/documents", icon: FolderOpen },
      { label: "Requests", href: "/admin/requests", icon: Inbox },
    ],
  },
  {
    label: "Community",
    items: [
      { label: "Ramadan", href: "/admin/ramadan", icon: Moon },
      { label: "Zakat & Charity", href: "/admin/zakat", icon: HeartHandshake },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Users", href: "/admin/users", icon: UserRound },
      { label: "Roles & Permissions", href: "/admin/roles", icon: Shield },
      { label: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

function SidebarLink({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 rounded-r-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "border-l-[3px] border-[#C8A951] bg-white/15 text-white"
          : "border-l-[3px] border-transparent text-white/70 hover:bg-white/10 hover:text-white"
      )}
      title={collapsed ? item.label : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

export function AdminSidebar({ collapsed, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <div
      className={cn(
        "islamic-pattern-dark flex h-full flex-col bg-[#064E3B] text-white transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center border-b border-white/10 px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C8A951] text-sm font-bold text-[#064E3B]">
              M
            </div>
            <span className="text-lg font-semibold">MMS Admin</span>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-[#C8A951] text-sm font-bold text-[#064E3B]">
            M
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            {!collapsed && (
              <div className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                {group.label}
              </div>
            )}
            {collapsed && group.label !== navGroups[0].label && (
              <div className="my-2 mx-3 h-px bg-white/10" />
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <SidebarLink
                  key={item.href}
                  item={item}
                  active={isActive(item.href)}
                  collapsed={collapsed}
                  onClick={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
