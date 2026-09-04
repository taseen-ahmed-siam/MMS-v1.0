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

  const statCards = [
    {
      title: "Donations (This Month)",
      value: formatCurrency(stats.donationsThisMonth),
      icon: "donations",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      href: "/admin/donations",
    },
    {
      title: "Income (This Month)",
      value: formatCurrency(stats.incomeThisMonth),
      icon: "income",
      color: "text-green-600",
      bg: "bg-green-50",
      href: "/admin/income",
    },
    {
      title: "Expenses (This Month)",
      value: formatCurrency(stats.expensesThisMonth),
      icon: "expenses",
      color: "text-red-600",
      bg: "bg-red-50",
      href: "/admin/expenses",
    },
    {
      title: "Current Balance",
      value: formatCurrency(stats.currentBalance),
      icon: "balance",
      color: "text-blue-600",
      bg: "bg-blue-50",
      href: "/admin/reports",
    },
    {
      title: "Total Members",
      value: String(stats.totalMembers),
      icon: "members",
      color: "text-purple-600",
      bg: "bg-purple-50",
      href: "/admin/members",
    },
    {
      title: "Active Funds",
      value: String(stats.activeFunds),
      icon: "funds",
      color: "text-amber-600",
      bg: "bg-amber-50",
      href: "/admin/funds",
    },
    {
      title: "Upcoming Events",
      value: String(stats.upcomingEvents),
      icon: "events",
      color: "text-cyan-600",
      bg: "bg-cyan-50",
      href: "/admin/events",
    },
    {
      title: "Pending Requests",
      value: String(stats.pendingRequests),
      icon: "requests",
      color: "text-orange-600",
      bg: "bg-orange-50",
      href: "/admin/requests",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your mosque&apos;s activities.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <StatsCard key={card.title} {...card} />
        ))}
      </div>

      {/* Charts */}
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

      {/* Recent */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border shadow-sm p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Donations</h2>
            <Link href="/admin/donations" className="text-primary text-sm font-medium hover:underline">
              View all
            </Link>
          </div>
          <RecentDonationsTable donations={recentDonations} />
        </div>
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
      </div>

      {/* New members + activity + quick actions */}
      <div className="grid lg:grid-cols-3 gap-6">
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
        <div className="bg-card rounded-2xl border shadow-sm p-6">
          <h2 className="font-semibold mb-4">Recent Activity</h2>
          <RecentActivityTable activity={activity} />
        </div>
        <div className="bg-card rounded-2xl border shadow-sm p-6">
          <h2 className="font-semibold mb-4">Quick Actions</h2>
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
