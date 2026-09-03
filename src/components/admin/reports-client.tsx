"use client";

import { BarChart3, TrendingUp, TrendingDown, Wallet } from "lucide-react";
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
import { formatCurrency, downloadCSV } from "@/lib/utils/format";

type MonthlyRow = { name: string; income: number; expenses: number };
type CategoryRow = { name: string; value: number };

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

  const statCards = [
    { title: "Total Income", value: totalIncome, icon: TrendingDown, color: "text-green-600", bg: "bg-green-50" },
    { title: "Total Expenses", value: totalExpense, icon: TrendingUp, color: "text-red-600", bg: "bg-red-50" },
    { title: "Net Balance", value: balance, icon: Wallet, color: "text-blue-600", bg: "bg-blue-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
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
        {statCards.map((card) => (
          <div key={card.title} className="flex items-start justify-between rounded-2xl border bg-card p-5 shadow-sm">
            <div>
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <p className={`mt-1 text-2xl font-bold ${card.value < 0 && card.title === "Net Balance" ? "text-red-600" : ""}`}>
                {formatCurrency(card.value, currency)}
              </p>
            </div>
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.bg}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="mb-4 font-semibold">Monthly Income vs Expenses</h2>
        {monthly.some((m) => m.income > 0 || m.expenses > 0) ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip
                  formatter={((value: unknown, name: unknown) => [
                    formatCurrency(Number(value) || 0, currency),
                    name === "income" ? "Income" : "Expenses",
                  ]) as never}
                />
                <Bar dataKey="income" fill="#15803D" name="income" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#B91C1C" name="expenses" radius={[4, 4, 0, 0]} />
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
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-green-600"
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
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-red-600"
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
