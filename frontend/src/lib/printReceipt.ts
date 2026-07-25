import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Sale, StoreSettings } from "@/types";

function esc(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * HTML that mirrors SaleInvoice / Sales detail invoice UI
 * so POS print and Sales print look the same.
 */
export function buildReceiptHtml(sale: Sale, settings?: StoreSettings | null): string {
  const symbol = settings?.currency_symbol ?? "Rs.";
  const storeName = settings?.store_name ?? "POS Store";
  const items = sale.items ?? [];

  const rows =
    items.length > 0
      ? items
          .map(
            (item) => `
            <tr>
              <td style="padding:12px 16px;border-bottom:1px solid #f8fafc;font-weight:500;color:#0f172a;">${esc(item.product_name)}</td>
              <td style="padding:12px 16px;border-bottom:1px solid #f8fafc;color:#334155;">${esc(item.quantity)}</td>
              <td style="padding:12px 16px;border-bottom:1px solid #f8fafc;color:#334155;">${esc(formatCurrency(item.price, symbol))}</td>
              <td style="padding:12px 16px;border-bottom:1px solid #f8fafc;text-align:right;font-weight:600;color:#0f172a;">${esc(formatCurrency(item.total, symbol))}</td>
            </tr>`
          )
          .join("")
      : `<tr><td colspan="4" style="padding:16px;text-align:center;color:#94a3b8;">No items</td></tr>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice ${esc(sale.invoice_no)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      background: #fff;
      color: #0f172a;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      font-size: 14px;
    }
    .card {
      max-width: 42rem;
      margin: 0 auto;
      border: 1px dashed #cbd5e1;
      border-radius: 1rem;
      padding: 1.5rem;
      background: #fff;
    }
    .store { text-align: center; border-bottom: 1px dashed #e2e8f0; padding-bottom: 1.5rem; margin-bottom: 1.5rem; }
    .store h1 { margin: 0; font-size: 1.5rem; font-weight: 700; letter-spacing: -0.02em; }
    .store p { margin: 0.25rem 0 0; color: #64748b; font-size: 0.875rem; }
    .store .date { margin-top: 0.5rem; color: #94a3b8; font-size: 0.75rem; font-weight: 500; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
    .meta-box { background: #f8fafc; border-radius: 0.75rem; padding: 0.75rem; }
    .meta-box .label { margin: 0; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #94a3b8; }
    .meta-box .value { margin: 0.25rem 0 0; font-weight: 700; color: #0f172a; }
    .table-wrap { border: 1px dashed #e2e8f0; border-radius: 1rem; overflow: hidden; margin-bottom: 1.5rem; }
    table { width: 100%; border-collapse: collapse; }
    thead { background: #f8fafc; }
    th {
      text-align: left;
      padding: 12px 16px;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #64748b;
      border-bottom: 1px solid #f1f5f9;
    }
    th.right { text-align: right; }
    .totals { border-top: 1px dashed #e2e8f0; padding-top: 1rem; }
    .row { display: flex; justify-content: space-between; margin: 0.4rem 0; color: #475569; }
    .total-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: 0.75rem;
      background: #0f172a;
      color: #fff;
      font-size: 1rem;
      font-weight: 700;
    }
    .change { display: flex; justify-content: space-between; margin-top: 0.5rem; color: #047857; font-weight: 600; }
    .note {
      margin-top: 1rem;
      padding: 0.5rem 0.75rem;
      border-radius: 0.5rem;
      background: #fffbeb;
      color: #92400e;
      font-size: 0.875rem;
    }
    .footer {
      margin-top: 2rem;
      text-align: center;
      font-size: 0.75rem;
      font-weight: 500;
      color: #94a3b8;
    }
    @media print {
      body { padding: 0; }
      .card { border: none; max-width: 100%; padding: 0; }
      @page { margin: 12mm; }
    }
    @media (max-width: 640px) {
      .meta { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="store">
      <h1>${esc(storeName)}</h1>
      ${settings?.address ? `<p>${esc(settings.address)}</p>` : ""}
      ${settings?.phone ? `<p>${esc(settings.phone)}</p>` : ""}
      <p class="date">${esc(formatDateTime(sale.created_at))}</p>
    </div>

    <div class="meta">
      <div class="meta-box">
        <p class="label">Invoice No</p>
        <p class="value">${esc(sale.invoice_no)}</p>
      </div>
      <div class="meta-box">
        <p class="label">Cashier</p>
        <p class="value">${esc(sale.user?.name ?? "—")}</p>
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th class="right">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div class="totals">
      <div class="row"><span>Subtotal</span><span>${esc(formatCurrency(sale.subtotal, symbol))}</span></div>
      <div class="row"><span>Discount</span><span>${esc(formatCurrency(sale.discount, symbol))}</span></div>
      <div class="row"><span>Tax</span><span>${esc(formatCurrency(sale.tax, symbol))}</span></div>
      <div class="total-bar"><span>Total</span><span>${esc(formatCurrency(sale.total, symbol))}</span></div>
      <div class="row" style="margin-top:0.75rem;"><span>Amount Paid</span><span>${esc(formatCurrency(sale.amount_paid, symbol))}</span></div>
      <div class="change"><span>Change</span><span>${esc(formatCurrency(sale.change_amount, symbol))}</span></div>
    </div>

    ${sale.note ? `<p class="note">Note: ${esc(sale.note)}</p>` : ""}
    ${
      settings?.receipt_footer
        ? `<p class="footer">${esc(settings.receipt_footer)}</p>`
        : ""
    }
  </div>
</body>
</html>`;
}

/** Print invoice via hidden iframe — same UI as Sales detail invoice. */
export function printSaleReceipt(sale: Sale, settings?: StoreSettings | null): void {
  const html = buildReceiptHtml(sale, settings);
  const prev = document.getElementById("pos-receipt-print-frame");
  if (prev) prev.remove();

  const iframe = document.createElement("iframe");
  iframe.id = "pos-receipt-print-frame";
  iframe.setAttribute("title", `Invoice ${sale.invoice_no}`);
  iframe.style.position = "fixed";
  iframe.style.left = "-10000px";
  iframe.style.top = "0";
  iframe.style.width = "800px";
  iframe.style.height = "1100px";
  iframe.style.border = "0";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = win?.document;
  if (!win || !doc) {
    iframe.remove();
    alert("Unable to print invoice. Try again from Sales.");
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const doPrint = () => {
    try {
      win.focus();
      win.print();
    } catch {
      alert("Print dialog could not open. Check printer / browser settings.");
    } finally {
      window.setTimeout(() => iframe.remove(), 1500);
    }
  };

  window.setTimeout(doPrint, 500);
}
