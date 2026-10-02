"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpToLine,
  Download,
  FileText,
  Loader2,
  Printer,
  Search,
  WalletCards,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DonationFund } from "@/types/database";
import { EXPENSE_STATUSES } from "@/constants";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { PaginationBar } from "@/components/admin/pagination-bar";
import { StatusBadge } from "@/components/admin/status-badge";

type RowSource = "donation" | "income" | "expense";

type ReportRow = {
  id: string;
  date: string;
  description: string;
  fundType: string;
  source: RowSource;
  status: string;
  expenseCategory: string | null;
  incomeAmount: number;
  expenseAmount: number;
  netBalance: number;
  isException: boolean;
  exceptionReason: string | null;
};

type ReportTotals = {
  income: number;
  expenses: number;
  balance: number;
  exceptionCount: number;
};

type ReportResponse = {
  rows: ReportRow[];
  totals: ReportTotals;
  currentMonth: ReportTotals;
  ytd: ReportTotals;
  period: { from: string; to: string };
};

const PAGE_SIZE = 10;

const today = new Date();
const todayString = today.toISOString().slice(0, 10);
const monthStartString = new Date(today.getFullYear(), today.getMonth(), 1)
  .toISOString()
  .slice(0, 10);

// Emerald / gold ramp for donation data, soft red / orange ramp for expenses.
const FUND_COLORS = ["#065f46", "#0f766e", "#c8a951", "#047857", "#a16207"];
const EXPENSE_COLORS = ["#fb7185", "#f97316", "#f43f5e", "#fb923c", "#e11d48", "#fdba74"];

const STATUS_BADGE_CONFIG = [
  { value: "completed", label: "Completed", color: "text-emerald-600" },
  { value: "recorded", label: "Recorded", color: "text-emerald-600" },
  ...EXPENSE_STATUSES.map(({ value, label, color }) => ({ value, label, color })),
];

const tooltipStyle = {
  background: "#17201c",
  border: "0",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "12px",
};

type BreakdownItem = { name: string; value: number };

const EXPENSE_BUCKETS: { label: string; match: (category: string) => boolean }[] = [
  { label: "Electricity", match: (c) => c === "Electricity" },
  { label: "Salary", match: (c) => /salary/i.test(c) },
  { label: "Maintenance", match: (c) => c === "Maintenance" },
  { label: "Cleaning", match: (c) => c === "Cleaning" },
  { label: "Construction", match: (c) => c === "Construction" },
];

function roundAmount(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function bucketExpenseCategory(category: string | null) {
  const name = category || "Other";
  return EXPENSE_BUCKETS.find((bucket) => bucket.match(name))?.label ?? "Other";
}

function formatCsvAmount(value: unknown) {
  const amount = Number(value);
  return (Number.isFinite(amount) ? amount : 0).toFixed(2);
}

function escapeCsvValue(value: unknown) {
  const text = String(value ?? "");
  return /[\",\r\n]/.test(text) ? `\"${text.replace(/\"/g, '\"\"')}\"` : text;
}

export function ReportsClient({
  funds,
  currency,
}: {
  funds: Pick<DonationFund, "id" | "name">[];
  currency: string;
}) {
  const [from, setFrom] = useState(monthStartString);
  const [to, setTo] = useState(todayString);
  const [month, setMonth] = useState("");
  const [fundId, setFundId] = useState("");
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    else {
      if (from) params.set("from", from);
      if (to) params.set("to", to);
    }
    if (fundId) params.set("fundId", fundId);

    setLoading(true);
    setError(null);
    fetch(`/api/admin/reports?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json()) as ReportResponse & { error?: string };
        if (!response.ok) throw new Error(body.error || "Unable to load the report.");
        return body;
      })
      .then(setReport)
      .catch((reason: unknown) => {
        if ((reason as { name?: string })?.name !== "AbortError") {
          setError(reason instanceof Error ? reason.message : "Unable to load the report.");
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [from, to, month, fundId]);

  const selectedFundName = funds.find((fund) => fund.id === fundId)?.name;
  const reportTitle = selectedFundName ? `${selectedFundName} financial report` : "Consolidated financial report";
  const rows = useMemo(() => report?.rows || [], [report?.rows]);
  const chartData = useMemo(() => buildChartData(rows), [rows]);
  const fundData = useMemo(() => buildFundData(rows), [rows]);
  const expenseData = useMemo(() => buildExpenseData(rows), [rows]);
  const showFundData = !fundId;

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (typeFilter === "income" && row.incomeAmount <= 0) return false;
      if (typeFilter === "expense" && row.expenseAmount <= 0) return false;
      if (!term) return true;
      return (
        row.description.toLowerCase().includes(term) ||
        row.fundType.toLowerCase().includes(term) ||
        (row.expenseCategory || "").toLowerCase().includes(term)
      );
    });
  }, [rows, search, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedRows = useMemo(
    () => filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredRows, safePage]
  );

  const resetFilters = () => {
    setFrom(monthStartString);
    setTo(todayString);
    setMonth("");
    setFundId("");
    setSearch("");
    setTypeFilter("");
    setPage(1);
  };

  const exportCsv = () => {
    if (!report) return;
    const transactionRows = report.rows.map((row) => {
      const incomeAmount = Number(row.incomeAmount) || 0;
      const expenseAmount = Number(row.expenseAmount) || 0;
      const netBalance = Number(row.netBalance ?? (incomeAmount - expenseAmount)) || 0;
      const hasIncome = incomeAmount > 0;
      const hasExpense = expenseAmount > 0;
      const type = hasIncome && hasExpense ? "Income/Expense" : hasIncome ? "Income" : hasExpense ? "Expense" : "Net";
      const amount = hasIncome && hasExpense ? netBalance : incomeAmount || expenseAmount || netBalance;
      return [row.date, row.description, row.fundType, type, formatCsvAmount(amount), formatCsvAmount(netBalance)];
    });
    const lines = [
      ["Date", "Description", "Fund", "Type", "Amount", "Balance"],
      ...transactionRows,
      ["", "TOTAL INCOME", "", "", formatCsvAmount(report.totals.income), ""],
      ["", "TOTAL EXPENSES", "", "", formatCsvAmount(report.totals.expenses), ""],
      ["", "NET BALANCE", "", "", "", formatCsvAmount(report.totals.balance)],
    ];
    const csv = lines.map((line) => line.map(escapeCsvValue).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `financial-report-${report.period.from}-to-${report.period.to}.csv`;
    document.body.appendChild(link);
    link.click();
    window.setTimeout(() => {
      link.remove();
      URL.revokeObjectURL(url);
    }, 1000);
  };

  return (
    <div className="space-y-4">
      <header className="islamic-pattern-dark relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#043d2e] via-[#065f46] to-[#087f5b] px-4 py-3 text-white shadow-sm print:hidden sm:px-5">
        <div className="relative flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-lg font-bold tracking-tight sm:text-xl">Financial Reports</h1>
              <p className="mt-0.5 truncate text-xs text-emerald-50/80">
                {report ? `${formatDate(report.period.from)} – ${formatDate(report.period.to)}` : "Loading period…"}
                {selectedFundName ? ` · ${selectedFundName}` : " · All funds"}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button type="button" className="h-8 border-white/25 bg-white/10 px-3 text-xs text-white hover:bg-white/20" variant="outline" size="sm" onClick={exportCsv} disabled={!report}>
                <Download className="h-3.5 w-3.5" /> CSV
              </Button>
              <Button type="button" className="h-8 bg-[#c8a951] px-3 text-xs text-[#17201c] hover:bg-[#d8bb68]" size="sm" onClick={() => window.print()} disabled={!report || loading}>
                <Printer className="h-3.5 w-3.5" /> Print / PDF
              </Button>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
            <FilterInput label="Start date" type="date" value={from} onChange={(value) => { setFrom(value); setMonth(""); }} dark />
            <FilterInput label="End date" type="date" value={to} min={from} onChange={(value) => { setTo(value); setMonth(""); }} dark />
            <FilterInput label="Month" type="month" value={month} onChange={setMonth} dark />
            <label className="text-[11px] font-semibold text-emerald-50/70">
              Fund
              <select value={fundId} onChange={(event) => setFundId(event.target.value)} className="mt-1 h-8 w-full rounded-md border border-white/25 bg-white/10 px-2 text-xs font-normal text-white outline-none focus:ring-2 focus:ring-white/40 [&>option]:text-foreground">
                <option value="">All Funds</option>
                {funds.map((fund) => <option key={fund.id} value={fund.id}>{fund.name}</option>)}
              </select>
            </label>
            <Button variant="ghost" size="sm" className="h-8 self-end px-2 text-xs text-white hover:bg-white/15" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border bg-white py-20 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading financial data…
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-16 text-center text-sm text-red-700">{error}</div>
      ) : report ? (
        <>
          <section className="grid grid-cols-2 gap-2.5 print:hidden sm:gap-3 lg:grid-cols-4">
            <KpiCard label="Total income" value={report.totals.income} currency={currency} icon={<ArrowDownToLine />} accent="emerald" caption={`${rows.filter((row) => row.incomeAmount > 0).length} income entries`} />
            <KpiCard label="Total expenses" value={report.totals.expenses} currency={currency} icon={<ArrowUpToLine />} accent="rose" caption={`${rows.filter((row) => row.expenseAmount > 0).length} expense entries`} />
            <KpiCard label="Net balance" value={report.totals.balance} currency={currency} icon={<WalletCards />} accent={report.totals.balance >= 0 ? "gold" : "rose"} caption={report.totals.balance >= 0 ? "Surplus for this period" : "Deficit for this period"} />
            <KpiCard label="Pending approvals" value={report.totals.exceptionCount} currency="" icon={<FileText />} accent={report.totals.exceptionCount ? "amber" : "emerald"} caption={report.totals.exceptionCount ? "Awaiting review" : "Nothing to review"} integer />
          </section>

          <section className="print:hidden">
            <ChartCard title="Income vs expenses" subtitle="Monthly movement across the selected period" empty={!chartData.length}>
              {chartData.length ? (
                <div className="h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barGap={6}>
                      <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} />
                      <YAxis axisLine={false} tickLine={false} width={56} tick={{ fontSize: 10, fill: "#6b7280" }} tickFormatter={(value) => compactNumber(value)} />
                      <Tooltip contentStyle={tooltipStyle} formatter={((value: unknown, name: unknown) => [formatCurrency(Number(value) || 0, currency), name === "income" ? "Income" : "Expenses"]) as never} />
                      <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                      <Bar dataKey="expenses" fill="#fb7185" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <EmptyChart />}
            </ChartCard>
          </section>

          <section className={`grid gap-3 print:hidden ${showFundData ? "lg:grid-cols-2" : ""}`}>
            {showFundData && (
              <BreakdownCard title="Donation distribution by fund" subtitle="Completed donations grouped by fund" empty={!fundData.length} emptyMessage="No donations recorded for this period">
                <BreakdownBars items={fundData} colors={FUND_COLORS} currency={currency} />
              </BreakdownCard>
            )}
            <BreakdownCard title="Expense breakdown" subtitle="Where the money went" empty={!expenseData.length} emptyMessage="No expenses recorded for this period">
              <BreakdownBars items={expenseData} colors={EXPENSE_COLORS} currency={currency} />
            </BreakdownCard>
          </section>

          <MonthlySummaryTable data={chartData} currency={currency} totals={report.totals} />

          <section id="financial-report-preview" className="overflow-hidden rounded-xl border bg-white shadow-sm print:hidden">
            <div className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold">{reportTitle}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {filteredRows.length} of {rows.length} transactions · YTD balance{" "}
                  <strong className="text-foreground">{formatCurrency(report.ytd.balance, currency)}</strong>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                    placeholder="Search transactions…"
                    aria-label="Search transactions"
                    className="h-8 w-full rounded-md border bg-background pl-8 pr-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 sm:w-52"
                  />
                </div>
                <select
                  value={typeFilter}
                  onChange={(event) => { setTypeFilter(event.target.value); setPage(1); }}
                  aria-label="Filter by type"
                  className="h-8 rounded-md border bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">All types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
            </div>

            {pagedRows.length ? (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[820px] text-sm">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-semibold">Date</th>
                        <th className="px-4 py-2.5 text-left font-semibold">Description</th>
                        <th className="px-4 py-2.5 text-left font-semibold">Fund</th>
                        <th className="px-4 py-2.5 text-left font-semibold">Status</th>
                        <th className="px-4 py-2.5 text-right font-semibold">Income</th>
                        <th className="px-4 py-2.5 text-right font-semibold">Expense</th>
                        <th className="px-4 py-2.5 text-right font-semibold">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {pagedRows.map((row) => (
                        <tr key={row.id} className={row.isException ? "bg-amber-50/60" : "hover:bg-slate-50/70"}>
                          <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">{formatDate(row.date)}</td>
                          <td className="max-w-[260px] truncate px-4 py-2.5 font-medium">{row.description}</td>
                          <td className="px-4 py-2.5 text-xs text-muted-foreground">{row.fundType}</td>
                          <td className="px-4 py-2.5"><StatusBadge status={row.status} statuses={STATUS_BADGE_CONFIG} /></td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-emerald-700">{row.incomeAmount ? formatCurrency(row.incomeAmount, currency) : "—"}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-rose-700">{row.expenseAmount ? formatCurrency(row.expenseAmount, currency) : "—"}</td>
                          <td className={`px-4 py-2.5 text-right font-semibold tabular-nums ${row.netBalance < 0 ? "text-rose-700" : ""}`}>{formatCurrency(row.netBalance, currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="divide-y md:hidden">
                  {pagedRows.map((row) => (
                    <article key={row.id} className={`px-4 py-3.5 ${row.isException ? "bg-amber-50/60" : ""}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-snug break-words">{row.description}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {formatDate(row.date)} <span className="mx-1">·</span> {row.fundType}
                          </p>
                        </div>
                        <p className={`shrink-0 text-sm font-bold tabular-nums ${row.netBalance < 0 ? "text-rose-700" : "text-foreground"}`}>
                          {formatCurrency(row.netBalance, currency)}
                        </p>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <StatusBadge status={row.status} statuses={STATUS_BADGE_CONFIG} />
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Balance</p>
                      </div>

                      <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-md bg-emerald-50 px-2.5 py-1.5">
                          <p className="text-[10px] uppercase tracking-wide text-emerald-700/70">Income</p>
                          <p className="mt-0.5 font-semibold tabular-nums text-emerald-700">{row.incomeAmount ? formatCurrency(row.incomeAmount, currency) : "—"}</p>
                        </div>
                        <div className="rounded-md bg-rose-50 px-2.5 py-1.5">
                          <p className="text-[10px] uppercase tracking-wide text-rose-700/70">Expense</p>
                          <p className="mt-0.5 font-semibold tabular-nums text-rose-700">{row.expenseAmount ? formatCurrency(row.expenseAmount, currency) : "—"}</p>
                        </div>
                      </div>

                      {row.isException && row.exceptionReason && (
                        <span className="mt-2.5 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                          {row.exceptionReason}
                        </span>
                      )}
                    </article>
                  ))}
                </div>
                <div className="border-t px-4 py-3">
                  <PaginationBar page={safePage} totalPages={totalPages} total={filteredRows.length} onPageChange={setPage} />
                </div>
              </>
            ) : (
              <div className="px-5 py-14 text-center text-sm text-muted-foreground">
                {rows.length ? "No transactions match your search." : "No financial activity matches the selected filters."}
              </div>
            )}
          </section>
          <PrintReport
            report={report}
            title={reportTitle}
            currency={currency}
            fundName={selectedFundName}
          />
        </>
      ) : null}
    </div>
  );
}

function PrintReport({
  report,
  title,
  currency,
  fundName,
}: {
  report: ReportResponse;
  title: string;
  currency: string;
  fundName?: string;
}) {
  return (
    <section className="hidden print:block">
      <div className="mb-5 border-b-2 border-slate-900 pb-3">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {formatDate(report.period.from)} – {formatDate(report.period.to)}
          {fundName ? ` · Fund: ${fundName}` : " · All funds"}
        </p>
      </div>
      <div className="mb-5 grid grid-cols-3 gap-4">
        <PrintMetric label="Total income" value={formatCurrency(report.totals.income, currency)} />
        <PrintMetric label="Total expenses" value={formatCurrency(report.totals.expenses, currency)} />
        <PrintMetric label="Net balance" value={formatCurrency(report.totals.balance, currency)} />
      </div>
      <table className="w-full border-collapse text-[10px]">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-300 px-2 py-2 text-left">Date</th>
            <th className="border border-slate-300 px-2 py-2 text-left">Description</th>
            <th className="border border-slate-300 px-2 py-2 text-left">Fund type</th>
            <th className="border border-slate-300 px-2 py-2 text-right">Income</th>
            <th className="border border-slate-300 px-2 py-2 text-right">Expense</th>
            <th className="border border-slate-300 px-2 py-2 text-right">Net balance</th>
          </tr>
        </thead>
        <tbody>
          {report.rows.map((row) => (
            <tr key={row.id}>
              <td className="border border-slate-300 px-2 py-1.5">{formatDate(row.date)}</td>
              <td className="border border-slate-300 px-2 py-1.5">
                {row.description}
                {row.isException ? ` [${row.exceptionReason}]` : ""}
              </td>
              <td className="border border-slate-300 px-2 py-1.5">{row.fundType}</td>
              <td className="border border-slate-300 px-2 py-1.5 text-right">{row.incomeAmount ? formatCurrency(row.incomeAmount, currency) : "—"}</td>
              <td className="border border-slate-300 px-2 py-1.5 text-right">{row.expenseAmount ? formatCurrency(row.expenseAmount, currency) : "—"}</td>
              <td className="border border-slate-300 px-2 py-1.5 text-right">{formatCurrency(row.netBalance, currency)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold">
            <td colSpan={3} className="border border-slate-300 px-2 py-2">Report totals</td>
            <td className="border border-slate-300 px-2 py-2 text-right">{formatCurrency(report.totals.income, currency)}</td>
            <td className="border border-slate-300 px-2 py-2 text-right">{formatCurrency(report.totals.expenses, currency)}</td>
            <td className="border border-slate-300 px-2 py-2 text-right">{formatCurrency(report.totals.balance, currency)}</td>
          </tr>
        </tfoot>
      </table>
      <p className="mt-4 text-[9px] text-slate-500">
        Generated from the financial report preview · {report.rows.length} transaction(s)
      </p>
    </section>
  );
}

function PrintMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-slate-300 px-3 py-2">
      <p className="text-[9px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}

function FilterInput({ label, type, value, min, onChange, dark = false }: { label: string; type: string; value: string; min?: string; onChange: (value: string) => void; dark?: boolean }) {
  const labelClass = dark ? "text-[11px] font-semibold text-emerald-50/70" : "text-xs font-semibold text-muted-foreground";
  const inputClass = dark
    ? "mt-1 h-8 w-full rounded-md border border-white/25 bg-white/10 px-2 text-xs font-normal text-white outline-none focus:ring-2 focus:ring-white/40"
    : "mt-1 h-9 w-full rounded-md border bg-background px-2.5 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-primary/20";
  return (
    <label className={labelClass}>
      {label}
      <input type={type} value={value} min={min} onChange={(event) => onChange(event.target.value)} className={inputClass} />
    </label>
  );
}

const ACCENT_RULES: Record<string, string> = {
  emerald: "before:bg-emerald-600",
  rose: "before:bg-rose-500",
  gold: "before:bg-[#c8a951]",
  amber: "before:bg-amber-500",
};

const ICON_TONES: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-700",
  rose: "bg-rose-50 text-rose-700",
  gold: "bg-amber-50 text-[#a16207]",
  amber: "bg-amber-50 text-amber-700",
};

function KpiCard({ label, value, currency, icon, accent, caption, integer = false }: { label: string; value: number; currency: string; icon: React.ReactNode; accent: "emerald" | "rose" | "gold" | "amber"; caption: string; integer?: boolean }) {
  return (
    <div className={`relative flex flex-col overflow-hidden rounded-xl border bg-white p-3.5 pt-4 before:absolute before:inset-x-0 before:top-0 before:h-[3px] ${ACCENT_RULES[accent]}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <span className={`shrink-0 rounded-md p-1.5 ${ICON_TONES[accent]}`}>{icon}</span>
      </div>
      <p className="mt-1.5 break-words text-lg font-bold leading-tight tracking-tight sm:text-xl">
        {integer ? value : formatCurrency(value, currency)}
      </p>
      <p className="mt-auto pt-1.5 text-xs leading-4 text-muted-foreground">{caption}</p>
    </div>
  );
}

function ChartCard({ title, subtitle, children, empty = false }: { title: string; subtitle: string; children: React.ReactNode; empty?: boolean }) {
  return (
    <div className={`flex flex-col rounded-xl border bg-white p-4 shadow-sm ${empty ? "min-h-0" : "min-h-[340px]"}`}>
      <div className="mb-3 shrink-0">
        <h2 className="text-sm font-bold">{title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className={empty ? "" : "min-h-0 flex-1"}>{children}</div>
    </div>
  );
}

function BreakdownCard({ title, subtitle, empty, emptyMessage, children }: { title: string; subtitle: string; empty: boolean; emptyMessage: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded-xl border bg-white p-4 shadow-sm">
      <div className="mb-3 shrink-0">
        <h2 className="text-sm font-bold">{title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {empty ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg bg-slate-50 px-5 text-center text-sm font-medium text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="min-h-0 flex-1">{children}</div>
      )}
    </div>
  );
}

function BreakdownBars({ items, colors, currency }: { items: BreakdownItem[]; colors: string[]; currency: string }) {
  const max = items.reduce((peak, item) => Math.max(peak, item.value), 0) || 1;
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-2.5">
      {items.map((item, index) => {
        const color = colors[index % colors.length];
        const share = total ? Math.round((item.value / total) * 100) : 0;
        return (
          <div key={item.name}>
            <div className="mb-1 flex items-center justify-between gap-3 text-xs">
              <span className="flex min-w-0 items-center gap-2 font-medium">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                <span className="truncate">{item.name}</span>
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {formatCurrency(item.value, currency)}
                <span className="ml-1.5 text-[11px] text-muted-foreground/70">{share}%</span>
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full" style={{ width: `${(item.value / max) * 100}%`, backgroundColor: color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

type MonthlySummaryRow = { key: string; label: string; income: number; expenses: number; balance: number };

function MonthlySummaryTable({ data, currency, totals }: { data: MonthlySummaryRow[]; currency: string; totals: ReportTotals }) {
  if (!data.length) return null;

  return (
    <section className="overflow-hidden rounded-xl border bg-white shadow-sm print:hidden">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-bold">Monthly summary</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Income, expense and net balance for each month in the period</p>
      </div>
      <div className="divide-y md:hidden">
        {data.map((row) => (
          <article key={row.key} className="px-4 py-3.5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold">{row.label}</p>
              <p className={`shrink-0 text-sm font-bold tabular-nums ${row.balance < 0 ? "text-rose-700" : "text-foreground"}`}>
                {formatCurrency(row.balance, currency)}
              </p>
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md bg-emerald-50 px-2.5 py-1.5">
                <p className="text-[10px] uppercase tracking-wide text-emerald-700/70">Income</p>
                <p className="mt-0.5 font-semibold tabular-nums text-emerald-700">{row.income ? formatCurrency(row.income, currency) : "—"}</p>
              </div>
              <div className="rounded-md bg-rose-50 px-2.5 py-1.5">
                <p className="text-[10px] uppercase tracking-wide text-rose-700/70">Expense</p>
                <p className="mt-0.5 font-semibold tabular-nums text-rose-700">{row.expenses ? formatCurrency(row.expenses, currency) : "—"}</p>
              </div>
            </div>
          </article>
        ))}
        <div className="flex items-center justify-between gap-3 bg-slate-50 px-4 py-3 text-sm font-bold">
          <span>Period total</span>
          <span className={`tabular-nums ${totals.balance < 0 ? "text-rose-700" : ""}`}>{formatCurrency(totals.balance, currency)}</span>
        </div>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold">Month</th>
              <th className="px-4 py-2.5 text-right font-semibold">Income</th>
              <th className="px-4 py-2.5 text-right font-semibold">Expense</th>
              <th className="px-4 py-2.5 text-right font-semibold">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((row) => (
              <tr key={row.key} className="hover:bg-slate-50/70">
                <td className="px-4 py-2.5 font-medium">{row.label}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-emerald-700">{row.income ? formatCurrency(row.income, currency) : "—"}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-rose-700">{row.expenses ? formatCurrency(row.expenses, currency) : "—"}</td>
                <td className={`px-4 py-2.5 text-right font-semibold tabular-nums ${row.balance < 0 ? "text-rose-700" : ""}`}>
                  {formatCurrency(row.balance, currency)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 bg-slate-50 font-bold">
            <tr>
              <td className="px-4 py-3">Period total</td>
              <td className="px-4 py-3 text-right tabular-nums text-emerald-700">{formatCurrency(totals.income, currency)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-rose-700">{formatCurrency(totals.expenses, currency)}</td>
              <td className={`px-4 py-3 text-right tabular-nums ${totals.balance < 0 ? "text-rose-700" : ""}`}>{formatCurrency(totals.balance, currency)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

function EmptyChart({ message = "No amount recorded for this period" }: { message?: string }) {
  return <div className="flex min-h-[220px] w-full items-center justify-center rounded-lg bg-slate-50 px-5 text-center text-sm font-medium text-muted-foreground">{message}</div>;
}

function buildChartData(rows: ReportRow[]): MonthlySummaryRow[] {
  const groups = new Map<string, MonthlySummaryRow>();
  rows.forEach((row) => {
    const key = row.date.slice(0, 7);
    const date = new Date(`${key}-01T00:00:00Z`);
    const current = groups.get(key) || {
      key,
      label: date.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" }),
      income: 0,
      expenses: 0,
      balance: 0,
    };
    current.income += row.incomeAmount;
    current.expenses += row.expenseAmount;
    current.balance = roundAmount(current.income - current.expenses);
    groups.set(key, current);
  });
  return Array.from(groups.values()).sort((a, b) => a.key.localeCompare(b.key));
}

function buildFundData(rows: ReportRow[]): BreakdownItem[] {
  const totals = new Map<string, number>();
  rows.forEach((row) => {
    if (row.source !== "donation") return;
    totals.set(row.fundType, (totals.get(row.fundType) || 0) + row.incomeAmount);
  });
  return Array.from(totals.entries())
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
}

function buildExpenseData(rows: ReportRow[]): BreakdownItem[] {
  const totals = new Map<string, number>();
  rows.forEach((row) => {
    if (row.source !== "expense" || row.expenseAmount <= 0) return;
    const bucket = bucketExpenseCategory(row.expenseCategory);
    totals.set(bucket, (totals.get(bucket) || 0) + row.expenseAmount);
  });
  return Array.from(totals.entries())
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
}

function compactNumber(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}m`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}
