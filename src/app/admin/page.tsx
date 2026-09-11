import { Metadata } from "next";
import Link from "next/link";
import {
  getDashboardStats,
  getDonationVsExpenseChart,
  getDonationsByFund,
  getRecentDonations,
  getRecentExpenses,
  getNewMembers,
  getRecentActivity,
} from "@/lib/queries/admin";
import {
  StatsCard,
  MonthlyChart,
  DonationFundChart,
  RecentDonationsTable,
  RecentActivityTable,
  QuickActions,
} from "@/components/admin/dashboard";
import { formatCurrency, timeAgo, cn } from "@/lib/utils/format";
import { createClient } from "@/lib/supabase/server";
import { isAdmin, roleHasPermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Dashboard",
};

function SectionCard({
  title,
  href,
  children,
  className,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6",
        className
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-foreground">
          <span className="h-2 w-2 rounded-full bg-[#C8A951]" />
          {title}
        </h2>
        {href && (
          <Link
            href={href}
            className="text-xs font-semibold text-primary transition-colors hover:text-[#065F46]"
          >
            View all
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export default async function AdminDashboard() {
  const [stats, chartData, fundData, recentDonations, recentExpenses, newMembers, activity] =
    await Promise.all([
      getDashboardStats(),
      getDonationVsExpenseChart(),
      getDonationsByFund(),
      getRecentDonations(),
      getRecentExpenses(),
      getNewMembers(),
      getRecentActivity(),
    ]);

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

  const admin = isAdmin(currentRole);
  const canViewDonations = roleHasPermission(currentRole, "donation.view");
  const canViewExpenses = roleHasPermission(currentRole, "expense.view");
  const canViewMembers = roleHasPermission(currentRole, "member.view");
  const canViewAudit = roleHasPermission(currentRole, "audit.view");

  const card = (
    title: string,
    value: string,
    icon: string,
    color: string,
    bg: string,
    href?: string
  ) => ({ title, value, icon, color, bg, href: admin ? href : undefined });

  const statCards = [
    card("Donations (This Month)", formatCurrency(stats.donationsThisMonth), "donations", "text-emerald-600", "bg-emerald-50", "/admin/donations"),
    card("Income (This Month)", formatCurrency(stats.incomeThisMonth), "income", "text-green-600", "bg-green-50", "/admin/income"),
    card("Expenses (This Month)", formatCurrency(stats.expensesThisMonth), "expenses", "text-red-600", "bg-red-50", "/admin/expenses"),
    card("Current Balance", formatCurrency(stats.currentBalance), "balance", "text-blue-600", "bg-blue-50", "/admin/reports"),
    card("Total Members", String(stats.totalMembers), "members", "text-purple-600", "bg-purple-50", "/admin/members"),
    card("Active Funds", String(stats.activeFunds), "funds", "text-amber-600", "bg-amber-50", "/admin/funds"),
    card("Upcoming Events", String(stats.upcomingEvents), "events", "text-cyan-600", "bg-cyan-50", "/admin/events"),
    card("Pending Requests", String(stats.pendingRequests), "requests", "text-orange-600", "bg-orange-50", "/admin/requests"),
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((s) => (
          <StatsCard key={s.title} {...s} />
        ))}
      </div>

      {/* Charts */}
      {canViewDonations && canViewExpenses && (
        <div className="grid gap-6 lg:grid-cols-3">
          <SectionCard title="Donation vs Expense (12 Months)" className="lg:col-span-2">
            <MonthlyChart data={chartData} />
          </SectionCard>
          <SectionCard title="Donations by Fund">
            <DonationFundChart data={fundData} />
          </SectionCard>
        </div>
      )}

      {/* Recent */}
      {(canViewDonations || canViewExpenses) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {canViewDonations && (
            <SectionCard title="Recent Donations" href="/admin/donations">
              <RecentDonationsTable donations={recentDonations} />
            </SectionCard>
          )}
          {canViewExpenses && (
            <SectionCard title="Recent Expenses" href="/admin/expenses">
              <ul className="divide-y divide-black/[0.05]">
                {recentExpenses.length === 0 && (
                  <li className="py-8 text-center text-sm text-muted-foreground">
                    No expenses recorded yet.
                  </li>
                )}
                {recentExpenses.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {e.expense_category}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {e.vendor || "—"} · {e.date}
                      </p>
                    </div>
                    <span className="shrink-0 font-bold text-rose-600">
                      {formatCurrency(e.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
        </div>
      )}

      {/* New members + activity + quick actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {canViewMembers && (
          <SectionCard title="New Members" href="/admin/members">
            <ul className="divide-y divide-black/[0.05]">
              {newMembers.length === 0 && (
                <li className="py-8 text-center text-sm text-muted-foreground">No members yet.</li>
              )}
              {newMembers.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{m.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.member_id}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(m.created_at)}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}
        {canViewAudit && (
          <SectionCard title="Recent Activity">
            <RecentActivityTable activity={activity} />
          </SectionCard>
        )}
        {isAdmin(currentRole) && (
          <SectionCard title="Quick Actions">
            <QuickActions />
          </SectionCard>
        )}
      </div>
    </div>
  );
}