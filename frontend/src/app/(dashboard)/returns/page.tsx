"use client";

import { FormEvent, useMemo, useState } from "react";
import { Search, RotateCcw } from "lucide-react";
import Header from "@/components/layout/Header";
import { apiGet, apiPost } from "@/lib/api";
import { formatCurrency, formatDateTime, getApiErrorMessage } from "@/lib/utils";
import type { ReturnableSale, SaleReturn } from "@/types";

type ReturnQtyMap = Record<number, string>;

export default function ReturnsPage() {
  const [invoiceNo, setInvoiceNo] = useState("");
  const [sale, setSale] = useState<ReturnableSale | null>(null);
  const [returnQty, setReturnQty] = useState<ReturnQtyMap>({});
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const refundableAmount = useMemo(() => {
    if (!sale) return 0;
    return sale.items.reduce((sum, item) => {
      const qty = Number(returnQty[item.id] || 0);
      if (!qty || qty < 0) return sum;
      return sum + qty * Number(item.price);
    }, 0);
  }, [sale, returnQty]);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!invoiceNo.trim()) return;

    setLoading(true);
    setError("");
    setSuccess("");
    setSale(null);
    setReturnQty({});

    try {
      const data = await apiGet<ReturnableSale>(`/returns/sale-by-invoice/${encodeURIComponent(invoiceNo.trim())}`);
      setSale(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleProcessReturn = async () => {
    if (!sale) return;

    const items = sale.items
      .map((item) => ({
        sale_item_id: item.id,
        quantity: Number(returnQty[item.id] || 0),
        max: item.remaining_quantity,
        product_name: item.product_name,
      }))
      .filter((item) => item.quantity > 0);

    if (items.length === 0) {
      setError("Please enter at least one return quantity.");
      return;
    }

    const invalid = items.find((item) => item.quantity > item.max);
    if (invalid) {
      setError(`Return quantity for ${invalid.product_name} exceeds remaining stock.`);
      return;
    }

    setProcessing(true);
    setError("");
    setSuccess("");

    try {
      const data = await apiPost<SaleReturn>(`/sales/${sale.id}/returns`, {
        items: items.map((item) => ({
          sale_item_id: item.sale_item_id,
          quantity: item.quantity,
        })),
        note: note || undefined,
      });

      setSuccess(`Return recorded (${data.return_no}) · Refund ${formatCurrency(data.refund_amount)}`);
      setNote("");
      setInvoiceNo("");
      setSale(null);
      setReturnQty({});
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <Header title="Sale Returns" subtitle="Process refunds and restock returned items" />

      {(error || success) && (
        <div
          className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold ${
            error
              ? "border border-red-200 bg-red-50 text-red-600"
              : "border border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error || success}
        </div>
      )}

      <div className="card mb-6">
        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Invoice Number</label>
            <input
              className="input-field"
              placeholder="e.g. INV-20260708-0001"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            <Search className="h-4 w-4" />
            {loading ? "Finding..." : "Find Sale"}
          </button>
        </form>
      </div>

      {sale && (
        <div className="card space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-500">Invoice</p>
              <p className="text-xl font-bold text-slate-900">{sale.invoice_no}</p>
              <p className="text-sm text-slate-500">{formatDateTime(sale.created_at)}</p>
            </div>
            <div className="rounded-xl bg-slate-900 px-4 py-3 text-white">
              <p className="text-xs uppercase tracking-wide text-slate-300">Refund preview</p>
              <p className="text-lg font-bold" title={formatCurrency(refundableAmount)}>
                {formatCurrency(refundableAmount)}
              </p>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Price</th>
                  <th>Sold</th>
                  <th>Returned</th>
                  <th>Remaining</th>
                  <th>Return Qty</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item) => (
                  <tr key={item.id}>
                    <td className="font-semibold">{item.product_name}</td>
                    <td>{formatCurrency(item.price)}</td>
                    <td>{item.quantity}</td>
                    <td>{item.returned_quantity}</td>
                    <td className="font-semibold text-emerald-700">{item.remaining_quantity}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max={item.remaining_quantity}
                        className="input-field w-28"
                        value={returnQty[item.id] ?? ""}
                        onChange={(e) =>
                          setReturnQty((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        disabled={item.remaining_quantity <= 0}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Note (optional)</label>
            <textarea
              className="input-field min-h-24"
              placeholder="Reason of return..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <button type="button" className="btn-primary" onClick={handleProcessReturn} disabled={processing}>
              <RotateCcw className="h-4 w-4" />
              {processing ? "Processing..." : "Process Return"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
