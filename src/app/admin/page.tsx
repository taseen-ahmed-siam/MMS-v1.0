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
import { formatCurrency } from "@/lib/utils/format";
import { timeAgo } from "@/lib/utils/format";
import { createClient } from "@/lib/supabase/server";
import { isAdmin, roleHasPermission } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Dashboard",
};

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
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of mosque&apos;s activities.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <StatsCard key={card.title} {...card} />
        ))}
      </div>

      {/* Charts */}
      {canViewDonations && canViewExpenses && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card rounded-2xl border shadow-sm p-6">
            <h2 className="font-semibold mb-4">Donation vs Expense (12 Months)</h2>
            <MonthlyChart data={chartData} />
          </div>
          <div className="bg-card rounded-2xl border shadow-sm p-6">
            <h2 className="font-semibold mb-4">Donations by Fund</h2>
            <DonationFundChart data={fundData} />
          </div>
        </div>
      )}

      {/* Recent */}
      {(canViewDonations || canViewExpenses) && (
        <div className="grid lg:grid-cols-2 gap-6">
          {canViewDonations && (
            <div className="bg-card rounded-2xl border shadow-sm p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Recent Donations</h2>
                <Link href="/admin/donations" className="text-primary text-sm font-medium hover:underline">
                  View all
                </Link>
              </div>
              <RecentDonationsTable donations={recentDonations} />
            </div>
          )}
          {canViewExpenses && (
            <div className="bg-card rounded-2xl border shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Recent Expenses</h2>
                <Link href="/admin/expenses" className="text-primary text-sm font-medium hover:underline">
                  View all
                </Link>
              </div>
              <ul className="divide-y">
                {recentExpenses.length === 0 && (
                  <li className="text-muted-foreground text-sm py-4 text-center">No expenses recorded yet.</li>
                )}
                {recentExpenses.map((e) => (
                  <li key={e.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{e.expense_category}</p>
                      <p className="text-xs text-muted-foreground">{e.vendor || "—"} · {e.date}</p>
                    </div>
                    <span className="font-semibold text-red-600">{formatCurrency(e.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* New members + activity + quick actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        {canViewMembers && (
          <div className="bg-card rounded-2xl border shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">New Members</h2>
              <Link href="/admin/members" className="text-primary text-sm font-medium hover:underline">
                View all
              </Link>
            </div>
            <ul className="divide-y">
              {newMembers.length === 0 && (
                <li className="text-muted-foreground text-sm py-4 text-center">No members yet.</li>
              )}
              {newMembers.map((m) => (
                <li key={m.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{m.full_name}</p>
                    <p className="text-xs text-muted-foreground">{m.member_id}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{timeAgo(m.created_at)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {canViewAudit && (
          <div className="bg-card rounded-2xl border shadow-sm p-6">
            <h2 className="font-semibold mb-4">Recent Activity</h2>
            <RecentActivityTable activity={activity} />
          </div>
        )}
        {isAdmin(currentRole) && (
          <div className="bg-card rounded-2xl border shadow-sm p-6">
            <h2 className="font-semibold mb-4">Quick Actions</h2>
            <QuickActions />
          </div>
        )}
      </div>
    </div>
  );
}
