"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import PageLoader from "@/components/ui/PageLoader";
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
  const admin = isAdmin();

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};

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
      fetchReport();
    } else {
      setLoading(false);
    }
  }, [tab, date, from, to, month]);

  const stats = [
    {
      label: "Revenue",
      value: formatCurrency(report?.total_sales ?? 0),
      accent: "from-emerald-500 to-teal-600",
    },
    {
      label: "Transactions",
      value: String(report?.order_count ?? 0),
      accent: "from-blue-500 to-indigo-600",
    },
    {
      label: "Profit",
      value: formatCurrency(report?.profit ?? 0),
      accent: "from-amber-500 to-orange-600",
    },
  ];

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
            onClick={() => setTab(t)}
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
            onChange={(e) => setDate(e.target.value)}
          />
        )}
        {tab === "weekly" && (
          <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 ring-1 ring-slate-200">
            <input
              type="date"
              className="input-field w-auto border-0 bg-transparent px-2 py-1.5 shadow-none focus:ring-0"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <span className="text-slate-400">→</span>
            <input
              type="date"
              className="input-field w-auto border-0 bg-transparent px-2 py-1.5 shadow-none focus:ring-0"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        )}
        {tab === "monthly" && (
          <input
            type="month"
            className="input-field w-auto"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        )}
      </div>

      {loading ? (
        <PageLoader />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="card-stat">
                <div
                  className={`absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br ${stat.accent} opacity-10`}
                />
                <p className="relative text-sm font-semibold text-slate-500">
                  {stat.label}
                </p>
                <p className="relative mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {report?.sales && report.sales.length > 0 && (
            <div className="table-container mt-6">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Date</th>
                    <th>Cashier</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.sales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="font-bold text-primary-700">{sale.invoice_no}</td>
                      <td className="text-slate-600">
                        {new Date(sale.created_at).toLocaleString()}
                      </td>
                      <td>{sale.user?.name ?? "—"}</td>
                      <td className="text-right font-bold">
                        {formatCurrency(sale.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
