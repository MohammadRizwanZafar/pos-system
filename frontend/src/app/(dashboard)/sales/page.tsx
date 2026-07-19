"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import Header from "@/components/layout/Header";
import PageLoader from "@/components/ui/PageLoader";
import PeriodFilter, { type Period } from "@/components/ui/PeriodFilter";
import { Pagination, SearchInput } from "@/components/ui/TableControls";
import { apiGet } from "@/lib/api";
import { formatCurrency, formatDateTime, getDateRange } from "@/lib/utils";
import type { PaginatedData, Sale } from "@/types";

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 10;

  useEffect(() => {
    const fetchSales = async () => {
      setLoading(true);
      try {
        const { from_date, to_date } = getDateRange(period, customFrom, customTo);
        const data = await apiGet<PaginatedData<Sale>>("/sales", {
          from_date,
          to_date,
          search: search.trim() || undefined,
          page,
          per_page: perPage,
        });
        setSales(data.items);
        setTotalPages(data.meta.last_page);
        setTotal(data.meta.total);
      } catch {
        setSales([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    if (period !== "custom" || (customFrom && customTo)) {
      const timer = setTimeout(fetchSales, 300);
      return () => clearTimeout(timer);
    }
  }, [period, customFrom, customTo, page, search]);

  const totalAmount = sales.reduce(
    (sum, s) => sum + Number(s.net_total ?? s.total),
    0
  );

  return (
    <div>
      <Header title="Sales" subtitle="View sales history and invoices" />

      <PeriodFilter
        period={period}
        onPeriodChange={(value) => {
          setPeriod(value);
          setPage(1);
        }}
        customFrom={customFrom}
        customTo={customTo}
        onCustomFromChange={(value) => {
          setCustomFrom(value);
          setPage(1);
        }}
        onCustomToChange={(value) => {
          setCustomTo(value);
          setPage(1);
        }}
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search by invoice or cashier..."
          className="w-full max-w-md"
        />
        {!loading && sales.length > 0 && (
          <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 ring-1 ring-emerald-200/60">
            <span className="text-sm font-semibold text-emerald-800">
              {total} sales · {formatCurrency(totalAmount)} on this page
            </span>
          </div>
        )}
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Date</th>
              <th>Cashier</th>
              <th>Status</th>
              <th>Subtotal</th>
              <th>Discount</th>
              <th>Tax</th>
              <th>Total</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9}>
                  <PageLoader label="Loading sales..." />
                </td>
              </tr>
            ) : sales.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center font-medium text-slate-500">
                  No sales found for this period
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr key={sale.id}>
                  <td>
                    <span className="font-bold text-primary-700">{sale.invoice_no}</span>
                  </td>
                  <td className="text-slate-600">{formatDateTime(sale.created_at)}</td>
                  <td>{sale.user?.name ?? "—"}</td>
                  <td>
                    {sale.status === "partially_returned" ? (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
                        Partial Return
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                        Completed
                      </span>
                    )}
                  </td>
                  <td title={formatCurrency(sale.subtotal)}>{formatCurrency(sale.subtotal)}</td>
                  <td className="text-slate-500" title={formatCurrency(sale.discount)}>{formatCurrency(sale.discount)}</td>
                  <td className="text-slate-500" title={formatCurrency(sale.tax)}>{formatCurrency(sale.tax)}</td>
                  <td className="font-bold text-slate-900" title={formatCurrency(sale.net_total ?? sale.total)}>
                    {formatCurrency(sale.net_total ?? sale.total)}
                    {sale.refunded_amount && Number(sale.refunded_amount) > 0 ? (
                      <span
                        className="mt-0.5 block text-xs font-medium text-amber-600"
                        title={`Refunded ${formatCurrency(sale.refunded_amount)}`}
                      >
                        Refunded {formatCurrency(sale.refunded_amount)}
                      </span>
                    ) : null}
                  </td>
                  <td>
                    <div className="flex justify-end">
                      <Link
                        href={`/sales/${sale.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-primary-50 hover:text-primary-700"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          perPage={perPage}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
