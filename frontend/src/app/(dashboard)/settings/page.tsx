"use client";

import { FormEvent, useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import PageLoader from "@/components/ui/PageLoader";
import { apiGet, apiPut } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/utils";
import type { StoreSettings } from "@/types";

export default function SettingsPage() {
  const [form, setForm] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet<StoreSettings>("/settings")
      .then(setForm)
      .catch(() =>
        setForm({
          id: 0,
          store_name: "My Shop",
          address: "",
          phone: "",
          tax_percent: "0",
          currency_symbol: "Rs.",
          receipt_footer: "",
        })
      )
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const updated = await apiPut<StoreSettings>("/settings", {
        store_name: form.store_name,
        address: form.address || null,
        phone: form.phone || null,
        tax_percent: parseFloat(form.tax_percent),
        currency_symbol: form.currency_symbol,
        receipt_footer: form.receipt_footer || null,
      });
      setForm(updated);
      setMessage("Settings saved successfully");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return <PageLoader />;
  }

  return (
    <div>
      <Header title="Settings" subtitle="Configure store information and tax" />

      <form onSubmit={handleSubmit} className="card max-w-2xl space-y-5 border-emerald-100/60">
        {message && (
          <div className="rounded-lg bg-primary-50 px-4 py-3 text-sm text-primary-700">
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium">Store Name *</label>
          <input
            required
            className="input-field"
            value={form.store_name}
            onChange={(e) => setForm({ ...form, store_name: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Address</label>
          <input
            className="input-field"
            value={form.address ?? ""}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Phone</label>
          <input
            className="input-field"
            value={form.phone ?? ""}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Tax Percent (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              className="input-field"
              value={form.tax_percent}
              onChange={(e) => setForm({ ...form, tax_percent: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Currency Symbol</label>
            <input
              className="input-field"
              value={form.currency_symbol}
              onChange={(e) => setForm({ ...form, currency_symbol: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Receipt Footer</label>
          <textarea
            className="input-field"
            rows={3}
            placeholder="Thank you for shopping with us!"
            value={form.receipt_footer ?? ""}
            onChange={(e) => setForm({ ...form, receipt_footer: e.target.value })}
          />
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
