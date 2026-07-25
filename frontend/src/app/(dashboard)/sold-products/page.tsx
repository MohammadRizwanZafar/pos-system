"use client";

import { useEffect, useState } from "react";
import { Boxes, PackageCheck } from "lucide-react";
import Header from "@/components/layout/Header";
import PageLoader from "@/components/ui/PageLoader";
import PeriodFilter, { type Period } from "@/components/ui/PeriodFilter";
import { Pagination, SearchInput } from "@/components/ui/TableControls";
import { apiGet } from "@/lib/api";
import { formatCurrency, formatDate, getDateRange } from "@/lib/utils";
import type { SoldProductsData } from "@/types";

export default function SoldProductsPage() {
  const [period, setPeriod] = useState<Period>("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<SoldProductsData | null>(null);
  const [loading, setLoading] = useState(true);
  const perPage = 10;

  useEffect(() => {
    if (period === "custom" && (!customFrom || !customTo)) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { from_date, to_date } = getDateRange(period, customFrom, customTo);
        const result = await apiGet<SoldProductsData>("/sold-products", {
          period,
          from_date,
          to_date,
          page,
          per_page: perPage,
          search: search.trim() || undefined,
        });
        if (!cancelled) setData(result);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [period, customFrom, customTo, search, page]);

  const items = data?.items ?? [];
  const totalPages = data?.meta?.last_page ?? 1;
  const total = data?.meta?.total ?? data?.product_count ?? 0;

  return (
    <div>
      <Header
        title="Sold Products"
        subtitle="Search by name or SKU — see quantity sold in Today / Week / Month"
      />

      <PeriodFilter
        period={period}
        onPeriodChange={(p) => {
          setPeriod(p);
          setPage(1);
        }}
        customFrom={customFrom}
        customTo={customTo}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md">
            <PackageCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Products Sold</p>
            <p className="text-2xl font-extrabold text-slate-900">{data?.product_count ?? 0}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
            <Boxes className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Total Quantity</p>
            <p className="text-2xl font-extrabold text-slate-900">{data?.total_quantity ?? 0}</p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search by product name or SKU..."
        />
      </div>

      {loading ? (
        <PageLoader label="Loading sold products..." />
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-bold">#</th>
                  <th className="px-4 py-3 font-bold">Date</th>
                  <th className="px-4 py-3 font-bold">Product</th>
                  <th className="px-4 py-3 font-bold">SKU</th>
                  <th className="px-4 py-3 font-bold text-right">Qty Sold</th>
                  <th className="px-4 py-3 font-bold text-right">Times Sold</th>
                  <th className="px-4 py-3 font-bold text-right">Cost</th>
                  <th className="px-4 py-3 font-bold text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                      No products sold in this period
                    </td>
                  </tr>
                ) : (
                  items.map((row, index) => (
                    <tr key={`${row.sold_date}-${row.product_id ?? row.product_name}-${index}`} className="border-b border-slate-50 hover:bg-slate-50/80">
                      <td className="px-4 py-3 text-slate-400">
                        {(page - 1) * perPage + index + 1}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {formatDate(row.sold_date)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800" title={row.product_name}>
                        {row.product_name}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600" title={row.sku ?? ""}>
                        {row.sku ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-lg font-extrabold text-emerald-700">
                        {row.quantity_sold}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-700">
                        {row.times_sold}
                      </td>
                      <td
                        className="px-4 py-3 text-right font-semibold text-amber-700"
                        title={formatCurrency(row.total_cost)}
                      >
                        {formatCurrency(row.total_cost)}
                      </td>
                      <td
                        className="px-4 py-3 text-right font-semibold text-slate-700"
                        title={formatCurrency(row.net_amount)}
                      >
                        {formatCurrency(row.net_amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            perPage={perPage}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
