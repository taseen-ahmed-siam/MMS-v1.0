"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpToLine,
  CalendarDays,
  Download,
  FileText,
  Loader2,
  Printer,
  WalletCards,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DonationFund } from "@/types/database";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";

type ReportRow = {
  id: string;
  date: string;
  description: string;
  fundType: string;
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

const today = new Date();
const todayString = today.toISOString().slice(0, 10);
const monthStartString = new Date(today.getFullYear(), today.getMonth(), 1)
  .toISOString()
  .slice(0, 10);
const chartColors = ["#065f46", "#c8a951", "#0f766e", "#64748b", "#b45309", "#be123c"];
const tooltipStyle = {
  background: "#17201c",
  border: "0",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "12px",
};

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
  const chartData = useMemo(() => buildChartData(report?.rows || []), [report?.rows]);
  const fundData = useMemo(() => buildFundData(report?.rows || []), [report?.rows]);
  const exceptionRows = report?.rows.filter((row) => row.isException) || [];

  const resetFilters = () => {
    setFrom(monthStartString);
    setTo(todayString);
    setMonth("");
    setFundId("");
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
    <div className="space-y-5">
      <header className="islamic-pattern-dark relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#043d2e] via-[#065f46] to-[#087f5b] px-4 py-4 text-white shadow-lg print:hidden sm:px-7 sm:py-5">
        <div className="pointer-events-none absolute -right-10 -top-20 h-56 w-56 rounded-full bg-[#c8a951]/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">Finance overview</p>
            <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-3xl">Financial reports</h1>
            <p className="mt-1 text-xs text-emerald-50/80 sm:text-sm">
              {report ? `${formatDate(report.period.from)} – ${formatDate(report.period.to)}` : "Live financial intelligence"}
              {selectedFundName ? ` · ${selectedFundName}` : " · All funds"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 print:hidden">
            <Button type="button" className="h-10 border-white/20 bg-white/10 text-white hover:bg-white/20" variant="outline" size="sm" onClick={exportCsv} disabled={!report}>
              <Download /> CSV
            </Button>
            <Button type="button" className="h-10 bg-[#c8a951] text-[#17201c] hover:bg-[#d8bb68]" size="sm" onClick={() => window.print()} disabled={!report || loading}>
              <Printer /> Print / PDF
            </Button>
          </div>
        </div>
      </header>

      <section className="rounded-xl border bg-white px-3 py-3 shadow-sm print:hidden sm:px-4" aria-label="Report filters">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="flex shrink-0 items-center gap-2 pr-2 xl:border-r">
            <CalendarDays className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Filters</span>
          </div>
          <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <FilterInput label="Start date" type="date" value={from} onChange={(value) => { setFrom(value); setMonth(""); }} />
            <FilterInput label="End date" type="date" value={to} min={from} onChange={(value) => { setTo(value); setMonth(""); }} />
            <FilterInput label="Month-wise" type="month" value={month} onChange={setMonth} />
            <label className="text-xs font-semibold text-muted-foreground">
              Fund
              <select value={fundId} onChange={(event) => setFundId(event.target.value)} className="mt-1 h-9 w-full rounded-md border bg-background px-2.5 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">All Funds</option>
                {funds.map((fund) => <option key={fund.id} value={fund.id}>{fund.name}</option>)}
              </select>
            </label>
          </div>
          <Button variant="ghost" size="sm" className="h-9 shrink-0 justify-self-end px-2" onClick={resetFilters}>Reset filters</Button>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border bg-white py-20 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading financial data…
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-16 text-center text-sm text-red-700">{error}</div>
      ) : report ? (
        <>
          <section className="grid grid-cols-2 gap-2.5 print:hidden sm:gap-3 xl:grid-cols-4">
            <KpiCard label="Total income" value={report.totals.income} currency={currency} icon={<ArrowDownToLine />} tone="green" caption={`${report.rows.filter((row) => row.incomeAmount > 0).length} entries`} />
            <KpiCard label="Total expenses" value={report.totals.expenses} currency={currency} icon={<ArrowUpToLine />} tone="red" caption={`${report.rows.filter((row) => row.expenseAmount > 0).length} entries`} />
            <KpiCard label="Net balance" value={report.totals.balance} currency={currency} icon={<WalletCards />} tone={report.totals.balance >= 0 ? "blue" : "red"} caption={report.totals.balance >= 0 ? "Positive position" : "Needs attention"} />
            <KpiCard label="Exceptions" value={report.totals.exceptionCount} currency="" icon={<AlertTriangle />} tone={report.totals.exceptionCount ? "amber" : "green"} caption={report.totals.exceptionCount ? "Needs review" : "All clear"} integer />
          </section>

          <section className="grid gap-4 print:hidden xl:grid-cols-[1.65fr_1fr]">
            <ChartCard title="Income vs expenses" subtitle="Monthly movement in the selected period" empty={!chartData.length}>
              {chartData.length ? (
                <div className="h-56 sm:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 4, left: -18, bottom: 0 }} barGap={5}>
                      <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#6b7280" }} tickFormatter={(value) => compactNumber(value)} />
                      <Tooltip contentStyle={tooltipStyle} formatter={((value: unknown, name: unknown) => [formatCurrency(Number(value) || 0, currency), name === "income" ? "Income" : "Expenses"]) as never} />
                      <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                      <Bar dataKey="expenses" fill="#fb7185" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : <EmptyChart />}
            </ChartCard>
            <ChartCard title="Income composition" subtitle="Where reported income came from" empty={report.totals.income + report.totals.expenses <= 0}>
              <div className="flex h-56 items-center gap-0 sm:h-64 sm:gap-2">
                {report.totals.income + report.totals.expenses > 0 ? (
                  <>
                    <div className="h-full min-w-0 flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={[{ name: "Income", value: report.totals.income }, { name: "Expenses", value: report.totals.expenses }]} dataKey="value" innerRadius={58} outerRadius={82} paddingAngle={3} stroke="none">
                            <Cell fill="#10b981" /><Cell fill="#fb7185" />
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} formatter={((value: unknown) => formatCurrency(Number(value) || 0, currency)) as never} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-28 space-y-3 text-xs">
                      <LegendDot color="#10b981" label="Income" value={report.totals.income} currency={currency} />
                      <LegendDot color="#fb7185" label="Expenses" value={report.totals.expenses} currency={currency} />
                      <div className="border-t pt-2 text-muted-foreground">Margin <strong className="block text-sm text-foreground">{report.totals.income ? `${Math.round((report.totals.balance / report.totals.income) * 100)}%` : "—"}</strong></div>
                    </div>
                  </>
                ) : <EmptyChart />}
              </div>
            </ChartCard>
          </section>

          <section className="grid gap-4 print:hidden lg:grid-cols-[1fr_1fr]">
            <ChartCard title="Fund distribution" subtitle="Income grouped by fund" empty={!fundData.length}>
              {fundData.length ? (
                <div className="space-y-3 pt-1">
                  {fundData.slice(0, 5).map((item, index) => (
                    <div key={item.name}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 font-medium"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />{item.name}</span>
                        <span className="font-semibold tabular-nums">{formatCurrency(item.value, currency)}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${(item.value / (fundData[0]?.value || 1)) * 100}%`, backgroundColor: chartColors[index % chartColors.length] }} /></div>
                    </div>
                  ))}
                </div>
              ) : <EmptyChart />}
            </ChartCard>
            <ChartCard title="Management by exception" subtitle="Items that need review before closing" empty={!exceptionRows.length}>
              {exceptionRows.length ? (
                <div className="space-y-2">
                  {exceptionRows.slice(0, 4).map((row) => <div key={row.id} className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-xs"><span className="min-w-0 truncate font-medium text-amber-950">{row.description}</span><span className="ml-3 shrink-0 rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">{row.exceptionReason}</span></div>)}
                  {exceptionRows.length > 4 && <p className="pt-1 text-xs text-muted-foreground">+ {exceptionRows.length - 4} more exception(s) shown in the table below.</p>}
                </div>
              ) : <EmptyChart message="No exceptions in this period" />}
            </ChartCard>
          </section>

          <section id="financial-report-preview" className="overflow-hidden rounded-xl border bg-white shadow-sm print:hidden">
            <div className="flex flex-col gap-2 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary print:hidden"><FileText className="h-3.5 w-3.5" /> Live preview</div><h2 className="mt-1 text-lg font-bold">{reportTitle}</h2></div>
                <div className="text-left text-xs text-muted-foreground sm:text-right">Showing <strong className="text-foreground">{report.rows.length}</strong> transactions · YTD <strong className="text-foreground">{formatCurrency(report.ytd.balance, currency)}</strong></div>
            </div>
            {report.rows.length ? (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-3 font-semibold">Date</th><th className="px-5 py-3 font-semibold">Description</th><th className="px-5 py-3 font-semibold">Fund type</th><th className="px-5 py-3 text-right font-semibold">Income</th><th className="px-5 py-3 text-right font-semibold">Expense</th><th className="px-5 py-3 text-right font-semibold">Net balance</th></tr></thead>
                    <tbody className="divide-y">{report.rows.map((row) => <tr key={row.id} className={row.isException ? "bg-amber-50/70" : "hover:bg-slate-50"}><td className="whitespace-nowrap px-5 py-3 text-xs text-muted-foreground">{formatDate(row.date)}</td><td className="max-w-[280px] truncate px-5 py-3 font-medium">{row.description}{row.isException && <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">{row.exceptionReason}</span>}</td><td className="px-5 py-3 text-xs text-muted-foreground">{row.fundType}</td><td className="px-5 py-3 text-right tabular-nums text-emerald-700">{row.incomeAmount ? formatCurrency(row.incomeAmount, currency) : "—"}</td><td className="px-5 py-3 text-right tabular-nums text-rose-700">{row.expenseAmount ? formatCurrency(row.expenseAmount, currency) : "—"}</td><td className={`px-5 py-3 text-right font-semibold tabular-nums ${row.netBalance < 0 ? "text-rose-700" : ""}`}>{formatCurrency(row.netBalance, currency)}</td></tr>)}</tbody>
                    <tfoot className="border-t-2 bg-slate-50 font-bold"><tr><td colSpan={3} className="px-5 py-3.5">Report totals</td><td className="px-5 py-3.5 text-right tabular-nums text-emerald-700">{formatCurrency(report.totals.income, currency)}</td><td className="px-5 py-3.5 text-right tabular-nums text-rose-700">{formatCurrency(report.totals.expenses, currency)}</td><td className={`px-5 py-3.5 text-right tabular-nums ${report.totals.balance < 0 ? "text-rose-700" : ""}`}>{formatCurrency(report.totals.balance, currency)}</td></tr></tfoot>
                  </table>
                </div>
                <div className="divide-y md:hidden">
                  {report.rows.map((row) => (
                    <article key={row.id} className={`px-4 py-3.5 ${row.isException ? "bg-amber-50/70" : ""}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{row.description}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {formatDate(row.date)} <span className="mx-1">·</span> {row.fundType}
                          </p>
                        </div>
                        <p className={`shrink-0 text-sm font-bold tabular-nums ${row.netBalance < 0 ? "text-rose-700" : "text-foreground"}`}>
                          {formatCurrency(row.netBalance, currency)}
                        </p>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-md bg-emerald-50 px-2.5 py-1.5">
                          <p className="text-[10px] uppercase tracking-wide text-emerald-700/70">Income</p>
                          <p className="mt-0.5 font-semibold tabular-nums text-emerald-700">{row.incomeAmount ? formatCurrency(row.incomeAmount, currency) : "—"}</p>
                        </div>
                        <div className="rounded-md bg-rose-50 px-2.5 py-1.5">
                          <p className="text-[10px] uppercase tracking-wide text-rose-700/70">Expense</p>
                          <p className="mt-0.5 font-semibold tabular-nums text-rose-700">{row.expenseAmount ? formatCurrency(row.expenseAmount, currency) : "—"}</p>
                        </div>
                      </div>
                      {row.isException && <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">{row.exceptionReason} · review required</span>}
                    </article>
                  ))}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 px-4 py-3 text-xs font-bold">
                    <span>Totals</span>
                    <span className="text-right tabular-nums text-emerald-700">{formatCurrency(report.totals.income, currency)}</span>
                    <span className="text-right tabular-nums text-rose-700">{formatCurrency(report.totals.expenses, currency)}</span>
                  </div>
                </div>
              </>
            ) : <div className="px-5 py-16 text-center text-sm text-muted-foreground">No financial activity matches the selected filters.</div>}
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

function FilterInput({ label, type, value, min, onChange }: { label: string; type: string; value: string; min?: string; onChange: (value: string) => void }) {
  return <label className="text-xs font-semibold text-muted-foreground">{label}<input type={type} value={value} min={min} onChange={(event) => onChange(event.target.value)} className="mt-1 h-9 w-full rounded-md border bg-background px-2.5 text-sm font-normal text-foreground outline-none focus:ring-2 focus:ring-primary/20" /></label>;
}

function KpiCard({ label, value, currency, icon, tone, caption, integer = false }: { label: string; value: number; currency: string; icon: React.ReactNode; tone: "green" | "red" | "blue" | "amber"; caption: string; integer?: boolean }) {
  const styles = { green: "bg-emerald-50 text-emerald-700", red: "bg-rose-50 text-rose-700", blue: "bg-sky-50 text-sky-700", amber: "bg-amber-50 text-amber-700" };
  return <div className="flex min-h-[126px] flex-col rounded-xl border bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-2"><p className="min-w-0 flex-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p><span className={`shrink-0 rounded-lg p-2 ${styles[tone]}`}>{icon}</span></div><p className={`mt-2 break-all text-lg font-bold leading-tight tracking-tight sm:text-xl ${tone === "red" && value < 0 ? "text-rose-700" : ""}`}>{integer ? value : formatCurrency(value, currency)}</p><p className="mt-auto pt-2 text-xs leading-4 text-muted-foreground">{caption}</p></div>;
}

function ChartCard({ title, subtitle, children, empty = false }: { title: string; subtitle: string; children: React.ReactNode; empty?: boolean }) {
  return <div className={`flex flex-col rounded-xl border bg-white p-4 shadow-sm ${empty ? "min-h-0" : "min-h-[316px]"}`}><div className="mb-3 shrink-0"><h2 className="text-sm font-bold">{title}</h2><p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p></div><div className={empty ? "" : "min-h-0 flex-1"}>{children}</div></div>;
}

function LegendDot({ color, label, value, currency }: { color: string; label: string; value: number; currency: string }) {
  return <div className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full" style={{ backgroundColor: color }} /><span>{label}<strong className="block text-xs text-foreground">{formatCurrency(value, currency)}</strong></span></div>;
}

function EmptyChart({ message = "No amount recorded for this period" }: { message?: string }) {
  return <div className="flex min-h-[220px] w-full items-center justify-center gap-2 rounded-lg bg-emerald-50 px-5 text-center text-sm font-medium text-emerald-800"><span className="rounded-full bg-emerald-100 p-1.5">✓</span><span>{message}</span></div>;
}

function buildChartData(rows: ReportRow[]) {
  const groups = new Map<string, { label: string; income: number; expenses: number; sort: string }>();
  rows.forEach((row) => {
    const key = row.date.slice(0, 7);
    const date = new Date(`${key}-01T00:00:00`);
    const current = groups.get(key) || { label: date.toLocaleString("en-US", { month: "short" }), income: 0, expenses: 0, sort: key };
    current.income += row.incomeAmount;
    current.expenses += row.expenseAmount;
    groups.set(key, current);
  });
  return Array.from(groups.values()).sort((a, b) => a.sort.localeCompare(b.sort));
}

function buildFundData(rows: ReportRow[]) {
  const totals = new Map<string, number>();
  rows.forEach((row) => totals.set(row.fundType, (totals.get(row.fundType) || 0) + row.incomeAmount));
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
