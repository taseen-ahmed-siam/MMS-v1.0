"use client";

import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { LucideIcon } from "lucide-react";
import {
  HandCoins,
  ArrowDownToLine,
  ArrowUpFromLine,
  Wallet,
  Users,
  Landmark,
  CalendarDays,
  Inbox,
  Megaphone,
} from "lucide-react";
import { formatCurrency, timeAgo } from "@/lib/utils/format";

const PIE_COLORS = ["#064E3B", "#065F46", "#C8A951", "#B45309", "#15803D", "#6B7280", "#B91C1C"];

const STAT_ICONS: Record<string, LucideIcon> = {
  donations: HandCoins,
  income: ArrowDownToLine,
  expenses: ArrowUpFromLine,
  balance: Wallet,
  members: Users,
  funds: Landmark,
  events: CalendarDays,
  requests: Inbox,
};

export function StatsCard({
  title,
  value,
  icon,
  color,
  bg,
  href,
}: {
  title: string;
  value: string;
  icon: string;
  color: string;
  bg: string;
  href?: string;
}) {
  const Icon = STAT_ICONS[icon] ?? HandCoins;
  const inner = (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
      <div className={`h-11 w-11 rounded-xl ${bg} flex items-center justify-center`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
    </div>
  );
  if (!href) {
    return <div className="bg-card rounded-2xl border shadow-sm p-5">{inner}</div>;
  }
  return (
    <Link
      href={href}
      className="bg-card rounded-2xl border shadow-sm p-5 hover:shadow-md transition-shadow"
    >
      {inner}
    </Link>
  );
}

export function MonthlyChart({ data }: { data: { name: string; donations: number; expenses: number }[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="name" fontSize={11} />
          <YAxis fontSize={11} />
          <Tooltip
            formatter={((value: unknown, name: unknown) => [
              formatCurrency(Number(value) || 0),
              name === "donations" ? "Donations" : "Expenses",
            ]) as never}
          />
          <Bar dataKey="donations" fill="#064E3B" name="donations" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expenses" fill="#B91C1C" name="expenses" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DonationFundChart({ data }: { data: { name: string; value: number }[] }) {
  if (!data.length) {
    return <p className="text-sm text-muted-foreground py-10 text-center">No donation data yet.</p>;
  }
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={((value: unknown) => formatCurrency(Number(value) || 0)) as never} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RecentDonationsTable({
  donations,
}: {
  donations: { donor_name: string; amount: number; status: string; donation_date: string; donation_funds?: { name: string } | null }[];
}) {
  if (!donations.length) {
    return <p className="text-sm text-muted-foreground py-6 text-center">No donations recorded yet.</p>;
  }
  return (
    <div className="overflow-x-auto -mx-6 px-6">
      <ul className="divide-y sm:hidden">
        {donations.map((d) => (
          <li key={d.donor_name + d.amount} className="py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{d.donor_name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {d.donation_funds?.name || "General"}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-semibold text-sm whitespace-nowrap">{formatCurrency(d.amount)}</p>
              <p className="text-xs capitalize whitespace-nowrap">{d.status}</p>
            </div>
          </li>
        ))}
      </ul>
      <table className="w-full text-sm hidden sm:table">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="py-2 font-medium">Donor</th>
            <th className="py-2 font-medium">Fund</th>
            <th className="py-2 font-medium text-right">Amount</th>
            <th className="py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {donations.map((d) => (
            <tr key={d.donor_name + d.amount}>
              <td className="py-2.5">{d.donor_name}</td>
              <td className="py-2.5">{d.donation_funds?.name || "General"}</td>
              <td className="py-2.5 text-right font-semibold">{formatCurrency(d.amount)}</td>
              <td className="py-2.5">
                <span className="capitalize">{d.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RecentActivityTable({
  activity,
}: {
  activity: { id: string; action: string; module: string; user_name: string | null; created_at: string }[];
}) {
  if (!activity.length) {
    return <p className="text-sm text-muted-foreground py-6 text-center">No activity yet.</p>;
  }
  return (
    <ul className="divide-y">
      {activity.map((a) => (
        <li key={a.id} className="py-2.5 flex items-start gap-3">
          <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm capitalize">
              <span className="font-medium">{a.action}</span> · {a.module}
            </p>
            <p className="text-xs text-muted-foreground">
              {a.user_name || "System"} · {timeAgo(a.created_at)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function QuickActions() {
  const actions = [
    { label: "Add Donation", href: "/admin/donations?new=1", icon: HandCoins },
    { label: "Add Expense", href: "/admin/expenses?new=1", icon: ArrowUpFromLine },
    { label: "Add Member", href: "/admin/members?new=1", icon: Users },
    { label: "Add Event", href: "/admin/events?new=1", icon: CalendarDays },
    { label: "Add Announcement", href: "/admin/announcements?new=1", icon: Megaphone },
  ];
  return (
    <div className="grid grid-cols-1 gap-3">
      {actions.map((a) => (
        <Link
          key={a.href}
          href={a.href}
          className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
        >
          <span className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <a.icon className="h-4 w-4 text-primary" />
          </span>
          {a.label}
        </Link>
      ))}
    </div>
  );
}
