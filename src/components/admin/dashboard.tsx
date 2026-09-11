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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHandHoldingHeart,
  faSackDollar,
  faArrowTrendUp,
  faWallet,
  faUsers,
  faCoins,
  faCalendarDays,
  faInbox,
  faHandHoldingDollar,
  faFileInvoiceDollar,
  faUserPlus,
  faCalendarPlus,
  faBullhorn,
  faChevronRight,
  faHandsPraying,
  faStarAndCrescent,
  faCircleUser,
  faUserShield,
  faCrown,
  faBookOpen,
  faBell,
  faUsersGear,
  faUserTie,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { formatCurrency, timeAgo, getInitials, cn } from "@/lib/utils/format";

const PIE_COLORS = ["#065F46", "#C8A951", "#10B981", "#B45309", "#15803D", "#6B7280", "#B91C1C"];

const HERO_ROLE_ICONS: Record<string, IconDefinition> = {
  super_admin: faCrown,
  admin: faUserShield,
  treasurer: faSackDollar,
  imam: faBookOpen,
  muazzin: faBell,
  committee_member: faUsersGear,
  staff: faUserTie,
  member: faCircleUser,
};

export function DashboardHero({
  firstName,
  roleLabel,
  role,
  hijriDate,
  today,
}: {
  firstName: string;
  roleLabel: string | null;
  role: string | null;
  hijriDate: string;
  today: string;
}) {
  const roleIcon = role ? (HERO_ROLE_ICONS[role] ?? faCircleUser) : null;
  return (
    <section className="islamic-pattern-dark relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#043d2e] via-[#065F46] to-[#047857] p-6 text-white shadow-lg sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#C8A951]/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/15 backdrop-blur">
            <FontAwesomeIcon icon={faStarAndCrescent} className="text-[#C8A951]" />
            {hijriDate}
          </span>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight sm:text-3xl">
            <FontAwesomeIcon icon={faHandsPraying} className="text-3xl text-[#C8A951]" />
            As-salāmu ʿalaykum, {firstName}!
          </h1>
          <p className="text-sm text-emerald-100/90">{today} — Here&apos;s what&apos;s happening at the mosque.</p>
        </div>
        {roleLabel && (
          <span className="inline-flex w-fit items-center gap-2.5 rounded-2xl bg-white/10 px-5 py-2.5 text-sm font-semibold ring-1 ring-white/15 backdrop-blur">
            {roleIcon && <FontAwesomeIcon icon={roleIcon} className="text-[#C8A951]" />}
            {roleLabel}
          </span>
        )}
      </div>
    </section>
  );
}

const STAT_ICONS: Record<string, IconDefinition> = {
  donations: faHandHoldingHeart,
  income: faSackDollar,
  expenses: faArrowTrendUp,
  balance: faWallet,
  members: faUsers,
  funds: faCoins,
  events: faCalendarDays,
  requests: faInbox,
};

const AVATAR_COLORS = [
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
];

function avatarColor(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

const MODULE_DOT: Record<string, string> = {
  donations: "bg-emerald-500",
  expenses: "bg-rose-500",
  income: "bg-green-500",
  members: "bg-violet-500",
  events: "bg-sky-500",
  announcements: "bg-amber-500",
  requests: "bg-orange-500",
  users: "bg-teal-500",
};

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
    failed: "bg-red-50 text-red-700 ring-red-600/20",
    refused: "bg-red-50 text-red-700 ring-red-600/20",
  };
  const style = styles[status] ?? "bg-slate-100 text-slate-600 ring-slate-500/20";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        style
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      <span className="capitalize">{status}</span>
    </span>
  );
}

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
  const Icon = STAT_ICONS[icon] ?? faHandHoldingHeart;
  const valueSize = value.length > 18 ? "text-base" : value.length > 13 ? "text-xl" : "text-2xl";
  const inner = (
    <>
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-70 blur-2xl transition-opacity duration-300 group-hover:opacity-100",
          bg
        )}
      />
      <div className="relative flex h-full flex-1 flex-col">
        <div className="flex min-w-0 flex-1 flex-col pr-12">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {title}
          </p>
          <p className={cn("mt-auto whitespace-nowrap pt-2 font-bold leading-tight tracking-tight text-foreground", valueSize)}>
            {value}
          </p>
        </div>
        <div
          className={cn(
            "absolute right-0 top-0 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base ring-1 ring-inset ring-black/5 shadow-sm",
            bg,
            color
          )}
        >
          <FontAwesomeIcon icon={Icon} />
        </div>
      </div>
    </>
  );

  const cardClass =
    "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#C8A951]/40 hover:shadow-xl";

  if (!href) {
    return <div className={cardClass}>{inner}</div>;
  }
  return (
    <Link href={href} className={cardClass}>
      {inner}
    </Link>
  );
}

function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="mb-3 flex items-center gap-4">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

const chartTooltipStyle = {
  backgroundColor: "#064E3B",
  border: "none",
  borderRadius: "0.75rem",
  color: "#ffffff",
  fontSize: "12px",
  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)",
} as const;

export function MonthlyChart({ data }: { data: { name: string; donations: number; expenses: number }[] }) {
  return (
    <div>
      <ChartLegend
        items={[
          { label: "Donations", color: "#065F46" },
          { label: "Expenses", color: "#B91C1C" },
        ]}
      />
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 0 }} barGap={4}>
            <defs>
              <linearGradient id="gradDonations" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#064E3B" />
              </linearGradient>
              <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F87171" />
                <stop offset="100%" stopColor="#B91C1C" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
            <XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false} dy={6} />
            <YAxis fontSize={11} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "rgba(6,78,59,0.05)" }}
              contentStyle={chartTooltipStyle}
              formatter={((value: unknown, name: unknown) => [
                formatCurrency(Number(value) || 0),
                name === "donations" ? "Donations" : "Expenses",
              ]) as never}
            />
            <Bar dataKey="donations" fill="url(#gradDonations)" name="donations" radius={[6, 6, 0, 0]} maxBarSize={28} />
            <Bar dataKey="expenses" fill="url(#gradExpenses)" name="expenses" radius={[6, 6, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function DonationFundChart({ data }: { data: { name: string; value: number }[] }) {
  if (!data.length) {
    return <p className="py-16 text-center text-sm text-muted-foreground">No donation data yet.</p>;
  }
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <div>
      <div className="relative h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={88}
              paddingAngle={3}
              cornerRadius={6}
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={chartTooltipStyle}
              formatter={((value: unknown) => formatCurrency(Number(value) || 0)) as never}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Total
          </span>
          <span className="text-lg font-bold text-foreground">{formatCurrency(total)}</span>
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {data.map((item, i) => {
          const pct = total ? Math.round((item.value / total) * 100) : 0;
          return (
            <li key={item.name} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="truncate font-medium text-foreground">{item.name}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                <span>{pct}%</span>
                <span className="font-semibold text-foreground">{formatCurrency(item.value)}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function RecentDonationsTable({
  donations,
}: {
  donations: { donor_name: string; amount: number; status: string; donation_date: string; donation_funds?: { name: string } | null }[];
}) {
  if (!donations.length) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No donations recorded yet.</p>;
  }
  return (
    <ul className="divide-y divide-black/[0.05]">
      {donations.map((d) => (
        <li key={d.donor_name + d.amount} className="flex items-center gap-3 py-3">
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
              avatarColor(d.donor_name)
            )}
          >
            {getInitials(d.donor_name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{d.donor_name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {d.donation_funds?.name || "General"} ·{" "}
              {new Date(d.donation_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="font-bold text-foreground">{formatCurrency(d.amount)}</span>
            <StatusPill status={d.status} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function RecentActivityTable({
  activity,
}: {
  activity: { id: string; action: string; module: string; user_name: string | null; created_at: string }[];
}) {
  if (!activity.length) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No activity yet.</p>;
  }
  return (
    <div className="relative">
      <div className="absolute bottom-2 left-[5px] top-2 w-px bg-black/[0.06]" />
      <ul className="space-y-3">
        {activity.map((a) => {
          const dot = MODULE_DOT[a.module] ?? "bg-slate-400";
          return (
            <li key={a.id} className="relative flex items-start gap-3">
              <span className={cn("relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-card", dot)} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">
                  <span className="font-semibold capitalize">{a.action}</span>{" "}
                  <span className="inline-flex rounded-full bg-black/[0.04] px-2 py-0.5 text-[11px] font-medium capitalize text-muted-foreground">
                    {a.module}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {a.user_name || "System"} · {timeAgo(a.created_at)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function QuickActions() {
  const actions = [
    { label: "Add Donation", href: "/admin/donations?new=1", icon: faHandHoldingDollar, accent: "from-emerald-500 to-teal-600" },
    { label: "Add Expense", href: "/admin/expenses?new=1", icon: faFileInvoiceDollar, accent: "from-rose-500 to-red-600" },
    { label: "Add Member", href: "/admin/members?new=1", icon: faUserPlus, accent: "from-violet-500 to-purple-600" },
    { label: "Add Event", href: "/admin/events?new=1", icon: faCalendarPlus, accent: "from-sky-500 to-blue-600" },
    { label: "Add Announcement", href: "/admin/announcements?new=1", icon: faBullhorn, accent: "from-amber-500 to-orange-600" },
  ];
  return (
    <div className="grid grid-cols-1 gap-3">
      {actions.map((a) => (
        <Link
          key={a.href}
          href={a.href}
          className="group flex items-center gap-3 rounded-xl border border-black/5 bg-white px-4 py-3 text-sm font-medium text-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
        >
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm transition-transform duration-200 group-hover:scale-110",
              a.accent
            )}
          >
            <FontAwesomeIcon icon={a.icon} className="h-4 w-4" />
          </span>
          {a.label}
          <span className="ml-auto text-muted-foreground transition-transform duration-200 group-hover:translate-x-1">
            <FontAwesomeIcon icon={faChevronRight} className="h-3.5 w-3.5" />
          </span>
        </Link>
      ))}
    </div>
  );
}