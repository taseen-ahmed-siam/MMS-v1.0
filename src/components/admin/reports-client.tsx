"use client";

import { formatCurrency, downloadCSV } from "@/lib/utils/format";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartBar,
  faArrowTrendDown,
  faArrowTrendUp,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AdminTableWrapper } from "@/components/admin/table-wrapper";
import { PageActions } from "@/components/admin/page-actions";
import { Button } from "@/components/ui/button";

type MonthlyRow = { name: string; income: number; expenses: number };
type CategoryRow = { name: string; value: number };

const STAT_ICONS = [
  { key: "income", icon: faArrowTrendDown, color: "text-green-600", bg: "bg-green-50", accent: "from-green-500 to-emerald-600" },
  { key: "expenses", icon: faArrowTrendUp, color: "text-red-600", bg: "bg-red-50", accent: "from-rose-500 to-red-600" },
  { key: "balance", icon: faWallet, color: "text-blue-600", bg: "bg-blue-50", accent: "from-sky-500 to-blue-600" },
] as const;

function ReportsClient({
  monthly,
  expenseByCategory,
  incomeByCategory,
  currency,
}: {
  monthly: MonthlyRow[];
  expenseByCategory: CategoryRow[];
  incomeByCategory: CategoryRow[];
  currency: string;
}) {
  const totalIncome = monthly.reduce((sum, m) => sum + m.income, 0);
  const totalExpense = monthly.reduce((sum, m) => sum + m.expenses, 0);
  const balance = totalIncome - totalExpense;

  const maxCategoryValue = Math.max(
    1,
    ...expenseByCategory.map((c) => c.value),
    ...incomeByCategory.map((c) => c.value)
  );

  function handleExportCSV() {
    const rows = monthly.map((m) => [m.name, m.income, m.expenses]);
    downloadCSV(["Month", "Income", "Expenses"], rows, "financial-summary");
  }

  const statValues = [totalIncome, totalExpense, balance];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#064E3B]/10">
            <FontAwesomeIcon icon={faChartBar} className="h-5 w-5 text-[#064E3B]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Financial Reports</h1>
            <p className="text-sm text-muted-foreground">
              Monthly income, expenses, and category breakdowns for the current year.
            </p>
          </div>
        </div>
        <PageActions>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            Export CSV
          </Button>
        </PageActions>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STAT_ICONS.map((stat, i) => (
          <div key={stat.key} className="group relative overflow-hidden rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-70 blur-2xl transition-opacity duration-300 group-hover:opacity-100 ${stat.bg}`} />
            <div className="relative flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {stat.key === "income" ? "Total Income" : stat.key === "expenses" ? "Total Expenses" : "Net Balance"}
                </p>
                <p className={`mt-2 truncate text-2xl font-bold tracking-tight ${statValues[i] < 0 && stat.key === "balance" ? "text-red-600" : "text-foreground"}`}>
                  {formatCurrency(statValues[i], currency)}
                </p>
              </div>
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg ring-1 ring-inset ring-black/5 shadow-sm ${stat.bg} ${stat.color}`}>
                <FontAwesomeIcon icon={stat.icon} />
              </div>
            </div>
            <div className="relative mt-4 h-1 w-full overflow-hidden rounded-full bg-black/[0.04]">
              <div className={`h-full w-2/3 rounded-full bg-gradient-to-r ${stat.accent}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold">Monthly Income vs Expenses</h2>
        {monthly.some((m) => m.income > 0 || m.expenses > 0) ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                <XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false} />
                <YAxis fontSize={11} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#064E3B", border: "none", borderRadius: "0.75rem", color: "#fff", fontSize: "12px" }}
                  formatter={((value: unknown, name: unknown) => [
                    formatCurrency(Number(value) || 0, currency),
                    name === "income" ? "Income" : "Expenses",
                  ]) as never}
                />
                <Bar dataKey="income" fill="#15803D" name="income" radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Bar dataKey="expenses" fill="#B91C1C" name="expenses" radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No financial data recorded for this year yet.
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminTableWrapper title="Income by Category" description="Total income grouped by category">
          {incomeByCategory.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">No income data yet.</p>
          ) : (
            <div className="space-y-3 p-6 pt-2">
              {incomeByCategory.map((cat) => (
                <div key={cat.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">{cat.name}</span>
                    <span className="font-semibold text-green-600">{formatCurrency(cat.value, currency)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-black/[0.04]">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600"
                      style={{ width: `${(cat.value / maxCategoryValue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminTableWrapper>

        <AdminTableWrapper title="Expense by Category" description="Total expenses grouped by category">
          {expenseByCategory.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">No expense data yet.</p>
          ) : (
            <div className="space-y-3 p-6 pt-2">
              {expenseByCategory.map((cat) => (
                <div key={cat.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">{cat.name}</span>
                    <span className="font-semibold text-red-600">{formatCurrency(cat.value, currency)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-black/[0.04]">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600"
                      style={{ width: `${(cat.value / maxCategoryValue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminTableWrapper>
      </div>
    </div>
  );
}

export { ReportsClient };
