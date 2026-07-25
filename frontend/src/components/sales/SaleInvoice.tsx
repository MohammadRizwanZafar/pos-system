import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Sale, StoreSettings } from "@/types";

interface SaleInvoiceProps {
  sale: Sale;
  settings?: StoreSettings | null;
  className?: string;
}

/** On-screen invoice card — same layout used for POS / Sales print. */
export default function SaleInvoice({ sale, settings, className }: SaleInvoiceProps) {
  const symbol = settings?.currency_symbol ?? "Rs.";

  return (
    <div
      className={
        className ??
        "print-area card mx-auto max-w-2xl border-dashed border-slate-300"
      }
    >
      <div className="mb-6 border-b border-dashed border-slate-200 pb-6 text-center">
        <h2 className="text-2xl font-bold text-slate-900">
          {settings?.store_name ?? "POS Store"}
        </h2>
        {settings?.address && (
          <p className="mt-1 text-sm text-slate-500">{settings.address}</p>
        )}
        {settings?.phone && (
          <p className="text-sm text-slate-500">{settings.phone}</p>
        )}
        <p className="mt-2 text-xs font-medium text-slate-400">
          {formatDateTime(sale.created_at)}
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Invoice No
          </p>
          <p className="mt-1 font-bold text-slate-900">{sale.invoice_no}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Cashier
          </p>
          <p className="mt-1 font-bold text-slate-900">{sale.user?.name ?? "—"}</p>
        </div>
      </div>

      <div className="table-container mb-6 border-dashed">
        <table className="data-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items?.map((item) => (
              <tr key={item.id}>
                <td className="font-medium">{item.product_name}</td>
                <td>{item.quantity}</td>
                <td>{formatCurrency(item.price, symbol)}</td>
                <td className="text-right font-semibold">
                  {formatCurrency(item.total, symbol)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 border-t border-dashed border-slate-200 pt-4 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>Subtotal</span>
          <span>{formatCurrency(sale.subtotal, symbol)}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Discount</span>
          <span>{formatCurrency(sale.discount, symbol)}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Tax</span>
          <span>{formatCurrency(sale.tax, symbol)}</span>
        </div>
        <div className="flex justify-between rounded-xl bg-slate-900 px-4 py-3 text-base font-bold text-white">
          <span>Total</span>
          <span>{formatCurrency(sale.total, symbol)}</span>
        </div>
        <div className="flex justify-between pt-2 text-slate-600">
          <span>Amount Paid</span>
          <span>{formatCurrency(sale.amount_paid, symbol)}</span>
        </div>
        <div className="flex justify-between font-semibold text-emerald-700">
          <span>Change</span>
          <span>{formatCurrency(sale.change_amount, symbol)}</span>
        </div>
      </div>

      {sale.note && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Note: {sale.note}
        </p>
      )}

      {settings?.receipt_footer && (
        <p className="mt-8 text-center text-xs font-medium text-slate-400">
          {settings.receipt_footer}
        </p>
      )}
    </div>
  );
}
