"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import PageLoader from "@/components/ui/PageLoader";
import SaleInvoice from "@/components/sales/SaleInvoice";
import { apiGet } from "@/lib/api";
import { printSaleReceipt } from "@/lib/printReceipt";
import { formatDateTime } from "@/lib/utils";
import type { Sale, StoreSettings } from "@/types";

export default function SaleDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [sale, setSale] = useState<Sale | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [saleData, storeSettings] = await Promise.all([
          apiGet<Sale>(`/sales/${id}`),
          apiGet<StoreSettings>("/settings").catch(() => null),
        ]);
        setSale(saleData);
        setSettings(storeSettings);
      } catch {
        setSale(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return <PageLoader />;
  }

  if (!sale) {
    return (
      <div className="text-center">
        <p className="font-medium text-slate-500">Sale not found</p>
        <Link href="/sales" className="btn-primary mt-4 inline-flex">
          Back to Sales
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="no-print mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/sales"
            className="rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Invoice {sale.invoice_no}
            </h1>
            <p className="text-sm font-medium text-slate-500">
              {formatDateTime(sale.created_at)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => printSaleReceipt(sale, settings)}
          className="btn-secondary"
        >
          <Printer className="h-4 w-4" />
          Print
        </button>
      </div>

      <SaleInvoice sale={sale} settings={settings} />
    </div>
  );
}
