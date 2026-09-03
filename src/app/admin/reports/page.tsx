import { Metadata } from "next";
import {
  getMonthlyFinancialSummary,
  getExpenseByCategory,
  getIncomeByCategory,
} from "@/lib/queries/admin";
import { getMosqueSettings } from "@/lib/queries/public";
import { ReportsClient } from "@/components/admin/reports-client";

export const metadata: Metadata = {
  title: "Reports",
};

export default async function AdminReportsPage() {
  const [monthly, expenseByCategory, incomeByCategory, settings] = await Promise.all([
    getMonthlyFinancialSummary(),
    getExpenseByCategory(),
    getIncomeByCategory(),
    getMosqueSettings(),
  ]);

  const currency = settings?.currency || "৳";

  return (
    <ReportsClient
      monthly={monthly}
      expenseByCategory={expenseByCategory}
      incomeByCategory={incomeByCategory}
      currency={currency}
    />
  );
}
