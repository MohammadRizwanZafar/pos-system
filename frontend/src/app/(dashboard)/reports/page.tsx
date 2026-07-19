"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import PageLoader from "@/components/ui/PageLoader";
import { Pagination, SearchInput } from "@/components/ui/TableControls";
import { apiGet } from "@/lib/api";
import { isAdmin } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import type { ReportData } from "@/types";

type Tab = "daily" | "weekly" | "monthly";

function getMonthRange(month: string): { from_date: string; to_date: string } {
  const [year, m] = month.split("-").map(Number);
  const start = new Date(year, m - 1, 1);
  const end = new Date(year, m, 0);
  return {
    from_date: start.toISOString().split("T")[0],
    to_date: end.toISOString().split("T")[0],
  };
}

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>("daily");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [month, setMonth] = useState(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
  );
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const admin = isAdmin();
  const perPage = 10;

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        params.page = String(page);
        params.per_page = String(perPage);
        if (search.trim()) params.search = search.trim();

        if (tab === "daily") {
          params.type = "date-range";
          params.from_date = date;
          params.to_date = date;
        } else if (tab === "weekly") {
          if (from && to) {
            params.type = "date-range";
            params.from_date = from;
            params.to_date = to;
          } else {
            params.type = "weekly";
          }
        } else {
          if (month) {
            const range = getMonthRange(month);
            params.type = "date-range";
            params.from_date = range.from_date;
            params.to_date = range.to_date;
          } else {
            params.type = "monthly";
          }
        }

        const data = await apiGet<ReportData>("/reports/sales", params);
        setReport(data);
      } catch {
        setReport({
          type: tab,
          from_date: "",
          to_date: "",
          total_sales: 0,
          order_count: 0,
          profit: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    if (tab !== "weekly" || (from && to) || (!from && !to)) {
      const timer = setTimeout(fetchReport, 300);
      return () => clearTimeout(timer);
    } else {
      setLoading(false);
    }
  }, [tab, date, from, to, month, page, search]);

  return (
    <div>
      <Header
        title="Reports"
        subtitle={
          admin
            ? "Full sales and financial reports"
            : "Sales summary reports"
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {(["daily", "weekly", "monthly"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              setPage(1);
            }}
            className={tab === t ? "tab-pill-active" : "tab-pill-inactive"}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        {tab === "daily" && (
          <input
            type="date"
            className="input-field w-auto"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setPage(1);
            }}
          />
        )}
        {tab === "weekly" && (
          <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 ring-1 ring-slate-200">
            <input
              type="date"
              className="input-field w-auto border-0 bg-transparent px-2 py-1.5 shadow-none focus:ring-0"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
            />
            <span className="text-slate-400">→</span>
            <input
              type="date"
              className="input-field w-auto border-0 bg-transparent px-2 py-1.5 shadow-none focus:ring-0"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
            />
          </div>
        )}
        {tab === "monthly" && (
          <input
            type="month"
            className="input-field w-auto"
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              setPage(1);
            }}
          />
        )}
      </div>

      {loading ? (
        <PageLoader />
      ) : (
        <>
          {report?.sales && report.sales.length > 0 ? (
            <>
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Search by invoice or cashier..."
              className="mb-4 max-w-md"
            />
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Date</th>
                    <th>Cashier</th>
                    <th className="text-right">Sale Total</th>
                    <th className="text-right">Cash Received</th>
                    <th className="text-right">Change Returned</th>
                  </tr>
                </thead>
                <tbody>
                  {report.sales.map((sale) => (
                    <tr key={sale.id}>
                      <td>
                        <Link
                          href={`/sales/${sale.id}`}
                          className="font-bold text-primary-700 transition hover:text-primary-900 hover:underline"
                        >
                          {sale.invoice_no}
                        </Link>
                      </td>
                      <td className="text-slate-600">
                        {new Date(sale.created_at).toLocaleString()}
                      </td>
                      <td>{sale.user?.name ?? "—"}</td>
                      <td className="text-right font-bold" title={formatCurrency(sale.net_total ?? sale.total)}>
                        {formatCurrency(sale.net_total ?? sale.total)}
                      </td>
                      <td
                        className="text-right font-semibold text-slate-700"
                        title={formatCurrency(sale.amount_paid)}
                      >
                        {formatCurrency(sale.amount_paid)}
                      </td>
                      <td
                        className="text-right font-semibold text-emerald-700"
                        title={formatCurrency(sale.change_amount)}
                      >
                        {formatCurrency(sale.change_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                page={page}
                totalPages={report.sales_meta?.last_page ?? 1}
                total={report.sales_meta?.total ?? report.sales.length}
                perPage={perPage}
                onPageChange={setPage}
              />
            </div>
            </>
          ) : (
            <div className="table-container py-12 text-center">
              <p className="font-medium text-slate-500">
                No sales found for this period
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
