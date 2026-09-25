import { NextRequest, NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

type RawRow = {
  id: string;
  date: string;
  description: string;
  fundType: string;
  fundId: string | null;
  incomeAmount: number;
  expenseAmount: number;
  netBalance: number;
  isException: boolean;
  exceptionReason: string | null;
};

type Totals = { income: number; expenses: number; balance: number; exceptionCount: number };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_PATTERN = /^\d{4}-\d{2}$/;

function isValidDate(value: string) {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function monthBounds(value: string) {
  if (!MONTH_PATTERN.test(value)) return null;
  const [year, month] = value.split("-").map(Number);
  if (month < 1 || month > 12) return null;
  const start = `${value}-01`;
  const endDate = new Date(Date.UTC(year, month, 0));
  const end = endDate.toISOString().slice(0, 10);
  return { start, end };
}

function sumRows(rows: RawRow[]): Totals {
  return rows.reduce(
    (totals, row) => ({
      income: totals.income + row.incomeAmount,
      expenses: totals.expenses + row.expenseAmount,
      balance: totals.balance + row.incomeAmount - row.expenseAmount,
      exceptionCount: totals.exceptionCount + (row.isException ? 1 : 0),
    }),
    { income: 0, expenses: 0, balance: 0, exceptionCount: 0 }
  );
}

function getFundName(value: unknown) {
  if (Array.isArray(value)) return typeof value[0]?.name === "string" ? value[0].name : "General";
  if (value && typeof value === "object" && "name" in value && typeof value.name === "string") {
    return value.name;
  }
  return "General";
}

export async function GET(request: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (profile.status !== "active") return NextResponse.json({ error: "Your account is not active." }, { status: 403 });

  const searchParams = request.nextUrl.searchParams;
  const month = searchParams.get("month") || "";
  const fundId = searchParams.get("fundId") || "";
  const monthPeriod = month ? monthBounds(month) : null;
  if (month && !monthPeriod) return NextResponse.json({ error: "Invalid month." }, { status: 400 });

  const today = new Date().toISOString().slice(0, 10);
  const requestedFrom = monthPeriod?.start || searchParams.get("from") || `${today.slice(0, 4)}-01-01`;
  const requestedTo = monthPeriod?.end || searchParams.get("to") || today;
  if (!isValidDate(requestedFrom) || !isValidDate(requestedTo) || requestedFrom > requestedTo) {
    return NextResponse.json({ error: "Please provide a valid date range." }, { status: 400 });
  }

  const reportYear = Number(requestedTo.slice(0, 4));
  const ytdStart = `${reportYear}-01-01`;
  const queryFrom = requestedFrom < ytdStart ? requestedFrom : ytdStart;
  const supabase = createAdminClient();

  const [donations, incomes, expenses] = await Promise.all([
    supabase
      .from("donations")
      .select("id, donation_date, donor_name, amount, fund_id, notes, donation_funds(name)")
      .gte("donation_date", queryFrom)
      .lte("donation_date", requestedTo)
      .eq("status", "completed")
      .is("deleted_at", null),
    supabase
      .from("incomes")
      .select("id, date, source, income_category, amount, description")
      .gte("date", queryFrom)
      .lte("date", requestedTo)
      .is("deleted_at", null),
    supabase
      .from("expenses")
      .select("id, date, vendor, expense_category, amount, description, status")
      .gte("date", queryFrom)
      .lte("date", requestedTo)
      .neq("status", "rejected")
      .is("deleted_at", null),
  ]);

  const queryError = donations.error || incomes.error || expenses.error;
  if (queryError) {
    console.error("Financial report query failed", queryError);
    return NextResponse.json({ error: "Financial data could not be loaded." }, { status: 500 });
  }

  const allRows: RawRow[] = [
    ...(donations.data || []).map((row) => {
      return {
        id: `donation-${row.id}`,
        date: row.donation_date,
        description: row.notes || `Donation from ${row.donor_name || "anonymous donor"}`,
        fundType: getFundName(row.donation_funds),
        incomeAmount: Number(row.amount) || 0,
        expenseAmount: 0,
        netBalance: Number(row.amount) || 0,
        isException: false,
        exceptionReason: null,
        fundId: row.fund_id,
      };
    }),
    ...(incomes.data || []).map((row) => ({
      id: `income-${row.id}`,
      date: row.date,
      description: row.description || row.source || row.income_category,
      fundType: "General",
      incomeAmount: Number(row.amount) || 0,
      expenseAmount: 0,
      netBalance: Number(row.amount) || 0,
      isException: false,
      exceptionReason: null,
      fundId: null,
    })),
    ...(expenses.data || []).map((row) => ({
      id: `expense-${row.id}`,
      date: row.date,
      description: row.description || row.vendor || row.expense_category,
      fundType: "General",
      incomeAmount: 0,
      expenseAmount: Number(row.amount) || 0,
      netBalance: -((Number(row.amount) || 0)),
      isException: row.status === "pending" || row.status === "draft",
      exceptionReason: row.status === "pending" ? "Pending" : row.status === "draft" ? "Draft" : null,
      fundId: null,
    })),
  ];

  const fundRows = fundId ? allRows.filter((row) => row.fundId === fundId) : allRows;
  const periodRows = fundRows
    .filter((row) => row.date >= requestedFrom && row.date <= requestedTo)
    .sort((a, b) => b.date.localeCompare(a.date));
  const monthStart = `${requestedTo.slice(0, 8)}01`;
  const currentMonthRows = fundRows.filter((row) => row.date >= monthStart && row.date <= requestedTo);
  const ytdRows = fundRows.filter((row) => row.date >= ytdStart && row.date <= requestedTo);

  return NextResponse.json({
    rows: periodRows,
    totals: sumRows(periodRows),
    currentMonth: sumRows(currentMonthRows),
    ytd: sumRows(ytdRows),
    period: { from: requestedFrom, to: requestedTo },
  });
}
